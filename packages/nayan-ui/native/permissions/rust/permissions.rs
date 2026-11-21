//! Normalize OS and browser observations without caching decisions the user can change.
pub fn result(observation: &str) -> String {
    if observation == "settings" {
        return serde_json::json!({"status": "denied", "canAskAgain": false, "requiresSettings": true}).to_string();
    }
    let (status, can_ask_again) = match observation {
        "granted" => ("granted", Some(false)),
        "limited" => ("limited", Some(false)),
        "limited-retryable" => ("limited", Some(true)),
        "limited-unknown" => ("limited", None),
        "prompt" => ("prompt", Some(true)),
        "retryable-denial" => ("denied", Some(true)),
        "blocked" => ("denied", Some(false)),
        "denied" => ("denied", None),
        "unavailable" => ("unavailable", Some(false)),
        _ => ("unknown", None),
    };
    serde_json::json!({"status": status, "canAskAgain": can_ask_again}).to_string()
}

#[cfg(not(target_arch = "wasm32"))]
pub fn valid_name(name: &str) -> bool {
    if let Some(raw) = name.strip_prefix("android:") {
        return raw.len() <= 255
            && raw.contains('.')
            && raw
                .split('.')
                .all(|segment| !segment.is_empty() && segment.bytes().all(|b| b.is_ascii_alphanumeric() || b == b'_'));
    }

    matches!(
        name,
        "camera"
            | "microphone"
            | "notifications"
            | "location"
            | "location-coarse"
            | "location-background"
            | "photos"
            | "photos-add"
            | "videos"
            | "media-audio"
            | "media-location"
            | "storage-read"
            | "storage-write"
            | "contacts"
            | "contacts-write"
            | "calendars"
            | "calendars-write"
            | "reminders"
            | "bluetooth"
            | "bluetooth-scan"
            | "bluetooth-advertise"
            | "nearby-wifi"
            | "local-network"
            | "motion"
            | "body-sensors"
            | "body-sensors-background"
            | "speech-recognition"
            | "tracking"
            | "music-library"
            | "homekit"
            | "siri"
            | "phone"
            | "call-phone"
            | "call-log"
            | "read-sms"
            | "receive-sms"
            | "send-sms"
            | "overlay"
            | "write-settings"
            | "exact-alarms"
            | "all-files-access"
            | "install-packages"
            | "notification-listener"
            | "do-not-disturb"
            | "usage-access"
            | "battery-optimization"
            | "clipboard-read"
            | "clipboard-write"
            | "persistent-storage"
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{Value, json};

    #[test]
    fn distinguishes_retryable_blocked_and_ambiguous_denials() {
        for (observation, status, retry) in [
            ("granted", "granted", json!(false)),
            ("limited", "limited", json!(false)),
            ("limited-retryable", "limited", json!(true)),
            ("limited-unknown", "limited", json!(null)),
            ("prompt", "prompt", json!(true)),
            ("retryable-denial", "denied", json!(true)),
            ("blocked", "denied", json!(false)),
            ("denied", "denied", json!(null)),
            ("unavailable", "unavailable", json!(false)),
            ("unknown", "unknown", json!(null)),
        ] {
            assert_eq!(
                serde_json::from_str::<Value>(&result(observation)).unwrap(),
                json!({"status": status, "canAskAgain": retry})
            );
        }
    }

    #[test]
    fn exposes_settings_access_and_validates_platform_names() {
        assert_eq!(
            serde_json::from_str::<Value>(&result("settings")).unwrap(),
            json!({"status": "denied", "canAskAgain": false, "requiresSettings": true})
        );
        #[cfg(not(target_arch = "wasm32"))]
        {
            assert!(valid_name("android:com.example.permission.TEST"));
            assert!(valid_name("location-background"));
            for name in ["android:", "android:../file", "android:android..permission.CAMERA", "camera request"] {
                assert!(!valid_name(name));
            }
        }
    }
}
