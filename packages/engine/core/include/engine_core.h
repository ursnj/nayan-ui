// C interface to the engine core. Keep in sync with src/ffi.rs.
#pragma once
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct World World;

// Capacity is fixed: the matrix buffer never moves until engine_world_free.
World *engine_world_new(uint32_t capacity);
void engine_world_free(World *w);

// Returns the entity id, or UINT32_MAX if `w` is null or the world is full.
uint32_t engine_world_spawn(World *w, float x, float y, float z, float sx, float sy, float sz);

void engine_world_set_position(World *w, uint32_t id, float x, float y, float z);
void engine_world_set_rotation(World *w, uint32_t id, float x, float y, float z, float rw);
void engine_world_set_scale(World *w, uint32_t id, float x, float y, float z);
void engine_world_set_angular_velocity(World *w, uint32_t id, float x, float y, float z);

// Offsets position by amplitude * sin(phase); phase starts at `phase`, advances `frequency` rad/s.
void engine_world_set_oscillation(World *w, uint32_t id, float ax, float ay, float az, float frequency, float phase);

void engine_world_update(World *w, float dt);
uint32_t engine_world_count(World *w);

// count * 16 column-major floats; valid until engine_world_free.
const float *engine_world_matrices(World *w);

#ifdef __cplusplus
}
#endif
