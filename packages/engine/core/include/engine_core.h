// C interface to the engine core. Keep in sync with src/ffi.rs.
#pragma once
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct World World;

#define ENGINE_NO_ENTITY UINT32_MAX
#define ENGINE_MAX_MESHES 8
#define ENGINE_MAX_EVENT_PAIRS 4096

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
// Sphere collider. Pairs collide when overlapping and (a.mask & b.layer) || (b.mask & a.layer). radius <= 0 removes it.
void engine_world_set_collider(World *w, uint32_t id, float radius, uint32_t layer, uint32_t mask);
// Move toward `target` on the XZ plane at `speed` each update. speed <= 0 stops.
void engine_world_set_follow(World *w, uint32_t id, uint32_t target, float speed);
// Moving entities are clamped to this XZ rectangle.
void engine_world_set_bounds(World *w, float min_x, float min_z, float max_x, float max_z);

// Writes the entity position to engine_world_scratch()[0..3]. Returns 1 on success.
int32_t engine_world_read_position(World *w, uint32_t id);

void engine_world_update(World *w, float dt);
uint32_t engine_world_count(World *w);
uint32_t engine_world_capacity(World *w);

// Render output, valid after engine_world_update. Instances are grouped by mesh id.
const float *engine_world_matrices(World *w);  // capacity * 16 floats, column-major
const float *engine_world_colors(World *w);    // capacity * 4 floats (rgba)
const uint32_t *engine_world_ranges(World *w); // ENGINE_MAX_MESHES * 2 u32: [first, count] per mesh

// Collision pairs from the last update: [a0, b0, a1, b1, ...]; event_len counts u32 values.
const uint32_t *engine_world_events(World *w);
uint32_t engine_world_event_len(World *w);

const float *engine_world_scratch(World *w); // 16 floats

#ifdef __cplusplus
}
#endif
