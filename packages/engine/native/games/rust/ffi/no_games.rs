//! The bridge links the same C ABI for every core build. Constructors report that games are
//! unavailable, so a caller never reaches the operations requiring a world handle.
use super::modelling::{EngineGeometry, unavailable};
use crate::World;
use std::ptr::{null, null_mut};

pub(super) const DISABLED: &str = "Games were disabled in this engine build";

macro_rules! disabled {
    ($($name:ident($($arg:ty),*) $(-> $output:ty)? => $value:expr;)*) => {
        $(
            #[unsafe(no_mangle)]
            pub extern "C" fn $name($(_: $arg),*) $(-> $output)? { $value }
        )*
    };
}

disabled! {
    engine_world_new(u32) -> *mut World => null_mut();
    engine_world_free(*mut World) => ();
    engine_world_spawn_desc(*mut World, *const f64, usize) -> u32 => u32::MAX;
    engine_world_set_desc(*mut World, u32, *const f64, usize) -> i32 => 0;
    engine_world_set_transforms(*mut World, *const f64, usize, usize) -> u32 => 0;
    engine_world_animate(*mut World, *const f64, usize) -> u32 => 0;
    engine_world_stop_animation(*mut World, u32) -> i32 => 0;
    engine_world_burst(*mut World, *const f64, usize) -> u32 => 0;
    engine_world_pick(*mut World, f32, f32, f32, f32, f32, f32) -> u32 => u32::MAX;
    engine_world_despawn(*mut World, u32) -> i32 => 0;
    engine_world_apply_impulse(*mut World, u32, f32, f32, f32) => ();
    engine_world_set_gravity(*mut World, f32, f32, f32) => ();
    engine_world_set_bounds(*mut World, f32, f32, f32, f32) => ();
    engine_world_set_listener(*mut World, u32) => ();
    engine_world_raycast(*mut World, f32, f32, f32, f32, f32, f32, f32, u32) -> u32 => u32::MAX;
    engine_world_read_position(*mut World, u32, i32) -> i32 => 0;
    engine_world_read_velocity(*mut World, u32) -> i32 => 0;
    engine_world_after(*mut World, f32) -> u32 => 0;
    engine_world_cancel_timers(*mut World) -> u32 => 0;
    engine_world_scoreboard(*mut World, u32, f64, f64) -> f64 => 0.0;
    engine_world_scoreboard_state(*mut World) -> *mut f64 => null_mut();
    engine_world_update(*mut World, f32) => ();
    engine_world_count(*mut World) -> u32 => 0;
    engine_world_capacity(*mut World) -> u32 => 0;
    engine_world_matrices(*mut World) -> *const f32 => null();
    engine_world_colors(*mut World) -> *const f32 => null();
    engine_world_regions(*mut World) -> *const f32 => null();
    engine_world_done(*mut World) -> *const u32 => null();
    engine_world_done_len(*mut World) -> u32 => 0;
    engine_world_ranges(*mut World) -> *const u32 => null();
    engine_world_events(*mut World) -> *const u32 => null();
    engine_world_event_len(*mut World) -> u32 => 0;
    engine_world_scratch(*mut World) -> *const f32 => null();
    engine_world_set_view(*mut World, *const f32, f32, f32) => ();
    engine_world_screen_ray(*mut World, f32, f32) -> i32 => 0;
    engine_world_screen_to_world(*mut World, f32, f32, f32, f32, f32, f32, f32, f32) -> i32 => 0;
    engine_world_to_screen(*mut World, f32, f32, f32) -> i32 => 0;
    engine_world_pick_screen(*mut World, f32, f32) -> u32 => u32::MAX;
    engine_world_play_clip(*mut World, u32, *const u8, usize, i32, f32, f32, f32) -> i32 => 0;
    engine_world_stop_clip(*mut World, u32, i32) -> i32 => 0;
    engine_world_skin_points(*mut World, u32, *const u32, usize, *mut f32, f32) -> i32 => 0;
    engine_worldgen_build(*const u8, usize, *const u8, usize, i32) -> u32 => 0;
    engine_worldgen_kept(*const u8, usize) -> i32 => 0;
    engine_worldgen_free(u32) => ();
    engine_worldgen_info(u32, *mut u8, usize) -> usize => 0;
    engine_worldgen_layer(u32, *const u8, usize, *mut f64, usize) -> usize => 0;
    engine_worldgen_reachable(u32, *mut f64, usize) -> usize => 0;
    engine_worldgen_overview(u32, *mut u8, usize) -> usize => 0;
    engine_worldgen_pick(u32, u32) -> i32 => 0;
    engine_worldgen_terrain(u32, u32) -> *mut EngineGeometry => unavailable();
    engine_worldgen_mesh(*const u8, usize) -> *mut EngineGeometry => unavailable();
    engine_worldgen_paint(*mut f32, usize, *const u8, usize) -> i32 => 0;
    engine_worldgen_ground(u32, f64, f64) -> f64 => f64::NAN;
    engine_worldgen_surface(u32, f64, f64) -> i32 => 0;
    engine_worldgen_platform(u32, f64, f64) -> i32 => -1;
    engine_worldgen_walkable(u32, f64, f64, f64) -> i32 => 0;
    engine_worldgen_clearance(u32, f64, f64, f64) -> f64 => f64::NEG_INFINITY;
    engine_worldgen_solid_clearance(u32, f64, f64, f64, f64, f64) -> f64 => f64::INFINITY;
    engine_worldgen_field_index(u32, *const u8, usize) -> i32 => -1;
    engine_worldgen_field(u32, u32, f64, f64) -> f64 => f64::NAN;
    engine_worldgen_tilt(u32, f64, f64, f64, *mut f64) => ();
    engine_worldgen_sight(u32, f64, f64, f64, f64, f64, f64, f64) -> i32 => 0;
    engine_worldgen_move(u32, *mut f64, f64, f64, f64, *const f64, usize) => ();
}

