//! Opt-in Pressable lifecycle. Simple NPress nodes still send only their final click.
use super::*;

#[derive(Default)]
pub(super) struct PressState {
    down: bool,
    pressed: bool,
    hovered: bool,
    focused: bool,
    started: f64,
    long: bool,
}

pub(super) fn hit_rect(node: &Node, rect: Rect) -> Rect {
    if node.kind != "NPress" {
        return rect;
    }
    let slop = &node.props["hitSlop"];
    let side = |key: &str| slop.as_f64().or_else(|| slop[key].as_f64()).unwrap_or(0.).clamp(0., 1024.) as f32;
    Rect::from_min_max(
        rect.min - Vec2::new(side("left"), side("top")),
        rect.max + Vec2::new(side("right"), side("bottom")),
    )
}

impl ComponentDocument {
    fn press_event(&mut self, node: &Node, kind: &str, value: Value) {
        self.revision += 1;
        self.events.push(json!({"id":node.id,"type":kind,"value":value,"sequence":self.revision}));
    }

    pub(super) fn press_interaction(&mut self, node: &Node, response: &egui::Response) -> bool {
        if node.props["observePress"] != true && !response.clicked() {
            return false;
        }
        let disabled = !response.enabled() || flag(&node.props, &["disabled", "isDisabled"]);
        let point = response
            .interact_pointer_pos()
            .or_else(|| self.context.input(|input| input.pointer.interact_pos()))
            .unwrap_or(response.rect.center());
        let value = json!({"x":point.x,"y":point.y,"target":node.id,"timestamp":self.elapsed * 1000.});
        let mut suppress = disabled;
        if node.props["observePress"] == true {
            let mut state = self.presses.remove(&node.id).unwrap_or_default();
            let before = (state.pressed, state.hovered, state.focused);
            let down = !disabled && response.is_pointer_button_down_on();
            if down && !state.down {
                state.started = self.elapsed;
                state.long = false;
            }
            let delay = numeric(&node.props, &["unstable_pressDelay"], 0.).max(0.) / 1000.;
            let pressed = down && self.elapsed - state.started >= delay;
            state.hovered = !disabled && !self.native && response.hovered();
            state.focused = !disabled && response.has_focus();
            let payload = |pressed: bool, hovered: bool, focused: bool| {
                let mut value = value.clone();
                value["pressed"] = json!(pressed);
                value["hovered"] = json!(hovered);
                value["focused"] = json!(focused);
                value
            };
            // Even a release before the press delay has an ordered press-in / press-out pair.
            if response.clicked() && !disabled && state.down && !state.pressed {
                self.press_event(node, "pressState", payload(true, state.hovered, state.focused));
                state.pressed = true;
            }
            if (state.pressed, before.1, before.2) != (pressed, state.hovered, state.focused) {
                self.press_event(node, "pressState", payload(pressed, state.hovered, state.focused));
            }
            state.pressed = pressed;
            state.down = down;
            let long_delay = numeric(&node.props, &["delayLongPress"], 500.).max(0.) / 1000.;
            if pressed && !state.long && node.props["observeLongPress"] == true && self.elapsed - state.started >= delay + long_delay {
                state.long = true;
                self.press_event(node, "longPress", value.clone());
            }
            suppress |= state.long;
            self.presses.insert(node.id.clone(), state);
        }
        let clicked = response.clicked() && !suppress;
        if clicked {
            let before = self.revision;
            self.click(&node.id);
            if self.revision != before {
                if let Some(event) = self.events.last_mut() {
                    event["value"] = value;
                }
            }
        }
        clicked
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn frame(doc: &mut ComponentDocument) {
        doc.frame(300., 300., 1.).drop_without_applying_deltas();
    }
    fn setup(observe: bool) -> ComponentDocument {
        let mut doc = ComponentDocument::default();
        doc.set_tree(&json!([{"id":"press","kind":"NPress","props":{"width":120,"height":48,"observePress":observe,"observeLongPress":observe,"delayLongPress":100},"children":[]}])).unwrap();
        frame(&mut doc);
        frame(&mut doc);
        doc.take_snapshot();
        doc
    }
    fn touch(doc: &mut ComponentDocument, phase: u8) {
        doc.touch(phase as i32, 40., 24.);
        frame(doc);
    }

    #[test]
    fn lifecycle_tracks_press_and_release_without_sending_callbacks_or_per_frame_events() {
        let mut doc = setup(true);
        touch(&mut doc, 0);
        assert!(
            doc.events
                .iter()
                .any(|event| event["type"] == "pressState" && event["value"]["pressed"] == true)
        );
        doc.take_snapshot();
        frame(&mut doc);
        assert!(doc.events.is_empty());
        touch(&mut doc, 2);
        assert!(
            doc.events
                .iter()
                .any(|event| event["type"] == "pressState" && event["value"]["pressed"] == false)
        );
        assert!(doc.events.iter().any(|event| event["type"] == "press"));
    }

    #[test]
    fn long_press_fires_once_and_suppresses_the_release_click() {
        let mut doc = setup(true);
        touch(&mut doc, 0);
        for _ in 0..15 {
            frame(&mut doc);
        }
        assert_eq!(doc.events.iter().filter(|event| event["type"] == "longPress").count(), 1);
        touch(&mut doc, 2);
        assert!(!doc.events.iter().any(|event| event["type"] == "press"));
    }

    #[test]
    fn simple_presses_keep_the_existing_single_event_path() {
        let mut doc = setup(false);
        touch(&mut doc, 0);
        assert!(doc.events.is_empty());
        touch(&mut doc, 2);
        assert_eq!(doc.events.len(), 1);
        assert_eq!(doc.events[0]["type"], "press");
    }
}
