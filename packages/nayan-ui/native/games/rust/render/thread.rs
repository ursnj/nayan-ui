//! The render thread. The JS thread *publishes* a frame (a copy of the world's instances and the
//! frame's camera, light and quality: about a tenth of a millisecond even for thousands of
//! instances) and carries on with the game; this thread culls, submits and presents it. A game's
//! loop then never waits on the GPU, the driver or the display, and a frame that is still waiting
//! when a newer one arrives is replaced rather than queued (a slow GPU drops frames, never lags).

use std::collections::HashMap;
use std::sync::{Condvar, Mutex, MutexGuard, Once};
use std::time::Instant;

use super::{Frame, Instances};
use crate::assets::skeleton::SkinDraw;

/// A published frame: owned copies, so the world can change while it's drawn.
#[derive(Default)]
struct Snapshot {
    frame: Vec<f64>,
    matrices: Vec<f32>,
    colors: Vec<f32>,
    regions: Vec<f32>,
    has_regions: bool,
    ranges: Vec<u32>,
    count: usize,
    skins: Vec<SkinDraw>,
}

impl Snapshot {
    fn fill(&mut self, frame: &[f64], inst: &Instances) {
        let n = inst.count.min(inst.matrices.len() / 16).min(inst.colors.len() / 4);
        self.frame.clear();
        self.frame.extend_from_slice(frame);
        self.matrices.clear();
        self.matrices.extend_from_slice(&inst.matrices[..n * 16]);
        self.colors.clear();
        self.colors.extend_from_slice(&inst.colors[..n * 4]);
        self.regions.clear();
        self.has_regions = false;
        if let Some(r) = inst.regions.filter(|r| r.len() >= n * 4) {
            self.regions.extend_from_slice(&r[..n * 4]);
            self.has_regions = true;
        }
        self.ranges.clear();
        self.ranges.extend_from_slice(inst.ranges);
        self.count = n;
        self.skins.clear();
        self.skins.extend(inst.skins.iter().map(|s| SkinDraw {
            instance: s.instance,
            matrices: s.matrices,
        }));
    }

    fn instances(&self) -> Instances<'_> {
        Instances {
            skins: &self.skins,
            matrices: &self.matrices,
            colors: &self.colors,
            regions: self.has_regions.then_some(&self.regions[..]),
            ranges: &self.ranges,
            count: self.count,
        }
    }
}

#[derive(Default)]
struct Slot {
    /// Published and not drawn yet.
    latest: Option<Snapshot>,
    /// The last drawn snapshot's buffers, reused by the next publish.
    spare: Option<Snapshot>,
    /// Frames drawn and presented.
    presented: u64,
    /// Smoothed milliseconds per frame drawn (including any wait for a free swapchain image).
    render_ms: f32,
    /// The last frame failed (`render::last_error` says why).
    failed: bool,
}

#[derive(Default)]
struct Shared {
    slots: HashMap<i32, Slot>,
    /// Surfaces with a frame waiting, oldest first.
    dirty: Vec<i32>,
}

static SHARED: Mutex<Option<Shared>> = Mutex::new(None);
static WAKE: Condvar = Condvar::new();
static START: Once = Once::new();

fn shared() -> MutexGuard<'static, Option<Shared>> {
    SHARED.lock().unwrap_or_else(|e| e.into_inner())
}

/// Hands a frame to the render thread and returns its view-projection (for picking and `toScreen`)
/// and status: 1 once the surface has presented a frame, 0 before, -1 if the last frame failed.
pub fn publish(surface: i32, frame: &[f64], inst: &Instances) -> Result<([f32; 16], i32), String> {
    let parsed = Frame::from_slice(frame).ok_or("bad frame description")?;
    let view_proj = super::gpu::view_projection(&parsed).to_cols_array();
    START.call_once(|| {
        std::thread::Builder::new().name("nayan-render".into()).spawn(run).expect("render thread");
    });
    let mut guard = shared();
    let state = guard.get_or_insert_with(Shared::default);
    let slot = state.slots.entry(surface).or_default();
    let mut snapshot = slot.latest.take().or_else(|| slot.spare.take()).unwrap_or_default();
    snapshot.fill(frame, inst);
    slot.latest = Some(snapshot);
    let status = if slot.failed { -1 } else { (slot.presented > 0) as i32 };
    if !state.dirty.contains(&surface) {
        state.dirty.push(surface);
    }
    drop(guard);
    WAKE.notify_one();
    Ok((view_proj, status))
}