/// Copies the NUL-terminated error into a caller-owned buffer if it has sufficient capacity.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_worldgen_error(out: *mut u8, capacity: usize) -> usize {
    if !out.is_null() && capacity > DISABLED.len() {
        unsafe {
            std::ptr::copy_nonoverlapping(DISABLED.as_ptr(), out, DISABLED.len());
            *out.add(DISABLED.len()) = 0;
        }
    }
    DISABLED.len()
}

pub(super) fn disabled_asset() -> i32 {
    let _ = crate::assets::record_error::<()>(Err(DISABLED.into()));
    -1
}

disabled! {
    engine_model_load(*const u8, usize, i32, f32) -> i32 => disabled_asset();
    engine_model_vertices(u32) -> *const f32 => null();
    engine_model_vertex_count(u32) -> u32 => 0;
    engine_model_indices(u32) -> *const u32 => null();
    engine_model_index_count(u32) -> u32 => 0;
    engine_model_bake(u32, *const u8, usize, *mut f32) -> i32 => { disabled_asset(); 0 };
    engine_bake_kept(*const u8, usize) -> i32 => 0;
    engine_model_size(u32, *mut f32) -> i32 => 0;
    engine_model_texture(u32) -> i32 => -1;
    engine_mesh_alias(u32) -> i32 => disabled_asset();
    engine_mesh_create(*const f32, usize, *const u32, usize) -> i32 => disabled_asset();
    engine_path_extrude(*const f32, *const u32, usize, f32, i32) -> usize => 0;
    engine_path_extrude_copy(*mut f32, usize) -> usize => 0;
    engine_geometry_smooth_normals(*mut f32, usize, *const u32, usize) => ();
    engine_geometry_face_outward(*const f32, usize, *mut u32, usize) => ();
    engine_geometry_place(*const f32, usize, *const u32, usize, *const f32, u32, *mut f32, *mut u32) => ();
    engine_font_load(*const u8, usize, f32, *const u8, usize, f32) -> i32 => disabled_asset();
    engine_font_glyphs(u32) -> *const f32 => null();
    engine_font_glyph_floats(u32) -> u32 => 0;
    engine_font_cap_height(u32) -> f32 => 0.7;
    engine_model_rig(u32, *mut u8, usize) -> usize => 0;
    engine_render_mesh(u32, *const f32, usize, *const u32, usize, i32, f32) => ();
    engine_render_model(u32, i32, f32) -> i32 => 0;
    engine_render_frame(i32, *const f64, usize, *const f32, *const f32, *const f32, usize, *const u32, usize, usize, *mut f32, *const crate::World) -> i32 => { crate::render::set_error(DISABLED.into()); -1 };
    engine_render_overlay(i32, *const f32, *const f32, *const f32, usize, *const u32, usize, usize, f32, f32) => ();
    engine_render_backdrop(i32, *const f32, *const f32, *const f32, usize, *const u32, usize, usize) => ();
    engine_generate_builtin_meshes() => ();
    engine_render_mesh_vertex_count(u32) -> usize => 0;
    engine_render_mesh_index_count(u32) -> usize => 0;
    engine_render_mesh_vertices(u32, *mut f32, usize) -> usize => 0;
    engine_render_mesh_indices(u32, *mut u32, usize) -> usize => 0;
    engine_shape_prepare(*const f32, usize, *const u32, usize, *const u8, usize) -> i32 => disabled_asset();
    engine_solid_prepare(*const u8, usize, *const u8, usize) -> i32 => disabled_asset();
    engine_geometry_solid(*const u8, usize) -> *mut EngineGeometry => unavailable();
    engine_geometry_optimize(*const f32, usize, *const u32, usize, f32, f32, i32) -> *mut EngineGeometry => unavailable();
}

#[cfg(not(target_arch = "wasm32"))]
disabled! {
    engine_render_publish(i32, *const f64, usize, *const f32, *const f32, *const f32, usize, *const u32, usize, usize, *mut f32, *const crate::World) -> i32 => { crate::render::set_error(DISABLED.into()); -1 };
}

#[cfg(not(target_arch = "wasm32"))]
#[unsafe(no_mangle)]
pub unsafe extern "C" fn engine_render_stats(_: i32, out: *mut f64) {
    if !out.is_null() {
        // SAFETY: the ABI caller provides two writable doubles.
        unsafe {
            out.write(0.);
            out.add(1).write(0.);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn game_assets_and_frame_entry_points_report_the_missing_feature() {
        assert_eq!(engine_model_load(null(), 0, 0, 0.), -1);
        assert_eq!(crate::assets::last_error(), DISABLED);
        assert_eq!(engine_render_frame(0, null(), 0, null(), null(), null(), 0, null(), 0, 0, null_mut(), null()), -1);
        assert_eq!(crate::render::last_error(), DISABLED);
        let geometry = engine_geometry_solid(null(), 0);
        unsafe {
            assert_eq!(super::super::modelling::engine_geometry_size(geometry), 0);
            super::super::modelling::engine_geometry_free(geometry);
        }
    }
}
