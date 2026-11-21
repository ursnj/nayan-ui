//! UI document state attached directly to an engine surface.
use super::ComponentDocument;
use crate::{
    assets::texture::Image,
    render::{self, document::number},
};
use serde_json::{Value, json};
use std::sync::Arc;

#[derive(Default)]
pub(crate) struct Surface {
    document: ComponentDocument,
    event_revision: u64,
}

impl Surface {
    pub(crate) fn command(&mut self, id: i32, value: &Value) -> Result<Value, String> {
        match value["op"].as_str() {
            Some("components") => self.document.command(value),
            Some("touch") => {
                self.touch(number(value, "phase", 1.) as i32, number(value, "x", 0.), number(value, "y", 0.));
                Ok(Value::Null)
            }
            Some("event") => Ok(self.take_event().unwrap_or(Value::Null)),
            Some("invalidateView") => {
                self.invalidate();
                Ok(Value::Null)
            }
            Some("render") => {
                let surface = number(value, "surface", id as f32) as i32;
                render::resize_art_target(surface, number(value, "pixelWidth", 0.) as u32, number(value, "pixelHeight", 0.) as u32);
                self.present(surface, number(value, "width", 1.), number(value, "height", 1.))
                    .map(Value::Bool)
            }
            _ => Err("Unknown UI surface command".into()),
        }
    }

    pub(crate) fn touch(&mut self, phase: i32, x: f32, y: f32) {
        self.document.touch(phase, x, y);
    }

    pub(crate) fn scroll(&mut self, x: f32, y: f32) {
        self.document.scroll(x, y);
    }

    pub(crate) fn invalidate(&mut self) {
        self.event_revision = u64::MAX;
    }

    pub(crate) fn take_event(&mut self) -> Option<Value> {
        let revision = self.document.revision();
        if revision == self.event_revision {
            return None;
        }
        self.event_revision = revision;
        Some(json!({"components": self.document.take_snapshot()}))
    }

    pub(crate) fn image_result(&mut self, value: &Value, image: Option<Arc<Image>>) -> Value {
        self.document
            .image_result(value["request"].as_u64().unwrap_or(0), image, value["error"].as_str())
    }

    pub(crate) fn present(&mut self, surface: i32, width: f32, height: f32) -> Result<bool, String> {
        if width <= 0. || height <= 0. || !width.is_finite() || !height.is_finite() {
            return Ok(false);
        }
        render::draw_components(surface, &mut self.document, width, height)
    }
}
