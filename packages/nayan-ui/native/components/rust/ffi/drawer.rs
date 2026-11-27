//! Main-thread-owned drawer motion. Native hosts apply transforms on their display clock;
//! browsers sample the same state from WASM. No JavaScript animation policy or per-frame events.
use crate::Easing;

pub const MOVING: u32 = 1;
pub const OPEN: u32 = 2;
pub const DRAGGING: u32 = 4;
pub const CANDIDATE: u32 = 8;
pub const REQUEST: u32 = 16;

struct Pointer {
    x: f32,
    y: f32,
    last_x: f32,
    last_time: f64,
    velocity: f32,
    progress: f32,
    dragging: bool,
    backdrop: bool,
}

pub struct Drawer {
    progress: f32,
    start: f32,
    elapsed: f32,
    duration: f32,
    open: bool,
    width: f32,
    viewport: f32,
    edge: f32,
    enabled: bool,
    swipe: bool,
    right: bool,
    reduced: bool,
    pointer: Option<Pointer>,
}

impl Default for Drawer {
    fn default() -> Self {
        Self {
            progress: 0.,
            start: 0.,
            elapsed: 0.,
            duration: 0.,
            open: false,
            width: 300.,
            viewport: 400.,
            edge: 24.,
            enabled: true,
            swipe: true,
            right: false,
            reduced: false,
            pointer: None,
        }
    }
}

impl Drawer {
    fn target(&self) -> f32 {
        if self.open { 1. } else { 0. }
    }
    fn moving(&self) -> bool {
        self.pointer.as_ref().is_none_or(|p| !p.dragging) && (self.progress - self.target()).abs() > 0.0001
    }
    fn state(&self, request: bool) -> f64 {
        let flags = u32::from(self.moving()) * MOVING
            | u32::from(self.open) * OPEN
            | u32::from(self.pointer.as_ref().is_some_and(|p| p.dragging)) * DRAGGING
            | u32::from(self.pointer.is_some()) * CANDIDATE
            | u32::from(request) * REQUEST;
        flags as f64 * 2. + self.progress as f64
    }
    fn settle(&mut self, open: bool) {
        self.open = open && self.enabled;
        self.start = self.progress;
        self.elapsed = 0.;
        self.duration = (0.26 * (self.target() - self.progress).abs()).clamp(0.10, 0.26);
        if self.reduced || !self.enabled || (self.progress - self.target()).abs() <= 0.0001 {
            self.progress = self.target();
        }
    }
    fn configure(&mut self, width: f32, viewport: f32, edge: f32, flags: u32) -> f64 {
        if [width, viewport, edge].iter().any(|x| !x.is_finite()) {
            return self.state(false);
        }
        self.viewport = viewport.max(1.);
        self.width = width.clamp(1., self.viewport);
        self.edge = edge.clamp(0., self.viewport);
        self.enabled = flags & 1 != 0;
        self.swipe = flags & 2 != 0;
        self.right = flags & 4 != 0;
        self.reduced = flags & 8 != 0;
        if !self.enabled {
            self.pointer = None;
            self.settle(false);
        }
        if self.reduced && self.pointer.as_ref().is_none_or(|p| !p.dragging) {
            self.progress = self.target();
        }
        self.state(false)
    }
    fn input(&mut self, action: i32, x: f32, y: f32, time: f64) -> f64 {
        if !x.is_finite() || !y.is_finite() || !time.is_finite() {
            return self.state(false);
        }
        let mut request = false;
        let direction = if self.right { -1. } else { 1. };
        match action {
            0 => {
                if self.moving() {
                    self.elapsed += x.clamp(0., 0.05);
                    let t = (self.elapsed / self.duration.max(0.001)).min(1.);
                    self.progress = self.start + (self.target() - self.start) * Easing::Out.apply(t);
                    if t >= 1. || (self.progress - self.target()).abs() <= 0.0001 {
                        self.progress = self.target();
                    }
                }
            }
            1 => {
                self.pointer = None;
                self.settle(x != 0.);
            }
            2 if self.enabled => {
                let from_edge = if self.right { self.viewport - x } else { x };
                let backdrop = self.progress > 0. && from_edge > self.progress * self.width;
                if backdrop || (self.swipe && (self.progress > 0. || (from_edge >= 0. && from_edge <= self.edge))) {
                    self.pointer = Some(Pointer {
                        x,
                        y,
                        last_x: x,
                        last_time: time,
                        velocity: 0.,
                        progress: self.progress,
                        dragging: false,
                        backdrop,
                    });
                }
            }
            3 => {
                if let Some(p) = &mut self.pointer {
                    let dx = (x - p.x) * direction;
                    let dy = (y - p.y).abs();
                    if !p.dragging && dy > 8. && dy > dx.abs() {
                        self.pointer = None;
                        return self.state(false);
                    }
                    if !p.dragging && self.swipe && dx.abs() > 8. && dx.abs() > dy * 1.2 && (p.progress > 0. || dx > 0.) {
                        p.dragging = true;
                    }
                    if p.dragging {
                        let dt = (time - p.last_time) as f32;
                        if dt > 0. {
                            p.velocity = ((x - p.last_x) * direction / dt).clamp(-5000., 5000.);
                        }
                        self.progress = (p.progress + dx / self.width).clamp(0., 1.);
                    }
                    p.last_x = x;
                    p.last_time = time;
                }
            }
            4 => {
                if let Some(p) = self.pointer.take() {
                    let target = if p.dragging {
                        let velocity = if time - p.last_time > 0.08 { 0. } else { p.velocity };
                        self.progress + velocity / self.width * 0.12 >= 0.5
                    } else {
                        self.open && !(p.backdrop && (x - p.x).abs() < 8. && (y - p.y).abs() < 8.)
                    };
                    request = target != self.open;
                    self.settle(target);
                }
            }
            5 => {
                self.pointer = None;
                self.settle(self.open);
            }
            6 => {
                self.pointer = None;
                request = self.open;
                self.settle(false);
            }
            _ => {}
        }
        self.state(request)
    }
}

