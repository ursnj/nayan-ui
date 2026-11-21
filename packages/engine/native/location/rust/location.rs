//! Shared location sample validation and units for OS and browser providers.
use serde_json::{Value, json};

pub fn position(raw: &[u8]) -> String {
    let value: Value = serde_json::from_slice(raw).unwrap_or(Value::Null);
    let number = |key: &str| value[key].as_f64().filter(|number| number.is_finite());
    let sample = (|| {
        let latitude = number("latitude").filter(|n| (-90.0..=90.0).contains(n))?;
        let longitude = number("longitude").filter(|n| (-180.0..=180.0).contains(n))?;
        let accuracy = number("accuracy").filter(|n| *n >= 0.0)?;
        let timestamp = number("timestamp").filter(|n| *n > 0.0)?;
        Some(json!({
            "latitude": latitude,
            "longitude": longitude,
            "accuracy": accuracy,
            "timestamp": timestamp,
            "altitude": number("altitude"),
            "altitudeAccuracy": number("altitudeAccuracy").filter(|n| *n >= 0.0),
            "heading": number("heading").filter(|n| (0.0..360.0).contains(n)),
            "speed": number("speed").filter(|n| *n >= 0.0)
        }))
    })();
    match sample {
        Some(sample) => json!({"position": sample}),
        None => json!({"error": "unavailable"}),
    }
    .to_string()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_required_fields_and_removes_platform_sentinels() {
        let result: Value = serde_json::from_str(&position(
            br#"{"latitude":0,"longitude":-180,"accuracy":0,"timestamp":1234,"altitude":-30,"altitudeAccuracy":-1,"speed":-1,"heading":360}"#,
        ))
        .unwrap();
        assert_eq!(
            result["position"],
            json!({"latitude":0.0,"longitude":-180.0,"accuracy":0.0,"timestamp":1234.0,"altitude":-30.0,"altitudeAccuracy":null,"speed":null,"heading":null})
        );
        for sample in [
            br#"{"latitude":91,"longitude":1,"accuracy":0,"timestamp":1234}"#.as_slice(),
            br#"{"latitude":1,"longitude":1,"accuracy":-1,"timestamp":1234}"#,
            br#"{"latitude":1,"longitude":1,"accuracy":0}"#,
            b"invalid",
        ] {
            assert_eq!(position(sample), r#"{"error":"unavailable"}"#);
        }
    }
}
