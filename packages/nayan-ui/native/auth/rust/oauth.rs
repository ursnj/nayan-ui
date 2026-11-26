use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use sha2::{Digest, Sha256};
use subtle::ConstantTimeEq;
use url::{Host, Url, form_urlencoded};

pub const MAX_COMMAND_BYTES: usize = 65536;

#[derive(Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
enum Provider {
    Google,
    Apple,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Options {
    client_id: String,
    redirect_uri: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Transaction {
    provider: Provider,
    redirect_uri: String,
    state: String,
}

#[derive(Deserialize)]
struct Callback {
    url: String,
    body: Option<String>,
}

#[derive(Deserialize)]
#[serde(tag = "action", rename_all = "camelCase")]
enum Command {
    CreateRequest {
        provider: Provider,
        options: Options,
    },
    ReadCallback {
        transaction: Transaction,
        callback: Callback,
    },
}

fn random_token() -> Result<String, &'static str> {
    let mut bytes = [0; 32];
    getrandom::fill(&mut bytes).map_err(|_| "Secure sign-in randomness is unavailable")?;
    Ok(URL_SAFE_NO_PAD.encode(bytes))
}

fn pkce_challenge(verifier: &str) -> String {
    URL_SAFE_NO_PAD.encode(Sha256::digest(verifier.as_bytes()))
}

fn https_url(input: &str) -> Result<Url, &'static str> {
    let url = Url::parse(input).map_err(|_| "Sign-in requires a valid HTTPS URL")?;
    if url.scheme() != "https"
        || url.host().is_none()
        || !url.username().is_empty()
        || url.password().is_some()
        || url.fragment().is_some()
    {
        return Err("Sign-in requires an HTTPS URL without user information or a fragment");
    }
    Ok(url)
}

fn redirect_uri(provider: Provider, input: &str) -> Result<Url, &'static str> {
    let url = https_url(input)?;
    if url.query().is_some()
        || input
            .chars()
            .any(|character| character.is_control() || character.is_whitespace())
    {
        return Err("Register a sign-in redirect URI without query parameters or whitespace");
    }
    if matches!(provider, Provider::Apple)
        && !matches!(url.host(), Some(Host::Domain(domain)) if {
            let domain = domain.trim_end_matches('.');
            domain.contains('.') && !domain.ends_with(".localhost")
        })
    {
        return Err("Apple sign-in requires a registered HTTPS domain");
    }
    Ok(url)
}

fn create_request(provider: Provider, options: Options) -> Result<Value, &'static str> {
    if options.client_id.is_empty()
        || options.client_id.len() > 512
        || !options
            .client_id
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"._-".contains(&byte))
    {
        return Err("A valid sign-in client ID is required");
    }
    redirect_uri(provider, &options.redirect_uri)?;
    let (endpoint, scope) = match provider {
        Provider::Google => (
            "https://accounts.google.com/o/oauth2/v2/auth",
            "openid email",
        ),
        Provider::Apple => ("https://appleid.apple.com/auth/authorize", "email"),
    };
    let state = random_token()?;
    let nonce = random_token()?;
    let mut authorization = Url::parse(endpoint).expect("provider endpoint is valid");
    authorization.query_pairs_mut().extend_pairs([
        ("client_id", options.client_id.as_str()),
        ("redirect_uri", options.redirect_uri.as_str()),
        ("response_type", "code"),
        ("scope", scope),
        ("state", state.as_str()),
        ("nonce", nonce.as_str()),
    ]);
    let verifier = match provider {
        Provider::Google => {
            let verifier = random_token()?;
            authorization
                .query_pairs_mut()
                .append_pair("code_challenge", &pkce_challenge(&verifier))
                .append_pair("code_challenge_method", "S256");
            Some(verifier)
        }
        Provider::Apple => {
            authorization
                .query_pairs_mut()
                .append_pair("response_mode", "form_post");
            None
        }
    };
    let mut result = json!({
        "provider": provider,
        "authorizationUrl": authorization.as_str(),
        "redirectUri": options.redirect_uri,
        "state": state,
        "nonce": nonce,
    });
    if let Some(verifier) = verifier {
        result["codeVerifier"] = json!(verifier);
    }
    Ok(result)
}

fn read_callback(transaction: Transaction, callback: Callback) -> Result<Value, &'static str> {
    let expected = redirect_uri(transaction.provider, &transaction.redirect_uri)?;
    let actual = https_url(&callback.url)?;
    if actual.origin() != expected.origin() || actual.path() != expected.path() {
        return Err("Sign-in callback does not match the registered redirect URI");
    }
    let response = match (transaction.provider, callback.body.as_deref()) {
        (Provider::Google, None) => actual
            .query()
            .ok_or("Google sign-in requires a query callback")?,
        (Provider::Apple, Some(body)) if actual.query().is_none() => body,
        _ => return Err("Sign-in callback uses the wrong response mode"),
    };
    let (mut state, mut code, mut error, mut issuer) = (None, None, None, None);
    for (key, value) in form_urlencoded::parse(response.as_bytes()) {
        let field = match key.as_ref() {
            "state" => &mut state,
            "code" => &mut code,
            "error" => &mut error,
            "iss" => &mut issuer,
            _ => continue,
        };
        if field.replace(value).is_some() {
            return Err("Sign-in callback contains duplicate OAuth fields");
        }
    }
    if transaction.state.len() != 43
        || !state
            .is_some_and(|state| bool::from(state.as_bytes().ct_eq(transaction.state.as_bytes())))
    {
        return Err("Sign-in callback state does not match the pending request");
    }
    if let Some(issuer) = issuer {
        let expected_issuer = match transaction.provider {
            Provider::Google => "https://accounts.google.com",
            Provider::Apple => "https://appleid.apple.com",
        };
        if issuer != expected_issuer {
            return Err("Sign-in callback has the wrong provider issuer");
        }
    }
    match (code, error) {
        (Some(code), None) if !code.is_empty() && !code.chars().any(char::is_control) => {
            Ok(json!({"status": "success", "code": code}))
        }
        (None, Some(error)) => match (transaction.provider, error.as_ref()) {
            (Provider::Google, "access_denied") | (Provider::Apple, "user_cancelled_authorize") => {
                Ok(json!({"status": "cancelled"}))
            }
            _ => Ok(json!({"status": "denied"})),
        },
        _ => Err("Sign-in callback must contain either a code or an error"),
    }
}

pub fn request(input: &[u8]) -> String {
    let result = if input.len() > MAX_COMMAND_BYTES {
        Err("Sign-in request is too large")
    } else {
        serde_json::from_slice(input)
            .map_err(|_| "Invalid sign-in request")
            .and_then(|command| match command {
                Command::CreateRequest { provider, options } => create_request(provider, options),
                Command::ReadCallback {
                    transaction,
                    callback,
                } => read_callback(transaction, callback),
            })
    };
    match result {
        Ok(value) => json!({"ok": true, "value": value}),
        Err(error) => json!({"ok": false, "error": error}),
    }
    .to_string()
}

#[cfg(test)]
mod tests;
