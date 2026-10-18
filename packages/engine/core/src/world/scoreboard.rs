//! Score, lives and the game clock, kept in Rust and advanced by `update`: points, time-based points
//! (survival, distance), countdowns and their whole-second ticks. JS only reads the state buffer to
//! show it, and is told what changed through `flags`.

/// Layout of the state buffer (f64s), shared with JS.
pub const SB_SCORE: usize = 0;
pub const SB_LIVES: usize = 1;
/// Seconds left (countdown) or elapsed (clock).
pub const SB_SECONDS: usize = 2;
/// The whole seconds shown: ceil of the time left, or floor of the elapsed time.
pub const SB_SHOWN: usize = 3;
/// What changed since JS last cleared it (`SB_FLAG_*` bits). JS writes 0 after reading.
pub const SB_FLAGS: usize = 4;
pub const SB_RUNNING: usize = 5;
/// Points earned per second while the clock runs.
pub const SB_RATE: usize = 6;
/// The best score seen (this world's lifetime).
pub const SB_BEST: usize = 7;
pub const SB_LEN: usize = 8;

pub const SB_FLAG_SCORE: u32 = 1;
pub const SB_FLAG_LIVES: u32 = 2;
pub const SB_FLAG_SECOND: u32 = 4;
pub const SB_FLAG_TIME_UP: u32 = 8;
pub const SB_FLAG_LIVES_OUT: u32 = 16;

/// Operations for `World::scoreboard`.
pub mod op {
    pub const ADD_SCORE: u32 = 0;
    pub const SET_SCORE: u32 = 1;
    pub const ADD_LIVES: u32 = 2;
    pub const SET_LIVES: u32 = 3;
    /// a = seconds (> 0 counts down, 0 counts up), b = points per second.
    pub const START_CLOCK: u32 = 4;
    pub const STOP_CLOCK: u32 = 5;
    pub const RESUME_CLOCK: u32 = 6;
    /// a = lives: score 0, clock stopped at 0.
    pub const RESET: u32 = 7;
    /// a = seconds added to the clock (time bonuses).
    pub const ADD_TIME: u32 = 8;
    /// Adds a = points per whole second saved: the seconds shown on a countdown, or b (the expected
    /// time) minus the whole seconds elapsed on a clock counting up. Returns the new score.
    pub const TIME_BONUS: u32 = 9;
}

#[derive(Debug, Default)]
pub struct Scoreboard {
    pub state: Box<[f64; SB_LEN]>,
    countdown: bool,
    /// Fractional points from the rate, not yet whole.
    carry: f64,
}

impl Scoreboard {
    fn flag(&mut self, f: u32) {
        self.state[SB_FLAGS] = (self.state[SB_FLAGS] as u32 | f) as f64;
    }

    fn set_score(&mut self, s: f64) {
        let s = if s.is_finite() { s.round() } else { 0.0 };
        if s != self.state[SB_SCORE] {
            self.state[SB_SCORE] = s;
            self.flag(SB_FLAG_SCORE);
        }
        if s > self.state[SB_BEST] {
            self.state[SB_BEST] = s;
        }
    }

    fn set_lives(&mut self, l: f64) {
        let l = if l.is_finite() { l.round().max(0.0) } else { 0.0 };
        if l != self.state[SB_LIVES] {
            let had = self.state[SB_LIVES];
            self.state[SB_LIVES] = l;
            self.flag(SB_FLAG_LIVES);
            if l == 0.0 && had > 0.0 {
                self.flag(SB_FLAG_LIVES_OUT);
            }
        }
    }

    fn shown(&self) -> f64 {
        let s = self.state[SB_SECONDS];
        if self.countdown { s.ceil().max(0.0) } else { s.floor() }
    }

    fn refresh_shown(&mut self) {
        let shown = self.shown();
        if shown != self.state[SB_SHOWN] {
            self.state[SB_SHOWN] = shown;
            self.flag(SB_FLAG_SECOND);
        }
    }

    /// Applies an operation. Returns the score after it.
    pub fn apply(&mut self, op: u32, a: f64, b: f64) -> f64 {
        let fin = |x: f64| if x.is_finite() { x } else { 0.0 };
        match op {
            op::ADD_SCORE => self.set_score(self.state[SB_SCORE] + fin(a)),
            op::SET_SCORE => self.set_score(fin(a)),
            op::ADD_LIVES => self.set_lives(self.state[SB_LIVES] + fin(a)),
            op::SET_LIVES => self.set_lives(fin(a)),
            op::START_CLOCK => {
                let seconds = fin(a).max(0.0);
                self.countdown = seconds > 0.0;
                self.state[SB_SECONDS] = seconds;
                self.state[SB_RATE] = fin(b);
                self.state[SB_RUNNING] = 1.0;
                self.carry = 0.0;
                self.refresh_shown();
            }
            op::STOP_CLOCK => self.state[SB_RUNNING] = 0.0,
            op::RESUME_CLOCK => {
                if !self.countdown || self.state[SB_SECONDS] > 0.0 {
                    self.state[SB_RUNNING] = 1.0;
                }
            }
            op::RESET => {
                self.set_score(0.0);
                self.set_lives(fin(a));
                self.state[SB_FLAGS] = (self.state[SB_FLAGS] as u32 & !SB_FLAG_LIVES_OUT) as f64;
                self.state[SB_RUNNING] = 0.0;
                self.state[SB_RATE] = 0.0;
                self.state[SB_SECONDS] = 0.0;
                self.countdown = false;
                self.carry = 0.0;
                self.refresh_shown();
            }
            op::TIME_BONUS => {
                let saved = if self.countdown { self.shown() } else { (fin(b) - self.state[SB_SECONDS].floor()).max(0.0) };
                self.set_score(self.state[SB_SCORE] + saved * fin(a));
            }
            op::ADD_TIME => {
                self.state[SB_SECONDS] = (self.state[SB_SECONDS] + fin(a)).max(0.0);
                self.refresh_shown();
            }
            _ => {}
        }
        self.state[SB_SCORE]
    }

