//! Per-entity native clip playback. Geometry and clips remain shared; only bone poses vary.

use super::*;
use crate::assets::{
    model,
    skeleton::{PALETTE_FLOATS, SkinDraw, Transform},
};
use rapier3d::glamx::{Mat4, Vec4};
use std::sync::Arc;

pub(super) struct Player {
    model: Arc<model::Model>,
    clip: Option<usize>,
    looping: bool,
    speed: f32,
    paused: bool,
    time: f64,
    previous_time: f64,
    fade: f32,
    elapsed: f32,
    previous_elapsed: f32,
    from: Vec<Transform>,
    pose: Vec<Transform>,
    globals: Vec<Mat4>,
}

impl Player {
    fn bind(model: Arc<model::Model>) -> Self {
        Self {
            model,
            clip: None,
            looping: false,
            speed: 0.0,
            paused: true,
            time: 0.0,
            previous_time: 0.0,
            fade: 0.0,
            elapsed: 0.0,
            previous_elapsed: 0.0,
            from: Vec::new(),
            pose: Vec::new(),
            globals: Vec::new(),
        }
    }

    fn evaluate(&mut self, time: f64, elapsed: f32, out: &mut [f32; PALETTE_FLOATS]) {
        let rig = self.model.skeleton.as_ref().unwrap();
        if let Some(clip) = self.clip {
            let duration = rig.clips[clip].duration;
            let time = if self.looping && duration > 0.0 {
                time.rem_euclid(duration as f64) as f32
            } else {
                (time as f32).clamp(0.0, duration)
            };
            rig.sample(clip, time, &mut self.pose);
        } else {
            self.pose.clear();
            self.pose.extend(rig.nodes.iter().map(|node| node.rest));
        }
        if self.fade > 0.0 && elapsed < self.fade && self.from.len() == self.pose.len() {
            let t = (elapsed / self.fade).clamp(0.0, 1.0);
            for (p, from) in self.pose.iter_mut().zip(&self.from) {
                *p = from.blend(*p, t);
            }
        }
        rig.palette(&self.pose, &mut self.globals, out);
    }

    fn render(&mut self, alpha: f32, steps: usize, out: &mut [f32; PALETTE_FLOATS]) {
        if self.paused {
            self.evaluate(self.time, self.elapsed, out);
            return;
        }
        let (time, fade) = if steps == 0 {
            (
                self.previous_time + (self.time - self.previous_time) * alpha as f64,
                self.previous_elapsed + (self.elapsed - self.previous_elapsed) * alpha,
            )
        } else {
            let dt = (steps as f32 - 1.0 + alpha) * FIXED_DT;
            (self.time + (dt * self.speed) as f64, self.elapsed + dt)
        };
        self.evaluate(time, fade, out);
    }
}

impl World {
    pub(super) fn bind_skeleton(&mut self, entity: Entity) {
        let Some(i) = self.dense(entity) else { return };
        if self.mesh[i] < model::FIRST_MODEL_MESH {
            return;
        }
        if let Some(model) = model::get(self.mesh[i])
            && model.skeleton.is_some()
        {
            self.skeletons.insert(entity, Player::bind(model));
        }
    }

    /// `time < 0` continues an already selected clip; a different clip starts at zero. Explicit
    /// `time` restarts/seeks. Crossfades capture the current blended pose, avoiding snapping on interruption.
    pub fn play_clip(&mut self, entity: Entity, name: &str, looping: bool, speed: f32, fade: f32, time: f32) -> bool {
        let Some(i) = self.dense(entity) else { return false };
        let Some(model) = model::get(self.mesh[i]) else { return false };
        let Some(rig) = &model.skeleton else { return false };
        let Some(clip) = rig.clips.iter().position(|clip| clip.name == name) else {
            return false;
        };
        if !speed.is_finite() || speed < 0.0 || !fade.is_finite() || fade < 0.0 || !time.is_finite() {
            return false;
        }
        if time < 0.0
            && let Some(player) = self.skeletons.get_mut(&entity)
            && Arc::ptr_eq(&player.model, &model)
            && player.clip == Some(clip)
        {
            player.paused = false;
            player.looping = looping;
            player.speed = speed;
            return true;
        }
        let mut from = rig.nodes.iter().map(|node| node.rest).collect::<Vec<_>>();
        if let Some(mut previous) = self.skeletons.remove(&entity)
            && Arc::ptr_eq(&previous.model, &model)
        {
            previous.render(self.alpha, 0, &mut [0.0; PALETTE_FLOATS]);
            from = previous.pose;
        }
        let time = time.max(0.0) as f64;
        self.skeletons.insert(
            entity,
            Player {
                model,
                clip: Some(clip),
                looping,
                speed,
                paused: false,
                time,
                previous_time: time,
                fade,
                elapsed: 0.0,
                previous_elapsed: 0.0,
                from,
                pose: Vec::new(),
                globals: Vec::new(),
            },
        );
        true
    }