#[unsafe(no_mangle)]
pub extern "C" fn engine_drawer_new() -> *mut Drawer {
    Box::into_raw(Box::new(Drawer::default()))
}
/// # Safety
/// `ptr` is null or a live drawer allocated by engine_drawer_new, freed exactly once.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_drawer_free(ptr: *mut Drawer) {
    if !ptr.is_null() {
        unsafe {
            drop(Box::from_raw(ptr));
        }
    }
}
/// # Safety
/// `ptr` is null or a live drawer used exclusively on its owning UI thread.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_drawer_configure(ptr: *mut Drawer, width: f32, viewport: f32, edge: f32, flags: u32) -> f64 {
    unsafe { ptr.as_mut() }.map_or(0., |drawer| drawer.configure(width, viewport, edge, flags))
}
/// # Safety
/// `ptr` is null or a live drawer used exclusively on its owning UI thread.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_drawer_input(ptr: *mut Drawer, action: i32, x: f32, y: f32, time: f64) -> f64 {
    unsafe { ptr.as_mut() }.map_or(0., |drawer| drawer.input(action, x, y, time))
}

#[cfg(test)]
mod tests {
    use super::*;
    fn finish(d: &mut Drawer) {
        for _ in 0..60 {
            d.input(0, 1. / 60., 0., 0.);
        }
    }
    #[test]
    fn engine_easing_finishes_and_reversals_keep_the_current_position() {
        let mut d = Drawer::default();
        d.input(1, 1., 0., 0.);
        d.input(0, 0.05, 0., 0.);
        assert!(d.progress > 0. && d.progress < 1.);
        let before = d.progress;
        d.input(1, 0., 0., 0.);
        assert_eq!(d.progress, before);
        finish(&mut d);
        assert_eq!(d.progress, 0.);
        assert!(!d.moving());
        d.input(1, 1., 0., 0.);
        finish(&mut d);
        assert_eq!(d.progress, 1.);
    }
    #[test]
    fn only_edge_horizontal_drags_claim_closed_input_and_vertical_scrolling_survives() {
        let mut d = Drawer::default();
        d.input(2, 80., 50., 0.);
        d.input(3, 250., 50., 0.1);
        assert!(d.pointer.is_none());
        d.input(2, 4., 50., 0.);
        d.input(3, 8., 100., 0.1);
        assert!(d.pointer.is_none());
        d.input(2, 4., 50., 0.);
        d.input(3, 200., 50., 0.2);
        assert!(d.pointer.as_ref().unwrap().dragging);
        let result = d.input(4, 200., 50., 0.2);
        assert_ne!((result / 2.) as u32 & REQUEST, 0);
        finish(&mut d);
        assert_eq!(d.progress, 1.);
    }
    #[test]
    fn recent_velocity_opens_a_short_fling_but_a_paused_short_drag_closes() {
        for (pause, expected) in [(0., true), (0.2, false)] {
            let mut d = Drawer::default();
            d.input(2, 2., 0., 0.);
            d.input(3, 42., 0., 0.02);
            d.input(4, 42., 0., 0.02 + pause);
            finish(&mut d);
            assert_eq!(d.open, expected);
        }
    }
    #[test]
    fn backdrop_taps_close_but_panel_taps_and_cancel_do_not() {
        let mut d = Drawer::default();
        d.input(1, 1., 0., 0.);
        finish(&mut d);
        d.input(2, 100., 50., 0.);
        d.input(4, 100., 50., 0.1);
        assert!(d.open);
        d.input(2, 100., 50., 0.);
        d.input(3, 30., 50., 0.1);
        d.input(5, 0., 0., 0.2);
        finish(&mut d);
        assert_eq!(d.progress, 1.);
        d.input(2, 380., 50., 0.);
        d.input(4, 380., 50., 0.1);
        finish(&mut d);
        assert_eq!(d.progress, 0.);
    }
    #[test]
    fn right_edge_resizing_reduced_motion_and_disabling_are_deterministic() {
        let mut d = Drawer::default();
        d.configure(300., 400., 24., 7);
        d.input(2, 397., 20., 0.);
        d.input(3, 190., 20., 0.2);
        d.input(4, 190., 20., 0.2);
        finish(&mut d);
        assert_eq!(d.progress, 1.);
        d.configure(800., 240., 24., 7);
        assert_eq!(d.width, 240.);
        assert_eq!(d.progress, 1.);
        d.configure(200., 240., 24., 15);
        d.input(1, 0., 0., 0.);
        assert_eq!(d.progress, 0.);
        assert!(!d.moving());
        d.input(1, 1., 0., 0.);
        d.configure(200., 240., 24., 0);
        assert_eq!(d.progress, 0.);
        assert!(!d.open);
        d.input(1, 1., 0., 0.);
        assert!(!d.open);
    }
    #[test]
    fn invalid_input_does_not_poison_the_motion() {
        let mut d = Drawer::default();
        d.configure(f32::NAN, 400., 24., 3);
        d.input(1, 1., 0., 0.);
        d.input(0, f32::NAN, 0., 0.);
        finish(&mut d);
        assert_eq!(d.progress, 1.);
    }
}
