//! Timers: game logic's "in 0.3 s, do this" without a JS list scanned every frame. A timer shares
//! the animation id space and is reported in `World::done` when it fires, so JS runs its callback
//! the same way it resolves an animation's promise.

use super::*;

#[derive(Clone, Copy, Debug)]
pub(super) struct Timer {
    pub id: u32,
    /// World clock time it fires at, in seconds.
    pub at: f64,
}

impl World {
    /// Starts a timer firing `seconds` from now (at the end of the `update` that reaches it).
    /// Returns its id, reported once in `done`.
    pub fn after(&mut self, seconds: f32) -> u32 {
        self.next_animation = self.next_animation.wrapping_add(1).max(1);
        let id = self.next_animation;
        let delay = if seconds.is_finite() { seconds.max(0.0) } else { 0.0 };
        self.timers.push(Timer { id, at: self.clock + delay as f64 });
        id
    }

    /// Drops every pending timer (they never fire). Returns how many were dropped.
    pub fn cancel_timers(&mut self) -> usize {
        let n = self.timers.len();
        self.timers.clear();
        n
    }

    /// Timers still waiting to fire.
    pub fn timer_count(&self) -> usize {
        self.timers.len()
    }

    /// Moves the clock on by `dt` and reports due timers in `done`, earliest first. Timers that
    /// don't fit in `done` this time fire on the next update.
    pub(super) fn advance_timers(&mut self, dt: f32) {
        if dt.is_finite() && dt > 0.0 {
            self.clock += dt as f64;
        }
        if self.timers.is_empty() {
            return;
        }
        let clock = self.clock;
        let mut due: Vec<Timer> = Vec::new();
        self.timers.retain(|t| {
            if t.at <= clock {
                due.push(*t);
                false
            } else {
                true
            }
        });
        if due.is_empty() {
            return;
        }
        due.sort_by(|a, b| a.at.partial_cmp(&b.at).unwrap_or(std::cmp::Ordering::Equal).then(a.id.cmp(&b.id)));
        let room = self.done.capacity().saturating_sub(self.done.len());
        for (k, t) in due.into_iter().enumerate() {
            if k < room {
                self.done.push(t.id);
            } else {
                self.timers.push(t);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fires_once_after_its_delay_in_order() {
        let mut w = World::new(8);
        let late = w.after(0.5);
        let early = w.after(0.2);
        w.update(0.1);
        assert!(w.done().is_empty());
        w.update(0.15);
        assert_eq!(w.done(), &[early]);
        w.update(0.3);
        assert_eq!(w.done(), &[late]);
        w.update(1.0);
        assert!(w.done().is_empty(), "reported once");
        assert_eq!(w.timer_count(), 0);
    }

    #[test]
    fn same_update_fires_earliest_first() {
        let mut w = World::new(8);
        let b = w.after(0.3);
        let a = w.after(0.1);
        w.update(1.0);
        assert_eq!(w.done(), &[a, b]);
    }

    #[test]
    fn cancel_drops_pending_timers() {
        let mut w = World::new(8);
        w.after(0.1);
        w.after(0.2);
        assert_eq!(w.cancel_timers(), 2);
        w.update(1.0);
        assert!(w.done().is_empty());
    }

    #[test]
    fn zero_and_invalid_delays_fire_on_the_next_update() {
        let mut w = World::new(8);
        let z = w.after(0.0);
        let n = w.after(f32::NAN);
        w.update(0.0);
        assert_eq!(w.done(), &[z, n]);
    }
}
