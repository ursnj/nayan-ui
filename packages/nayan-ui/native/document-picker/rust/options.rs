use serde_json::{Value, json};

fn mime_part(value: &str) -> bool {
    !value.is_empty()
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || b"_!#$&^.+-".contains(&byte))
}

pub(super) fn options(value: &Value) -> Result<Value, String> {
    if !value.is_object() {
        return Err("Document picker options must be an object".into());
    }
    for key in ["multiple", "copyToCacheDirectory", "base64"] {
        if value.get(key).is_some_and(|value| !value.is_boolean()) {
            return Err(format!("Document picker {key} must be a boolean"));
        }
    }
    let default_type = json!("*/*");
    let types = match value.get("type") {
        None => std::slice::from_ref(&default_type),
        Some(mime @ Value::String(_)) => std::slice::from_ref(mime),
        Some(Value::Array(types)) if !types.is_empty() => types.as_slice(),
        _ => {
            return Err(
                "Document type must be a MIME type or a nonempty array of MIME types".into(),
            );
        }
    };
    let mut normalized = Vec::new();
    for mime in types {
        let valid = mime.as_str().filter(|mime| {
            *mime == "*/*"
                || mime
                    .split_once('/')
                    .is_some_and(|(top, sub)| mime_part(top) && (sub == "*" || mime_part(sub)))
        });
        let mime = valid
            .ok_or("Invalid document MIME type")?
            .to_ascii_lowercase();
        if !normalized.contains(&mime) {
            normalized.push(mime);
        }
    }
    if normalized.iter().any(|mime| mime == "*/*") {
        normalized = vec!["*/*".into()];
    }
    Ok(json!({
        "type": normalized,
        "multiple": value["multiple"].as_bool().unwrap_or(false),
        "copyToCacheDirectory": value["copyToCacheDirectory"].as_bool().unwrap_or(true)
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_and_normalizes_picker_options() {
        assert_eq!(
            options(&json!({})).unwrap(),
            json!({"type":["*/*"],"multiple":false,"copyToCacheDirectory":true})
        );
        assert_eq!(
            options(&json!({"type":["IMAGE/*","image/*","application/pdf"], "multiple": true, "copyToCacheDirectory":false})).unwrap(),
            json!({"type":["image/*","application/pdf"],"multiple":true,"copyToCacheDirectory":false})
        );
        assert_eq!(
            options(&json!({"type":["image/*","*/*"]})).unwrap()["type"],
            json!(["*/*"])
        );
        for value in [
            json!(null),
            json!({"type":[]}),
            json!({"type":"*.pdf"}),
            json!({"type":"*/pdf"}),
            json!({"multiple":1}),
        ] {
            assert!(options(&value).is_err(), "{value}");
        }
    }
}
