//! Shared validation and ownership for app utilities. Platform adapters only perform OS work.
use serde_json::{Value, json};
#[cfg(feature = "keep-awake")]
#[path = "../../../keep-awake/rust/owners.rs"]
mod keep_awake;
#[cfg(feature = "image-picker")]
#[path = "../../../image-picker/rust/options.rs"]
mod image_picker;

pub fn prepare(owner: u64, #[allow(unused_mut)] mut value: Value) -> Result<Value, String> {
    let action = value["action"].as_str().ok_or("Missing app service action")?.to_owned();
    #[cfg(feature = "contacts")]
    if action.starts_with("contacts.") {
        return crate::contacts::prepare(value);
    }
    #[cfg(not(feature = "contacts"))]
    if action.starts_with("contacts.") {
        return Err("Contacts were disabled in this engine build".into());
    }
    let validation: Result<(), &str> = match action.as_str() {
        #[cfg(feature = "keep-awake")]
        "awake.activate" | "awake.deactivate" => {
            let tag = value["tag"].as_str().ok_or("Keep-awake tag is required")?;
            if tag.is_empty() || tag.len() > 256 {
                return Err("Keep-awake tag must contain 1..256 UTF-8 bytes".into());
            }
            let active = keep_awake::set_active(owner, tag, action == "awake.activate")?;
            value["active"] = json!(active);
            Ok(())
        }
        #[cfg(feature = "image-picker")]
        "image.library" | "image.camera" => {
            value["options"] = image_picker::options(value.get("options").cloned().unwrap_or_else(|| json!({})))?;
            if action == "image.camera" && value["options"]["multiple"] == true {
                return Err("Camera capture supports one image".into());
            }
            Ok(())
        }
        #[cfg(feature = "image-picker")]
        "image.release" => {
            if !value["uri"].as_str().is_some_and(|v| !v.is_empty() && !v.contains('\0')) {
                return Err("An owned image URI is required".into());
            }
            Ok(())
        }
        #[cfg(feature = "image-picker")]
        "image.permission" | "image.requestPermission" => Ok(()),
        #[cfg(not(feature = "image-picker"))]
        action if action.starts_with("image.") => Err("Image picker was disabled in this engine build"),
        #[cfg(feature = "permissions")]
        "permissions.check" | "permissions.request" | "permissions.openSettings" => {
            if (action != "permissions.openSettings" || value.get("permission").is_some())
                && !value["permission"].as_str().is_some_and(crate::permissions::valid_name)
            {
                return Err("Unknown permission".into());
            }
            Ok(())
        }
        #[cfg(feature = "location")]
        "location.available" => Ok(()),
        #[cfg(feature = "location")]
        "location.next" | "location.stop" => {
            if !value["id"]
                .as_str()
                .is_some_and(|id| !id.is_empty() && id.len() <= 32 && id.bytes().all(|b| b.is_ascii_digit()))
            {
                return Err("Invalid location subscription".into());
            }
            if action == "location.next" && !value["highAccuracy"].is_boolean() {
                return Err("Location highAccuracy must be a boolean".into());
            }
            Ok(())
        }
        #[cfg(not(feature = "location"))]
        action if action.starts_with("location.") => Err("Location was disabled in this engine build"),
        #[cfg(feature = "keep-awake")]
        "awake.available" => Ok(()),
        #[cfg(feature = "review")]
        "review.available" | "review.request" => Ok(()),
        _ if action.starts_with("awake.") || action.starts_with("review.") || action.starts_with("permissions.") => {
            Err("This app service was disabled in this engine build")
        }
        _ => Err("Unknown app service action"),
    };
    validation?;
    value["owner"] = json!(owner.to_string());
    Ok(value)
}
pub fn release(owner: u64) -> Value {
    #[cfg(feature = "keep-awake")]
    let active = keep_awake::release(owner);
    #[cfg(not(feature = "keep-awake"))]
    let active = false;
    json!({"action":"cleanup","owner":owner.to_string(),"active":active})
}
#[cfg(all(test, feature = "image-picker"))]
mod tests {
    use super::*;
    #[test]
    fn validates_picker_combinations_and_preserves_generic_options() {
        let value = prepare(
            55,
            json!({"action":"image.library","options":{"quality":0.7,"aspect":[4,3],"base64":true}}),
        )
        .unwrap();
        assert_eq!(value["options"]["quality"], 0.7);
        assert_eq!(value["owner"], "55");
        for options in [
            json!({"quality":2}),
            json!({"selectionLimit":0}),
            json!({"multiple":true,"allowsEditing":true}),
            json!({"aspect":[0,1]}),
        ] {
            assert!(prepare(55, json!({"action":"image.library","options":options})).is_err());
        }
    }
}