/// [frames presented, smoothed render milliseconds] for a surface.
pub fn stats(surface: i32) -> (u64, f32) {
    shared()
        .as_ref()
        .and_then(|s| s.slots.get(&surface))
        .map_or((0, 0.0), |slot| (slot.presented, slot.render_ms))
}

/// Forgets a detached surface's frames (a frame being drawn finishes first: `render::detach` waits).
pub fn forget(surface: i32) {
    if let Some(state) = shared().as_mut() {
        state.slots.remove(&surface);
        state.dirty.retain(|&s| s != surface);
    }
}

fn run() {
    loop {
        let (surface, snapshot) = {
            let mut guard = shared();
            loop {
                if let Some(state) = guard.as_mut()
                    && !state.dirty.is_empty()
                {
                    let surface = state.dirty.remove(0);
                    let snapshot = state.slots.get_mut(&surface).and_then(|slot| slot.latest.take());
                    break (surface, snapshot);
                }
                guard = WAKE.wait(guard).unwrap_or_else(|e| e.into_inner());
            }
        };
        let Some(snapshot) = snapshot else { continue };
        let started = Instant::now();
        let result = Frame::from_slice(&snapshot.frame)
            .ok_or_else(|| "bad frame description".to_string())
            .and_then(|frame| super::render(surface, &frame, &snapshot.instances()));
        let ms = started.elapsed().as_secs_f32() * 1000.0;
        if let Some(slot) = shared().as_mut().and_then(|s| s.slots.get_mut(&surface)) {
            match result {
                Ok(Some(_)) => {
                    slot.presented += 1;
                    slot.failed = false;
                    slot.render_ms = if slot.render_ms == 0.0 { ms } else { slot.render_ms * 0.9 + ms * 0.1 };
                }
                Ok(None) => {}
                Err(_) => slot.failed = true,
            }
            slot.spare = Some(snapshot);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn frame(width: f64) -> Vec<f64> {
        let mut f = vec![0.0; super::super::gpu::FRAME_LEN];
        f[0..3].copy_from_slice(&[0.0, 5.0, 10.0]);
        f[6] = 1.0;
        f[21] = width;
        f[22] = 100.0;
        f
    }

    #[test]
    fn publishing_returns_the_camera_at_once_and_replaces_an_undrawn_frame() {
        // No surface is attached (id 9001), so the thread draws nothing; publishing still works.
        let matrices = vec![1.0f32; 32];
        let colors = vec![0.5f32; 8];
        let ranges = vec![0u32, 2];
        let inst = Instances {
            skins: &[],
            matrices: &matrices,
            colors: &colors,
            regions: None,
            ranges: &ranges,
            count: 2,
        };
        let (view_proj, status) = publish(9001, &frame(200.0), &inst).expect("published");
        let expected = super::super::gpu::view_projection(&Frame::from_slice(&frame(200.0)).unwrap()).to_cols_array();
        assert_eq!(view_proj, expected);
        assert_eq!(status, 0, "nothing presented yet");
        assert!(publish(9001, &[0.0; 3], &inst).is_err(), "a malformed frame is refused");
        // Wait for the thread to take (and fail to draw) the frame: it never presents without a surface.
        for _ in 0..200 {
            if shared()
                .as_ref()
                .and_then(|s| s.slots.get(&9001))
                .is_some_and(|slot| slot.latest.is_none())
            {
                break;
            }
            std::thread::sleep(std::time::Duration::from_millis(1));
        }
        assert_eq!(stats(9001).0, 0);
        forget(9001);
        assert_eq!(stats(9001), (0, 0.0));
    }
}
