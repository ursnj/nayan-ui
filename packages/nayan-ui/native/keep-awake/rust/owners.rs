use std::{
    collections::{HashMap, HashSet},
    sync::{Mutex, OnceLock},
};
#[derive(Default)]
struct Owners(HashMap<u64, HashSet<String>>);
impl Owners {
    fn active(&self) -> bool {
        self.0.values().any(|tags| !tags.is_empty())
    }
    fn update(&mut self, owner: u64, tag: &str, active: bool) -> bool {
        if active {
            self.0.entry(owner).or_default().insert(tag.to_owned());
        } else if let Some(tags) = self.0.get_mut(&owner) {
            tags.remove(tag);
            if tags.is_empty() {
                self.0.remove(&owner);
            }
        }
        self.active()
    }
}
fn owners() -> &'static Mutex<Owners> {
    static VALUE: OnceLock<Mutex<Owners>> = OnceLock::new();
    VALUE.get_or_init(Default::default)
}

pub(super) fn set_active(owner: u64, tag: &str, active: bool) -> Result<bool, &'static str> {
    Ok(owners().lock().map_err(|_| "Keep-awake state unavailable")?.update(owner, tag, active))
}

pub(super) fn release(owner: u64) -> bool {
    let mut state = owners().lock().unwrap_or_else(|error| error.into_inner());
    state.0.remove(&owner);
    state.active()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn independent_owners_and_tags_do_not_cancel_each_other() {
        let mut state = Owners::default();
        assert!(state.update(1, "game", true));
        assert!(state.update(1, "game", true));
        assert!(state.update(2, "upload", true));
        assert!(state.update(1, "game", false));
        assert!(!state.update(2, "upload", false));
        assert!(state.0.is_empty());
    }
}
