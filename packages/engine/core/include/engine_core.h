// C interface to the engine core. Keep in sync with src/ffi/ and src/world/desc.rs.
#pragma once
#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct World World;

#define ENGINE_NO_ENTITY UINT32_MAX
#define ENGINE_MAX_MESHES 8
#define ENGINE_MAX_EVENTS 4096
#define ENGINE_EVENT_STRIDE 4      // u32s per event: entity_a, entity_b, flags, impact speed (f32 bits)
#define ENGINE_EVENT_STARTED 1u    // flag: started touching (otherwise stopped)
#define ENGINE_EVENT_SENSOR 2u     // flag: a sensor was involved
#define ENGINE_FIXED_DT (1.0f / 60.0f)

// ── Entity descriptions ──────────────────────────────────────────────────
// Entities are created and changed with one call, from ENGINE_DESC_LEN doubles. Slot 0 holds
// flags saying which fields are present; the rest live at the offsets below.
#define ENGINE_DESC_LEN 55

#define ENGINE_DESC_MESH (1u << 0)
#define ENGINE_DESC_POSITION (1u << 1)
#define ENGINE_DESC_ROTATION (1u << 2)
#define ENGINE_DESC_SCALE (1u << 3)
#define ENGINE_DESC_COLOR (1u << 4)
#define ENGINE_DESC_VELOCITY (1u << 5)
#define ENGINE_DESC_GROUND_VELOCITY (1u << 6)
#define ENGINE_DESC_SPIN (1u << 7)
#define ENGINE_DESC_BOB (1u << 8)
#define ENGINE_DESC_FOLLOW (1u << 9)
#define ENGINE_DESC_LIFETIME (1u << 10)
#define ENGINE_DESC_PARENT (1u << 11)
#define ENGINE_DESC_PHYSICS (1u << 12)
#define ENGINE_DESC_IMPACT (1u << 13)

#define ENGINE_SLOT_FLAGS 0
#define ENGINE_SLOT_MESH 1             // mesh id
#define ENGINE_SLOT_POSITION 2         // x y z
#define ENGINE_SLOT_ROTATION 5         // quaternion x y z w
#define ENGINE_SLOT_SCALE 9            // x y z
#define ENGINE_SLOT_COLOR 12           // r g b a
#define ENGINE_SLOT_VELOCITY 16        // x y z
#define ENGINE_SLOT_GROUND_VELOCITY 19 // x z (keeps vertical speed)
#define ENGINE_SLOT_SPIN 21            // x y z, radians/second
#define ENGINE_SLOT_BOB 24             // amplitude x y z, speed, phase
#define ENGINE_SLOT_FOLLOW 29          // target (-1 = stop), speed
#define ENGINE_SLOT_LIFETIME 31        // seconds (<= 0 clears)
#define ENGINE_SLOT_PARENT 32          // entity (-1 = detach)
// kind (0 remove, 1 dynamic, 2 kinematic, 3 fixed), shape (0 ball, 1 box, 2 from the mesh), size x y z
// (radius in x for a ball, half extents for a box; <= 0 = sized from the entity's scale), layer, mask,
// sensor, friction, bounce, density, drag, angular drag, gravity scale, upright, ccd.
// Pairs interact if (a.mask & b.layer) || (b.mask & a.layer).
#define ENGINE_SLOT_PHYSICS 33
// enabled, sound (-1 = none), min speed, max speed, volume, haptic.
#define ENGINE_SLOT_IMPACT 49

// ── Worlds and entities ──────────────────────────────────────────────────
// Capacity is fixed: every pointer below stays valid until engine_world_free.
World *engine_world_new(uint32_t capacity);
void engine_world_free(World *w);

// Returns the entity id, or ENGINE_NO_ENTITY if the world is full or the description is rejected.
uint32_t engine_world_spawn_desc(World *w, const double *desc, size_t len);
// Returns 1 if everything was applied; 0 if the entity is gone or a field was rejected.
int32_t engine_world_set_desc(World *w, uint32_t id, const double *desc, size_t len);
// Returns 1 if the entity existed. Stale ids are ignored everywhere.
int32_t engine_world_despawn(World *w, uint32_t id);

// Instant change in momentum (dynamic bodies only).
void engine_world_apply_impulse(World *w, uint32_t id, float x, float y, float z);
void engine_world_set_gravity(World *w, float x, float y, float z);
// Moving non-dynamic entities are clamped to this XZ rectangle (dynamic bodies use walls).
void engine_world_set_bounds(World *w, float min_x, float min_z, float max_x, float max_z);
// Entity used to pan/attenuate impact sounds; ENGINE_NO_ENTITY clears it.
void engine_world_set_listener(World *w, uint32_t id);

// Hits non-sensor colliders whose layer & mask != 0. Returns the entity or ENGINE_NO_ENTITY;
// on a hit scratch[0..7] = distance, normal xyz, point xyz.
uint32_t engine_world_raycast(World *w, float ox, float oy, float oz, float dx, float dy, float dz,
                              float max_distance, uint32_t mask);
// Write position / velocity to engine_world_scratch()[0..3]. Return 1 on success.
int32_t engine_world_read_position(World *w, uint32_t id);
int32_t engine_world_read_velocity(World *w, uint32_t id);

// Runs whole ENGINE_FIXED_DT steps and interpolates the render output between the last two.
void engine_world_update(World *w, float dt);
uint32_t engine_world_count(World *w);
uint32_t engine_world_capacity(World *w);

// Render output, valid after engine_world_update. Instances are grouped by mesh id.
const float *engine_world_matrices(World *w);  // capacity * 16 floats, column-major
const float *engine_world_colors(World *w);    // capacity * 4 floats (rgba)
const uint32_t *engine_world_ranges(World *w); // ENGINE_MAX_MESHES * 2 u32: [first, count] per mesh

// Collision events from the last update, ENGINE_EVENT_STRIDE u32s each; event_len counts u32 values.
const uint32_t *engine_world_events(World *w);
uint32_t engine_world_event_len(World *w);

const float *engine_world_scratch(World *w); // 16 floats

// ── Audio (global) ───────────────────────────────────────────────────────
// The output stream starts on first use. WAV (PCM int or float, mono/stereo).
int32_t engine_audio_load_wav(const uint8_t *data, size_t len); // sound id, or -1
uint64_t engine_audio_play(uint32_t sound, float volume, float pan, float pitch, int32_t looping); // voice id, 0 = none
void engine_audio_stop(uint64_t voice);
void engine_audio_set_volume(float volume);
void engine_audio_set_muted(int32_t muted);
int32_t engine_audio_is_running(void);

// ── Haptics (global; Core Haptics on iOS, no-op elsewhere for now) ───────
int32_t engine_haptics_supported(void);
// `count` taps as [time, intensity 0..1, sharpness 0..1] triples.
void engine_haptics_play(const float *taps, uint32_t count, int32_t throttle);

#ifdef __cplusplus
}
#endif
