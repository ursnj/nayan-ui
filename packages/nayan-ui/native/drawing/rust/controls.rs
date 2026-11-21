//! Document-owned tool settings. The host sends user actions, never a JS canvas store.
use super::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct Controls {
    pub tool: String,
    pub brush_type: String,
    pub color: String,
    pub width: f32,
    pub opacity: f32,
    pub shape: String,
    pub filled: bool,
    pub pressure: bool,
    pub smoothing: f32,
}
impl Default for Controls {
    fn default() -> Self {
        Self {
            tool: "brush".into(),
            brush_type: "NORMAL".into(),
            color: "#3b82f6".into(),
            width: 3.,
            opacity: 1.,
            shape: "rectangle".into(),
            filled: false,
            pressure: true,
            smoothing: 0.35,
        }
    }
}
fn preset(brush: &str) -> Result<f32, String> {
    Ok(match brush {
        "NORMAL" | "CALLIGRAPHY" => 1.,
        "MARKER" => 0.75,
        "PENCIL" => 0.7,
        "WATERCOLOR" => 0.45,
        "NEON" => 0.9,
        "CRAYON" => 0.85,
        "SPRINKLING" => 1.,
        _ => return Err("Unknown drawing brush".into()),
    })
}
impl Controls {
    fn patched(&self, patch: &Value) -> Result<Self, String> {
        let mut value = serde_json::to_value(if patch["reset"] == true { Self::default() } else { self.clone() }).unwrap();
        let object = patch.as_object().ok_or("Expected drawing controls")?;
        if object.contains_key("color") && self.tool != "shape" {
            value["tool"] = json!("brush");
        }
        if let Some(brush) = object.get("brushType") {
            value["tool"] = json!("brush");
            value["opacity"] = json!(preset(brush.as_str().ok_or("Invalid drawing brush")?)?);
        }
        if object.contains_key("shape") {
            value["tool"] = json!("shape");
        }
        for (key, field) in object {
            if key != "op" && key != "reset" {
                value[key] = field.clone();
            }
        }
        let mut result: Self = serde_json::from_value(value).map_err(|e| e.to_string())?;
        if !matches!(result.tool.as_str(), "brush" | "eraser" | "move" | "shape") || !tools::is_shape(&result.shape) {
            return Err("Unknown drawing tool or shape".into());
        }
        preset(&result.brush_type)?;
        if !result.width.is_finite() || !result.opacity.is_finite() || !result.smoothing.is_finite() {
            return Err("Invalid drawing controls".into());
        }
        result.width = result.width.clamp(1., 40.);
        result.opacity = result.opacity.clamp(0.1, 1.);
        result.smoothing = result.smoothing.clamp(0., 1.);
        Stroke::parse(json!({"path":"","color":result.color,"width":result.width}))?;
        Ok(result)
    }
    pub(super) fn brush(&self) -> Value {
        let eraser = self.tool == "eraser";
        json!({
            "tool":if self.tool=="shape" {self.shape.as_str()} else if self.tool=="move" {"move"} else {"brush"},
            "brushType":if eraser {"NORMAL"} else {self.brush_type.as_str()},
            "color":self.color,"width":self.width,"opacity":if eraser {1.} else {self.opacity},
            "isEraser":eraser,"pressure":self.pressure,"smoothing":self.smoothing,"filled":self.filled,"symmetry":"none"
        })
    }
}
impl Document {
    pub(super) fn sync_legacy_controls(&mut self) {
        let mut controls = self.controls.clone();
        let brush = &self.brush;
        controls.color = brush["color"].as_str().unwrap_or("#2567c7").into();
        controls.width = number(brush, "width", 3.);
        controls.opacity = number(brush, "opacity", 1.);
        controls.brush_type = brush["brushType"].as_str().unwrap_or("NORMAL").into();
        controls.filled = brush["filled"] == true;
        controls.pressure = brush["pressure"] == true;
        controls.smoothing = number(brush, "smoothing", 0.35);
        let tool = brush["tool"].as_str().unwrap_or("brush");
        controls.tool = if tools::is_shape(tool) {
            controls.shape = tool.into();
            "shape"
        } else if brush["isEraser"] == true {
            "eraser"
        } else if tool == "move" {
            "move"
        } else {
            "brush"
        }
        .into();
        if controls != self.controls {
            self.controls = controls;
            self.controls_revision += 1;
        }
    }
    pub(super) fn update_controls(&mut self, patch: &Value) -> Result<Value, String> {
        // Validate before finishing a live stroke: invalid commands leave the whole document intact.
        let controls = self.controls.patched(patch)?;
        self.finish();
        self.brush = controls.brush();
        if self.controls != controls {
            self.controls = controls;
            self.controls_revision += 1;
        }
        self.picked_color = None;
        Ok(self.summary())
    }
}