    /// Runs the clock for `dt` seconds: time-based points, second ticks, the countdown ending.
    pub fn advance(&mut self, dt: f32) {
        if self.state[SB_RUNNING] == 0.0 || !dt.is_finite() || dt <= 0.0 {
            return;
        }
        let mut dt = dt as f64;
        if self.countdown {
            dt = dt.min(self.state[SB_SECONDS]);
            self.state[SB_SECONDS] -= dt;
        } else {
            self.state[SB_SECONDS] += dt;
        }
        let rate = self.state[SB_RATE];
        if rate != 0.0 {
            self.carry += rate * dt;
            let whole = self.carry.trunc();
            if whole != 0.0 {
                self.carry -= whole;
                self.set_score(self.state[SB_SCORE] + whole);
            }
        }
        self.refresh_shown();
        if self.countdown && self.state[SB_SECONDS] <= 0.0 {
            self.state[SB_SECONDS] = 0.0;
            self.state[SB_RUNNING] = 0.0;
            self.flag(SB_FLAG_TIME_UP);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn flags(s: &mut Scoreboard) -> u32 {
        let f = s.state[SB_FLAGS] as u32;
        s.state[SB_FLAGS] = 0.0;
        f
    }

    #[test]
    fn countdown_ticks_each_second_and_ends() {
        let mut s = Scoreboard::default();
        s.apply(op::START_CLOCK, 2.0, 0.0);
        assert_eq!(s.state[SB_SHOWN], 2.0);
        flags(&mut s);
        s.advance(0.5);
        assert_eq!(flags(&mut s), 0);
        s.advance(0.6);
        assert_eq!(flags(&mut s), SB_FLAG_SECOND);
        assert_eq!(s.state[SB_SHOWN], 1.0);
        s.advance(5.0);
        assert_eq!(flags(&mut s), SB_FLAG_SECOND | SB_FLAG_TIME_UP);
        assert_eq!(s.state[SB_SECONDS], 0.0);
        s.advance(1.0);
        assert_eq!(flags(&mut s), 0, "stopped");
    }

    #[test]
    fn time_based_points_accumulate_whole_points() {
        let mut s = Scoreboard::default();
        s.apply(op::START_CLOCK, 0.0, 10.0);
        for _ in 0..60 {
            s.advance(1.0 / 60.0);
        }
        assert_eq!(s.state[SB_SCORE], 10.0);
        assert_eq!(s.state[SB_SHOWN], 1.0);
        s.apply(op::STOP_CLOCK, 0.0, 0.0);
        s.advance(1.0);
        assert_eq!(s.state[SB_SCORE], 10.0);
    }

    #[test]
    fn time_bonus_pays_for_seconds_saved() {
        let mut s = Scoreboard::default();
        s.apply(op::START_CLOCK, 300.0, 0.0);
        s.advance(10.5); // 289.5 left, shown 290
        assert_eq!(s.apply(op::TIME_BONUS, 100.0, 0.0), 29_000.0);
        let mut up = Scoreboard::default();
        up.apply(op::START_CLOCK, 0.0, 0.0);
        up.advance(40.7);
        assert_eq!(up.apply(op::TIME_BONUS, 10.0, 60.0), 200.0);
    }

    #[test]
    fn score_lives_and_reset() {
        let mut s = Scoreboard::default();
        s.apply(op::SET_LIVES, 2.0, 0.0);
        assert_eq!(s.apply(op::ADD_SCORE, 5.0, 0.0), 5.0);
        flags(&mut s);
        s.apply(op::ADD_LIVES, -2.0, 0.0);
        assert_eq!(flags(&mut s), SB_FLAG_LIVES | SB_FLAG_LIVES_OUT);
        s.apply(op::RESET, 3.0, 0.0);
        assert_eq!((s.state[SB_SCORE], s.state[SB_LIVES], s.state[SB_BEST]), (0.0, 3.0, 5.0));
        assert_eq!(flags(&mut s), SB_FLAG_SCORE | SB_FLAG_LIVES);
    }
}
