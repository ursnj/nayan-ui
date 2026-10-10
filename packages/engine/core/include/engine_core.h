// C interface to the engine core. Keep in sync with src/ffi.rs.
#pragma once
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

// Rigid body + collider. kind: 0 = remove, 1 = dynamic, 2 = kinematic, 3 = fixed.
// shape: 0 = ball (size[0] = radius), 1 = box (size = half extents).
// A pair interacts if (a.mask & b.layer) || (b.mask & a.layer).
typedef struct EnginePhysicsDesc {
  uint32_t kind;
  uint32_t shape;
  float size[3];
  uint32_t layer;
  uint32_t mask;
  uint32_t sensor;
  float friction;
  float restitution;
  float density;
  float linear_damping;
  float angular_damping;
  float gravity_scale;
  uint32_t lock_rotations;
  uint32_t ccd;
} EnginePhysicsDesc;

// Capacity is fixed: every pointer below stays valid until engine_world_free.
World *engine_world_new(uint32_t capacity);
void engine_world_free(World *w);

// Returns the entity id, or ENGINE_NO_ENTITY if `w` is null, the world is full, or `mesh` >= ENGINE_MAX_MESHES.
uint32_t engine_world_spawn(World *w, uint32_t mesh, float x, float y, float z, float sx, float sy, float sz,
                            float r, float g, float b, float a);
// Returns 1 if the entity existed. Stale ids are ignored by every function below.
int32_t engine_world_despawn(World *w, uint32_t id);

void engine_world_set_position(World *w, uint32_t id, float x, float y, float z);
void engine_world_set_rotation(World *w, uint32_t id, float x, float y, float z, float rw);
void engine_world_set_scale(World *w, uint32_t id, float x, float y, float z);
void engine_world_set_color(World *w, uint32_t id, float r, float g, float b, float a);
void engine_world_set_velocity(World *w, uint32_t id, float x, float y, float z);
void engine_world_set_angular_velocity(World *w, uint32_t id, float x, float y, float z);
// Offsets position by amplitude * sin(phase); phase starts at `phase`, advances `frequency` rad/s.
void engine_world_set_oscillation(World *w, uint32_t id, float ax, float ay, float az, float frequency, float phase);
// Sets X/Z velocity, keeps Y (so steered dynamic bodies still fall).
void engine_world_set_planar_velocity(World *w, uint32_t id, float x, float z);
// Move toward `target` on the XZ plane at `speed` each step. speed <= 0 stops.
void engine_world_set_follow(World *w, uint32_t id, uint32_t target, float speed);
// Despawn automatically after `seconds` (shrinking over the last 0.2 s). <= 0 clears it.
void engine_world_set_lifetime(World *w, uint32_t id, float seconds);
// Moving non-dynamic entities are clamped to this XZ rectangle (dynamic bodies use walls).
void engine_world_set_bounds(World *w, float min_x, float min_z, float max_x, float max_z);

// Physics. set_physics returns 1 on success, 0 for a stale id or invalid description (never panics).
int32_t engine_world_set_physics(World *w, uint32_t id, const EnginePhysicsDesc *desc);
void engine_world_apply_impulse(World *w, uint32_t id, float x, float y, float z);
void engine_world_set_gravity(World *w, float x, float y, float z);
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

#ifdef __cplusplus
}
#endif
