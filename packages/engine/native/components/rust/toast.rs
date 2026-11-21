//! The global queue and expiry policy live in Rust; hosts only schedule the next wake-up.
use super::*;
use std::{
    collections::VecDeque,
    sync::{LazyLock, Mutex},
};

#[derive(Clone)]
struct Toast {
    id: u64,
    content: Value,
    duration: f64,
}
#[derive(Default)]
struct Queue {
    next: u64,
    items: VecDeque<Toast>,
    deadline: Option<f64>,
}
impl Queue {
    fn expire(&mut self, now: f64) {
        if self.deadline.is_some_and(|deadline| now >= deadline) {
            self.dismiss(now);
        }
    }
    fn dismiss(&mut self, now: f64) {
        self.items.pop_front();
        self.deadline = self.items.front().and_then(|toast| (toast.duration > 0.).then_some(now + toast.duration));
    }
    fn command(&mut self, request: &Value, now: f64) -> Result<Value, String> {
        self.expire(now);
        match request["action"].as_str().unwrap_or("snapshot") {
            "show" => {
                let content = &request["toast"];
                let message = content["message"]
                    .as_str()
                    .filter(|text| !text.trim().is_empty())
                    .ok_or("Toast needs a message")?;
                if message.len() > 16_384 {
                    return Err("Toast message exceeds 16 KiB".into());
                }
                let duration = numeric(content, &["duration"], 4000.);
                let duration = if duration <= 0. { 0. } else { duration.clamp(1000., 60_000.) / 1000. };
                self.next += 1;
                let id = self.next;
                // Keep the visible toast; discard the oldest pending message when full.
                if self.items.len() == 8 {
                    self.items.remove(1);
                }
                if self.items.is_empty() {
                    self.deadline = (duration > 0.).then_some(now + duration);
                }
                self.items.push_back(Toast {
                    id,
                    content: content.clone(),
                    duration,
                });
            }
            "dismiss" => {
                let id = request["id"].as_u64();
                if id.is_none() || self.items.front().is_some_and(|toast| Some(toast.id) == id) {
                    self.dismiss(now);
                } else {
                    self.items.retain(|toast| Some(toast.id) != id);
                }
            }
            "clear" => {
                self.items.clear();
                self.deadline = None;
            }
            "snapshot" => (),
            _ => return Err("Unknown toast command".into()),
        }
        Ok(json!({
            "toast": self.items.front().map(|toast| { let mut value = toast.content.clone(); value["id"] = json!(toast.id); value }),
            "ids": self.items.iter().map(|toast| toast.id).collect::<Vec<_>>(),
            "wakeAfter": self.deadline.map(|deadline| ((deadline - now).max(0.) * 1000.).ceil())
        }))
    }
}
pub(crate) fn command(request: &Value) -> Result<Value, String> {
    static QUEUE: LazyLock<Mutex<Queue>> = LazyLock::new(|| Mutex::new(Queue::default()));
    QUEUE
        .lock()
        .map_err(|_| "Toast queue unavailable".to_owned())?
        .command(request, clock_seconds())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn pending_messages_get_their_full_duration_and_stale_dismissals_do_not_close_successors() {
        let mut queue = Queue::default();
        queue
            .command(&json!({"action":"show","toast":{"message":"One","duration":1000}}), 0.)
            .unwrap();
        queue
            .command(&json!({"action":"show","toast":{"message":"Two","duration":2000}}), 0.5)
            .unwrap();
        let next = queue.command(&json!({}), 10.).unwrap();
        assert_eq!(next["toast"]["message"], "Two");
        assert_eq!(next["wakeAfter"], 2000.);
        let stale = queue.command(&json!({"action":"dismiss","id":1}), 10.5).unwrap();
        assert_eq!(stale["toast"]["message"], "Two");
        assert!(queue.command(&json!({}), 12.).unwrap()["toast"].is_null());
    }
    #[test]
    fn queue_is_bounded_and_persistent_toasts_require_dismissal() {
        let mut queue = Queue::default();
        for index in 0..20 {
            queue
                .command(&json!({"action":"show","toast":{"message":index.to_string(),"duration":0}}), 0.)
                .unwrap();
        }
        let state = queue.command(&json!({}), 1000.).unwrap();
        assert_eq!(state["ids"].as_array().unwrap().len(), 8);
        assert_eq!(state["toast"]["message"], "0");
        assert!(state["wakeAfter"].is_null());
        assert!(queue.command(&json!({"action":"clear"}), 1001.).unwrap()["toast"].is_null());
    }
}
