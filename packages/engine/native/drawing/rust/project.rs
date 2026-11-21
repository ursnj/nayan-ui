//! Versioned, editable projects. Legacy SVG arrays remain a supported import format.
use super::*;
use serde::{Deserialize, Serialize};
#[derive(Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Layer {
    pub id: u32,
    pub name: String,
    pub visible: bool,
    pub locked: bool,
    pub opacity: f32,
}
impl Layer {
    pub fn base() -> Self {
        Self {
            id: 0,
            name: "My artwork".into(),
            visible: true,
            locked: false,
            opacity: 1.,
        }
    }
}
#[derive(Clone)]
pub struct Checkpoint {
    pub paths: Vec<Arc<Stroke>>,
    pub layers: Vec<Layer>,
    pub active: u32,
}
pub fn layer_id(stroke: &Stroke) -> u32 {
    stroke.data.get("layerId").and_then(Value::as_u64).unwrap_or(0) as u32
}
impl Document {
    pub fn project(&mut self) -> Value {
        self.finish();
        json!({"version":2,"width":self.width,"height":self.height,"layers":self.layers,"activeLayer":self.active_layer,
            "paths":self.paths.iter().map(|p|p.data.clone()).collect::<Vec<_>>()})
    }
    pub fn editable(&self) -> bool {
        self.editing_enabled
            && self
                .layers
                .iter()
                .any(|l| l.id == self.active_layer && l.visible && !l.locked && l.opacity > 0.)
    }
    pub fn replay(&mut self) {
        if self.layers.len() == 1 && self.layers[0].visible && self.layers[0].opacity == 1. {
            self.raster.replay(self.paths.iter().map(AsRef::as_ref));
        } else {
            self.raster.replay_layers(&self.paths, &self.layers, self.active_layer);
        }
    }
    pub fn layer_command(&mut self, v: &Value) -> Result<Value, String> {
        self.finish();
        let action = v["action"].as_str().unwrap_or("");
        let id = if v.get("id").is_some() {
            v["id"].as_u64().filter(|id| *id <= u32::MAX as u64).ok_or("Invalid layer identifier")? as u32
        } else {
            self.active_layer
        };
        let index = self.layers.iter().position(|l| l.id == id).ok_or("Layer not found")?;
        match action {
            "add" | "duplicate" => {
                if self.layers.len() >= 16 {
                    return Err("A drawing can have up to 16 layers".into());
                }
                let next = self
                    .layers
                    .iter()
                    .map(|l| l.id)
                    .max()
                    .unwrap_or(0)
                    .checked_add(1)
                    .ok_or("Layer identifier limit")?;
                let mut layer = if action == "duplicate" {
                    self.layers[index].clone()
                } else {
                    Layer::base()
                };
                layer.id = next;
                layer.name = if action == "duplicate" {
                    format!("{} copy", layer.name)
                } else {
                    format!("Layer {}", next + 1)
                };
                layer.locked = false;
                if action == "duplicate" {
                    let copies = self
                        .paths
                        .iter()
                        .filter(|s| layer_id(s) == id)
                        .map(|s| {
                            let mut copy = (**s).clone();
                            copy.data["layerId"] = json!(next);
                            Arc::new(copy)
                        })
                        .collect::<Vec<_>>();
                    self.paths.extend(copies);
                }
                self.layers.insert(index + 1, layer);
                self.active_layer = next;
            }
            "select" => {
                if self.active_layer == id {
                    return Ok(self.summary());
                }
                self.active_layer = id;
                self.replay();
                self.paint_version += 1;
                return Ok(self.summary());
            }
            "update" => {
                let before = self.layers[index].clone();
                let layer = &mut self.layers[index];
                if let Some(name) = v["name"].as_str() {
                    layer.name = name.chars().take(60).collect();
                }
                if let Some(visible) = v["visible"].as_bool() {
                    layer.visible = visible;
                }
                if let Some(locked) = v["locked"].as_bool() {
                    layer.locked = locked;
                }
                if let Some(opacity) = v["opacity"].as_f64() {
                    layer.opacity = (opacity as f32).clamp(0., 1.);
                }
                if before == *layer {
                    return Ok(self.summary());
                }
            }
            "move" => {
                let to = v["index"].as_u64().ok_or("Missing layer position")? as usize;
                if to >= self.layers.len() {
                    return Err("Invalid layer position".into());
                }
                let layer = self.layers.remove(index);
                self.layers.insert(to, layer);
            }
            "delete" => {
                if self.layers.len() == 1 {
                    return Err("Keep at least one layer".into());
                }
                self.layers.remove(index);
                self.paths.retain(|p| layer_id(p) != id);
                if self.active_layer == id {
                    self.active_layer = self.layers[index.saturating_sub(1)].id;
                }
            }
            "clear" => {
                if self.layers[index].locked {
                    return Err("Unlock this layer first".into());
                }
                self.paths.retain(|p| layer_id(p) != id);
            }
            _ => return Err("Unknown layer action".into()),
        }
        self.checkpoint();
        self.replay();
        Ok(self.summary())
    }
}