    /// Freeze where the character is, or return it to the file's bind pose.
    pub fn stop_clip(&mut self, entity: Entity, reset: bool) -> bool {
        let Some(player) = self.skeletons.get_mut(&entity) else { return false };
        if reset {
            *player = Player::bind(player.model.clone());
            return true;
        }
        let time = player.previous_time + (player.time - player.previous_time) * self.alpha as f64;
        let elapsed = player.previous_elapsed + (player.elapsed - player.previous_elapsed) * self.alpha;
        player.time = time;
        player.previous_time = time;
        player.elapsed = elapsed;
        player.previous_elapsed = elapsed;
        player.paused = true;
        true
    }

    pub(super) fn advance_skeletons(&mut self, dt: f32) {
        for player in self.skeletons.values_mut() {
            if player.paused {
                continue;
            }
            player.previous_time = player.time;
            player.previous_elapsed = player.elapsed;
            player.time += (dt * player.speed) as f64;
            player.elapsed = (player.elapsed + dt).min(player.fade);
        }
    }

    /// Cheap guard for per-entity skeleton lookups in hot paths (most worlds have none).
    pub(super) fn has_skeletons(&self) -> bool {
        !self.skeletons.is_empty()
    }

    pub(super) fn write_skin(&mut self, entity: Entity, instance: usize, index: usize, alpha: f32) -> bool {
        let Some(player) = self.skeletons.get_mut(&entity) else { return false };
        if self.out_skins.len() <= index {
            self.out_skins.push(SkinDraw::new(instance));
        }
        let draw = &mut self.out_skins[index];
        draw.instance = instance;
        player.render(alpha, 0, &mut draw.matrices);
        true
    }

    pub fn skin_draws(&self) -> &[SkinDraw] {
        &self.out_skins
    }

