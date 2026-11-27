use serde_json::{Value, json};

pub(super) fn options(mut value: Value) -> Result<Value, String> {
    if !value.is_object() {
        return Err("Image picker options must be an object".into());
    }
    let quality = value["quality"].as_f64().unwrap_or(1.0);
    if value.get("quality").is_some() && value["quality"].as_f64().is_none() || !(0.0..=1.0).contains(&quality) {
        return Err("Image quality must be between 0 and 1".into());
    }
    for key in ["allowsEditing", "multiple", "base64"] {
        if value.get(key).is_some() && !value[key].is_boolean() {
            return Err(format!("Image picker {key} must be a boolean"));
        }
    }
    let dimension = value["maxDimension"].as_u64().unwrap_or(4096);
    if value.get("maxDimension").is_some() && value["maxDimension"].as_u64().is_none() || !(64..=8192).contains(&dimension) {
        return Err("Image maxDimension must be between 64 and 8192".into());
    }
    value["maxDimension"] = json!(dimension);
    let format = value["format"].as_str().unwrap_or("jpeg");
    if value.get("format").is_some() && value["format"].as_str().is_none() || !matches!(format, "jpeg" | "png") {
        return Err("Image format must be jpeg or png".into());
    }
    value["format"] = json!(format);
    let limit = value["selectionLimit"].as_u64().unwrap_or(1);
    if value.get("selectionLimit").is_some() && value["selectionLimit"].as_u64().is_none() || !(1..=20).contains(&limit) {
        return Err("Selection limit must be between 1 and 20".into());
    }
    if value["multiple"] == true && value["allowsEditing"] == true {
        return Err("Editing requires a single image".into());
    }
    if let Some(aspect) = value.get("aspect") {
        let a = aspect.as_array().ok_or("Image aspect must have two positive numbers")?;
        if a.len() != 2 || a.iter().any(|x| !x.as_f64().is_some_and(|n| n.is_finite() && n > 0.0 && n <= 10000.0)) {
            return Err("Image aspect must have two positive numbers".into());
        }
    }
    value["quality"] = json!(quality);
    value["selectionLimit"] = json!(limit);
    Ok(value)
}
