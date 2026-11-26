use super::*;

const GOOGLE_CALLBACK: &str = "https://login.example.com/auth/google";
const APPLE_CALLBACK: &str = "https://login.example.com/auth/apple";
const STATE: &str = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

fn options(redirect_uri: &str) -> Options {
    Options {
        client_id: "com.example.web".into(),
        redirect_uri: redirect_uri.into(),
    }
}

fn google_callback(query: &str) -> Result<Value, &'static str> {
    read_callback(
        Transaction {
            provider: Provider::Google,
            redirect_uri: GOOGLE_CALLBACK.into(),
            state: STATE.into(),
        },
        Callback {
            url: format!("{GOOGLE_CALLBACK}?{query}"),
            body: None,
        },
    )
}

#[test]
fn google_uses_a_fresh_nonce_state_and_s256_verifier() {
    let request = create_request(Provider::Google, options(GOOGLE_CALLBACK)).unwrap();
    let subsequent = create_request(Provider::Google, options(GOOGLE_CALLBACK)).unwrap();
    for key in ["state", "nonce", "codeVerifier"] {
        assert_ne!(request[key], subsequent[key]);
        assert_eq!(
            URL_SAFE_NO_PAD
                .decode(request[key].as_str().unwrap())
                .unwrap()
                .len(),
            32
        );
    }
    let url = Url::parse(request["authorizationUrl"].as_str().unwrap()).unwrap();
    assert_eq!(url.host_str(), Some("accounts.google.com"));
    let params: std::collections::HashMap<_, _> = url.query_pairs().collect();
    assert_eq!(params["redirect_uri"], GOOGLE_CALLBACK);
    assert_eq!(params["response_type"], "code");
    assert_eq!(params["code_challenge_method"], "S256");
    assert_eq!(
        params["code_challenge"],
        pkce_challenge(request["codeVerifier"].as_str().unwrap())
    );
    assert!(!params.contains_key("code_verifier"));
    assert_eq!(
        pkce_challenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
        "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    );
}

#[test]
fn apple_uses_a_registered_web_callback_and_form_post() {
    for url in [
        "http://example.com/auth",
        "https://127.0.0.1/auth",
        "https://localhost./auth",
        "https://example.com/auth#here",
    ] {
        assert!(create_request(Provider::Apple, options(url)).is_err());
    }
    let request = create_request(Provider::Apple, options(APPLE_CALLBACK)).unwrap();
    let url = Url::parse(request["authorizationUrl"].as_str().unwrap()).unwrap();
    assert_eq!(url.host_str(), Some("appleid.apple.com"));
    let params: std::collections::HashMap<_, _> = url.query_pairs().collect();
    assert_eq!(params["response_mode"], "form_post");
    assert_eq!(params["scope"], "email");
    assert!(request.get("codeVerifier").is_none());
    let callback = |url: &str, body: Option<&str>| {
        read_callback(
            Transaction {
                provider: Provider::Apple,
                redirect_uri: APPLE_CALLBACK.into(),
                state: STATE.into(),
            },
            Callback {
                url: url.into(),
                body: body.map(str::to_owned),
            },
        )
    };
    assert_eq!(
        callback(
            APPLE_CALLBACK,
            Some(&format!("state={STATE}&code=one%2Btwo"))
        )
        .unwrap()["code"],
        "one+two"
    );
    assert_eq!(
        callback(
            APPLE_CALLBACK,
            Some(&format!("state={STATE}&error=user_cancelled_authorize"))
        )
        .unwrap()["status"],
        "cancelled"
    );
    assert!(
        callback(
            &format!("{APPLE_CALLBACK}?state={STATE}&code=something"),
            None
        )
        .is_err()
    );
}

#[test]
fn rejects_wrong_redirects_state_and_ambiguous_responses() {
    assert_eq!(
        google_callback(&format!("state={STATE}&code=one%2Btwo")).unwrap()["code"],
        "one+two"
    );
    assert_eq!(
        google_callback(&format!("state={STATE}&error=access_denied")).unwrap()["status"],
        "cancelled"
    );
    assert_eq!(
        google_callback(&format!("state={STATE}&error=server_error")).unwrap()["status"],
        "denied"
    );
    for query in [
        "state=unexpected&code=one".into(),
        "code=one".into(),
        format!("state={STATE}&%73tate={STATE}&code=one"),
        format!("state={STATE}&code=one&code=two"),
        format!("state={STATE}&code=one&error=access_denied"),
        format!("state={STATE}&code=one&iss=https://appleid.apple.com"),
    ] {
        assert!(google_callback(&query).is_err());
    }
    for url in [
        "https://login.example.com/auth/apple",
        "https://other.example.com/auth/google",
        "https://login.example.com:444/auth/google",
    ] {
        assert!(
            read_callback(
                Transaction {
                    provider: Provider::Google,
                    redirect_uri: GOOGLE_CALLBACK.into(),
                    state: STATE.into()
                },
                Callback {
                    url: format!("{url}?state={STATE}&code=one"),
                    body: None
                },
            )
            .is_err()
        );
    }
}