    /// Skin only selected vertices on the CPU, in model space, for feet, attachments and hit
    /// markers. `after` previews the same fixed-step/interpolated pose the next update will draw.
    /// The GPU still skins the full character; this query never copies or deforms its mesh.
    pub fn skin_points(&mut self, entity: Entity, indices: &[u32], out: &mut [f32], after: f32) -> bool {
        let Some(i) = self.dense(entity) else { return false };
        let Some(model) = model::get(self.mesh[i]) else { return false };
        if out.len() < indices.len() * 3
            || indices.iter().any(|&i| i as usize >= model.vertices.len() / model::VERTEX_FLOATS)
            || !after.is_finite()
            || after < 0.0
        {
            return false;
        }
        let mut palette = SkinDraw::new(0).matrices;
        if let Some(player) = self.skeletons.get_mut(&entity) {
            let mut remainder = self.accumulator + after.min(0.1);
            let mut steps = 0;
            while remainder >= FIXED_DT && steps < MAX_STEPS_PER_UPDATE as usize {
                remainder -= FIXED_DT;
                steps += 1;
            }
            if steps == MAX_STEPS_PER_UPDATE as usize {
                remainder = remainder.min(FIXED_DT * 0.999);
            }
            player.render(remainder / FIXED_DT, steps, &mut palette);
        }
        for (&index, out) in indices.iter().zip(out.as_chunks_mut::<3>().0.iter_mut()) {
            let index = index as usize;
            let v = &model.vertices[index * model::VERTEX_FLOATS..];
            let point = Vec4::new(v[0], v[1], v[2], 1.0);
            let mut p = point;
            if !model.skin.is_empty() {
                let skin = &model.skin[index * 8..index * 8 + 8];
                let sum: f32 = skin[4..].iter().sum();
                if sum > 0.0 {
                    p = Vec4::ZERO;
                    for k in 0..4 {
                        if skin[k + 4] > 0.0 {
                            let at = skin[k] as usize * 16;
                            p += Mat4::from_cols_slice(&palette[at..at + 16]) * point * skin[k + 4];
                        }
                    }
                }
            }
            out.copy_from_slice(&p.truncate().to_array());
        }
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> (World, Entity, Entity) {
        let mesh = model::load(&crate::assets::skeleton::tests::fixture(), model::LoadOptions { center: false, fit: 0. }).unwrap();
        let mut w = World::new(8);
        let a = w.spawn(mesh, Vec3::ZERO, Vec3::ONE, [1.; 4]).unwrap();
        let b = w.spawn(mesh, Vec3::ZERO, Vec3::ONE, [1.; 4]).unwrap();
        (w, a, b)
    }
    fn point(w: &mut World, e: Entity, after: f32) -> f32 {
        let mut p = [0.; 3];
        assert!(w.skin_points(e, &[0], &mut p, after));
        p[1]
    }
    #[test]
    fn unplayed_characters_use_the_files_rest_skeleton_and_mesh_changes_reset_it() {
        let mut doc: serde_json::Value = serde_json::from_slice(&crate::assets::skeleton::tests::fixture()).unwrap();
        doc["nodes"][0]["translation"] = serde_json::json!([0, 1, 0]);
        let mesh = model::load(&serde_json::to_vec(&doc).unwrap(), model::LoadOptions { center: false, fit: 0.0 }).unwrap();
        let mut w = World::new(2);
        let e = w.spawn(mesh, Vec3::ZERO, Vec3::ONE, [1.; 4]).unwrap();
        assert!((point(&mut w, e, 0.) - 1.).abs() < 1e-5);
        w.play_clip(e, "Move", true, 0., 0., 0.);
        assert_eq!(point(&mut w, e, 0.), 0.);
        w.stop_clip(e, true);
        assert!((point(&mut w, e, 0.) - 1.).abs() < 1e-5);
        w.set_mesh(e, shapes::CUBE);
        assert!(w.skeletons.is_empty());
        w.set_mesh(e, mesh);
        assert!((point(&mut w, e, 0.) - 1.).abs() < 1e-5);
    }

    #[test]
    fn instances_play_independently_and_preview_matches_rendered_pose() {
        let (mut w, a, b) = fixture();
        assert!(w.play_clip(a, "Move", true, 1., 0., -1.));
        assert!(w.play_clip(b, "Move", true, 0., 0., 0.5));
        for _ in 0..20 {
            let preview = point(&mut w, a, 0.021);
            w.update(0.021);
            assert!((preview - point(&mut w, a, 0.)).abs() < 1e-5);
        }
        assert!((point(&mut w, a, 0.) - point(&mut w, b, 0.)).abs() > 0.1);
        assert_eq!(w.skin_draws().len(), 2);
        assert!(w.skin_draws()[0].instance < w.skin_draws()[1].instance);
    }
    #[test]
    fn preview_matches_fixed_steps_at_boundaries_and_after_stalls() {
        let (mut w, a, _) = fixture();
        assert!(w.play_clip(a, "Move", true, 1.3, 0.2, -1.));
        for dt in [0.0, 0.001, FIXED_DT, 0.025, 0.05, 0.09, 0.13].into_iter().cycle().take(56) {
            let predicted = point(&mut w, a, dt);
            w.update(dt);
            assert!((predicted - point(&mut w, a, 0.)).abs() < 1e-5, "preview after {dt}");
        }
        assert!(w.play_clip(a, "Back", true, 1., 0.3, -1.));
        w.update(0.025);
        let drawn = point(&mut w, a, 0.);
        assert!(w.stop_clip(a, false));
        assert!((point(&mut w, a, 0.) - drawn).abs() < 1e-5);
        for _ in 0..10 {
            w.update(0.03);
            assert!((point(&mut w, a, 0.) - drawn).abs() < 1e-5);
        }
    }

    #[test]
    fn looping_clamping_speed_changes_and_pose_hold() {
        let (mut w, a, _) = fixture();
        assert!(w.play_clip(a, "Move", false, 1., 0., 0.99));
        for _ in 0..10 {
            w.update(0.02);
        }
        assert!((point(&mut w, a, 0.) - 2.).abs() < 1e-5);
        assert!(w.play_clip(a, "Move", true, 0., 0., 0.5));
        assert!((point(&mut w, a, 0.) - 1.).abs() < 1e-5);
        assert!(w.play_clip(a, "Move", true, 2., 0., -1.));
        w.update(0.025);
        assert!(point(&mut w, a, 0.) > 1.);
        assert!(w.stop_clip(a, false));
        let held = point(&mut w, a, 0.);
        w.update(0.04);
        assert_eq!(point(&mut w, a, 0.), held);
        assert!(w.stop_clip(a, true));
        assert_eq!(point(&mut w, a, 0.), 0.);
    }
    #[test]
    fn crossfade_is_continuous_and_despawned_children_release_players() {
        let (mut w, a, b) = fixture();
        assert!(w.play_clip(a, "Move", true, 0., 0., 0.5));
        let before = point(&mut w, a, 0.);
        assert!(w.play_clip(a, "Back", true, 1., 0.2, -1.));
        assert!((point(&mut w, a, 0.) - before).abs() < 1e-5);
        w.update(0.04);
        let next = point(&mut w, a, 0.);
        assert!(next < before && next > 0.);
        assert!(w.set_parent(a, Some(b)));
        w.despawn(b);
        assert!(w.skeletons.is_empty());
        assert!(!w.play_clip(a, "Move", true, 1., 0., 0.));
    }
}
