// C interface to the engine core. Keep in sync with src/ffi/ and src/world/{desc,animation,particles}.rs.
#pragma once

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

// App utility policy/ownership. Free JSON results with engine_drawing_result_free.
char *engine_app_services_prepare(uint64_t owner, const uint8_t *json, size_t length);
char *engine_app_services_release(uint64_t owner);

// Asynchronous SQLite worker. Copies the command and invokes reply once on success.
uint8_t engine_sqlite_submit(uintptr_t owner, const uint8_t *data, size_t length, void *context, void (*reply)(void *, const uint8_t *, size_t));
void engine_sqlite_release(uintptr_t owner);
char *engine_location_position(const uint8_t *sample, size_t length);
char *engine_permission_result(const uint8_t *observation, size_t length);

// Rust-owned drawer state. All calls for an instance run on one UI thread.
typedef struct Drawer EngineDrawer;
EngineDrawer *engine_drawer_new(void);
void engine_drawer_free(EngineDrawer *drawer);
// Configure flags: enabled=1, swipe=2, right edge=4, reduced motion=8.
double engine_drawer_configure(EngineDrawer *, float width, float viewport, float edge, unsigned int flags);
// Actions: tick (x=dt), target (x=open), down, move, up, cancel, dismiss.
// Result = flags*2 + progress (0..1). Flags: moving=1, open target=2, dragging=4,
// pointer candidate=8, user requested target change=16. No per-frame allocation.
double engine_drawer_input(EngineDrawer *, int action, float x, float y, double time);

typedef struct World World;
typedef struct {
    int32_t enabled, status_light, navigation_light, status_hidden, navigation_hidden;
    int32_t window_style;
    uint32_t background_light, background_dark;
    int32_t remember_window;
} EngineSystemBars;
int32_t engine_system_bars_set(const uint8_t *id, size_t id_len, const uint8_t *config, size_t len, EngineSystemBars *out);
int32_t engine_system_bars_remove(const uint8_t *id, size_t len, EngineSystemBars *out);

// Stateless utilities: lowercase UUID v4, exactly 36 ASCII bytes (no NUL).
// out must be writable for len bytes. Returns 0 for null/undersized output, 1 on success.
uint8_t engine_uuid(uint8_t *out, size_t len);
// OAuth authorization and callback parsing. Free JSON results with engine_drawing_result_free.
char *engine_auth_request(const uint8_t *data, size_t len);
// Contact query policy. Free the JSON envelope with engine_drawing_result_free.
char *engine_contacts_page(const uint8_t *options, size_t options_len, const uint8_t *rows, size_t rows_len);
void engine_image_color_matrix(uint32_t preset, double brightness, double *out_rgb);

// Native application storage, independent of asset-cache clearing. Owned results must be freed.
// Each input pointer is readable for its stated length; result pointers remain valid until freed.
typedef struct EngineStorageResult EngineStorageResult;
EngineStorageResult *engine_storage_request(const uint8_t *command, size_t len);
EngineStorageResult *engine_storage_read(uint32_t handle, const uint8_t *key, size_t len);
EngineStorageResult *engine_storage_write(uint32_t handle, const uint8_t *key, size_t len, const uint8_t *value, size_t count);
const uint8_t *engine_storage_data(const EngineStorageResult *result);
size_t engine_storage_size(const EngineStorageResult *result);
const char *engine_storage_error(const EngineStorageResult *result);
void engine_storage_free(EngineStorageResult *result);

#define ENGINE_NO_ENTITY UINT32_MAX
#define ENGINE_MAX_MESHES 4096     // 0..15 built-in shapes (15 = not drawn), 16.. models, glyphs, aliases
#define ENGINE_MAX_EVENTS 4096
#define ENGINE_EVENT_STRIDE 4      // u32s per event: entity_a, entity_b, flags, impact speed (f32 bits)
#define ENGINE_EVENT_STARTED 1u    // flag: started touching (otherwise stopped)
#define ENGINE_EVENT_SENSOR 2u     // flag: a sensor was involved
#define ENGINE_FIXED_DT (1.0f / 60.0f)

// ── Entity descriptions ──────────────────────────────────────────────────
// Entities are created and changed with one call, from ENGINE_DESC_LEN doubles. Slot 0 holds
// flags saying which fields are present; the rest live at the offsets below.
#define ENGINE_DESC_LEN 64

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
#define ENGINE_DESC_ACCELERATION (1u << 14)
#define ENGINE_DESC_PICKABLE (1u << 15)
#define ENGINE_DESC_REGION (1u << 16)

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
// kind (0 remove, 1 dynamic, 2 kinematic, 3 fixed), shape (0 ball, 1 box, 2 from the mesh, 3 cylinder,
// 4 capsule, 5 cone), size x y z (ball: radius in x; box: half extents; cylinder/capsule/cone: radius in x,
// half the total height in y; <= 0 = sized from the entity's mesh and scale), layer, mask, sensor,
// friction, bounce, density, drag, angular drag, gravity scale, upright, ccd, planar (stays in its XY plane).
// Pairs interact if (a.mask & b.layer) || (b.mask & a.layer).
#define ENGINE_SLOT_PHYSICS 33
// enabled, sound (-1 = none), min speed, max speed, volume, haptic.
#define ENGINE_SLOT_IMPACT 50
#define ENGINE_SLOT_ACCELERATION 56 // x y z (entities without a dynamic body)
#define ENGINE_SLOT_PICKABLE 59     // 0 or 1
#define ENGINE_SLOT_REGION 60       // texture region u0 v0 u1 v1

// ── Animations and particle bursts ───────────────────────────────────────
// Animation: a header, then `entity count` entity ids, then `keyframe count` keyframes.
// Header: entity count, keyframe count (1..64), duration, delay, easing (0 linear, 1 in, 2 out, 3 in-out,
// 4 back, 5 bounce, 6 elastic), repeat (-1 = forever), yoyo, stagger (seconds per entity), smooth path,
// spring stiffness (0 = timed tween), spring damping, spring mass.
// Keyframe: flags (1 position, 2 rotation, 4 scale, 8 color, 16 move by, 32 turn, 64 shake, 128 has time),
// time 0..1, position xyz, rotation xyzw, scale xyz, color rgba, move by xyz, turn xyz (radians), shake.
// Each animated property is its own track: a new one replaces only the same property on the same entity.
#define ENGINE_ANIM_HEADER 12
#define ENGINE_ANIM_KEY_LEN 23
#define ENGINE_DONE_PER_ENTITY 5 // room in engine_world_done: capacity * 5 + 64 ids
// Burst: position xyz, direction xyz, spread (radians), count, mesh, size, speed, lifetime, gravity,
// color count (1..4), colors rgba x 4, end size (x start size), has end color (0 / 1), end color rgba.
#define ENGINE_BURST_LEN 36

// ── Worlds and entities ──────────────────────────────────────────────────
// Capacity is fixed: every pointer below stays valid until engine_world_free.
World *engine_world_new(uint32_t capacity);
void engine_world_free(World *w);

// Returns the entity id, or ENGINE_NO_ENTITY if the world is full or the description is rejected.
uint32_t engine_world_spawn_desc(World *w, const double *desc, size_t len);
// Returns 1 if everything was applied; 0 if the entity is gone or a field was rejected.
int32_t engine_world_set_desc(World *w, uint32_t id, const double *desc, size_t len);
// Draw-only transform batch: 16 doubles per record (id, flags, position xyz, rotation xyzw,
// scale xyz, color rgba). Flags match ENGINE_FLAG_POSITION/ROTATION/SCALE/COLOR. Returns applied count.
uint32_t engine_world_set_transforms(World *w, const double *data, size_t len, size_t count);
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
// Nearest pickable, visible entity along a ray (bounding boxes, as last drawn). Returns it or
// ENGINE_NO_ENTITY; on a hit scratch[0..4] = distance, point xyz.
uint32_t engine_world_pick(World *w, float ox, float oy, float oz, float dx, float dy, float dz);
// Write position / velocity to engine_world_scratch()[0..3]. Return 1 on success. Positions are simulated
// (relative to the parent), or with rendered != 0 where the entity was last drawn, in world space.
int32_t engine_world_read_position(World *w, uint32_t id, int32_t rendered);
int32_t engine_world_read_velocity(World *w, uint32_t id);

// Starts an animation (layout above). Returns its id (> 0), reported by engine_world_done when every
// track has ended (finished, replaced, stopped or despawned); 0 if nothing started.
uint32_t engine_world_animate(World *w, const double *anim, size_t len);
// Stops every animation on the entity where it is. Returns 1 if it had any.
int32_t engine_world_stop_animation(World *w, uint32_t id);
// Spawns particles (ENGINE_BURST_LEN doubles). Returns how many were spawned.
uint32_t engine_world_burst(World *w, const double *burst, size_t len);

// Runs whole ENGINE_FIXED_DT steps and interpolates the render output between the last two.
void engine_world_update(World *w, float dt);
// Timers on the world's clock (update dt): the id is reported in done (like an animation's) at the
// end of the update that reaches it. Returns the id, or 0.
uint32_t engine_world_after(World *w, float seconds);
// Drops every pending timer (they never fire). Returns how many were dropped.
uint32_t engine_world_cancel_timers(World *w);
// Score, lives and the game clock, advanced by engine_world_update. op: 0 add score, 1 set score,
// 2 add lives, 3 set lives, 4 start clock (a = countdown seconds or 0 to count up, b = points per
// second), 5 stop, 6 resume, 7 reset (a = lives), 8 add time (a = seconds), 9 time bonus (a = points per second saved, b = expected seconds
// for a clock counting up). Returns the score.
#define ENGINE_SCOREBOARD_LEN 8
double engine_world_scoreboard(World *w, uint32_t op, double a, double b);
// [score, lives, seconds, shown seconds, changed flags, running, points per second, best].
double *engine_world_scoreboard_state(World *w);
uint32_t engine_world_count(World *w);
uint32_t engine_world_capacity(World *w);

// Render output, valid after engine_world_update. Instances are grouped by mesh id.
const float *engine_world_matrices(World *w);  // capacity * 16 floats, column-major
const float *engine_world_colors(World *w);    // capacity * 4 floats (rgba)
const float *engine_world_regions(World *w);   // capacity * 4 floats (texture region u0 v0 u1 v1)
// ENGINE_MAX_MESHES * 4 u32: [first, count] per mesh for opaque instances, then for transparent ones.
const uint32_t *engine_world_ranges(World *w);
// Ids of animations that ended since the last update began (room for capacity * 5 + 64).
const uint32_t *engine_world_done(World *w);
uint32_t engine_world_done_len(World *w);

// Collision events from the last update, ENGINE_EVENT_STRIDE u32s each; event_len counts u32 values.
const uint32_t *engine_world_events(World *w);
uint32_t engine_world_event_len(World *w);

const float *engine_world_scratch(World *w); // 16 floats

// ── Camera math (per world, after setView) ────────────────────────────
// Stores the view-projection matrix (16 column-major floats) and view size in points.
void engine_world_set_view(World *w, const float *view_proj, float width, float height);
// World-space ray through a view point. Writes origin xyz + direction xyz into scratch[0..6]. 1 on success.
int32_t engine_world_screen_ray(World *w, float x, float y);
// Where a view point lands on a plane. Writes into scratch[0..3]. 1 on success.
int32_t engine_world_screen_to_world(World *w, float x, float y, float ppx, float ppy, float ppz, float pnx, float pny, float pnz);
// Where a world position appears on screen (points from top-left). Writes into scratch[0..2]. 1 on success.
int32_t engine_world_to_screen(World *w, float x, float y, float z);
// Nearest pickable entity under a screen point. Returns it or ENGINE_NO_ENTITY; scratch[0..4] on hit.
uint32_t engine_world_pick_screen(World *w, float x, float y);

// ── Meshes, models, textures, fonts (global) ─────────────────────────────
// glTF 2.0 (.glb, or .gltf with embedded data), merged into one mesh. Returns the mesh id, or -1.
/* Skeletal models: metadata JSON; named clips loop/seek/crossfade natively. */
size_t engine_model_rig(uint32_t mesh, uint8_t *out, size_t capacity);
int32_t engine_world_play_clip(World *w, uint32_t entity, const uint8_t *name, size_t name_len, int32_t looping, float speed, float fade, float time);
int32_t engine_world_stop_clip(World *w, uint32_t entity, int32_t reset);
/* Model-space vertex samples. out has count*3 floats; after previews the next update. */
int32_t engine_world_skin_points(World *w, uint32_t entity, const uint32_t *indices, size_t count, float *out, float after);
int32_t engine_model_load(const uint8_t *data, size_t len, int32_t center, float fit);
// Geometry of a registered mesh (model, glyph, or what an alias points to). Valid for the process.
const float *engine_model_vertices(uint32_t mesh);  // vertex_count * 11 floats: position, normal, color, uv
uint32_t engine_model_vertex_count(uint32_t mesh);
const uint32_t *engine_model_indices(uint32_t mesh);
uint32_t engine_model_index_count(uint32_t mesh);
int32_t engine_model_size(uint32_t mesh, float *out_xyz); // full bounding-box size; 1 if known
// Bakes a model into a new texture (BakeSpec JSON); out = [texture, center x, center y, extent]. 1, or 0 (engine_load_error).
int32_t engine_model_bake(uint32_t mesh, const uint8_t *spec, size_t len, float *out);
int32_t engine_bake_kept(const uint8_t *key, size_t len); // 1 if a picture is kept under the key
int32_t engine_model_texture(uint32_t mesh);              // base color texture id, or -1
// A new mesh id drawn with base's geometry (so it can have its own texture). Returns it, or -1.
int32_t engine_mesh_alias(uint32_t base);
// Registers geometry (copied): vertex_count * 11 floats (position, normal, color, uv) and u32 triangle
// indices. Colliders use a box around the origin holding every vertex. Returns the mesh id, or -1.
/* Persistent assets: app-private storage, no TTL/eviction. cache_read results own their bytes. */
typedef struct EngineCacheBlob EngineCacheBlob;
int32_t engine_cache_directory(const uint8_t *path, size_t length);
EngineCacheBlob *engine_cache_read(const uint8_t *key, size_t length);
const uint8_t *engine_cache_data(const EngineCacheBlob *blob);
size_t engine_cache_size(const EngineCacheBlob *blob);
void engine_cache_free(EngineCacheBlob *blob);
int32_t engine_cache_write(const uint8_t *key, size_t length, const uint8_t *bytes, size_t count);
int32_t engine_cache_remove(const uint8_t *key, size_t length);
int32_t engine_cache_clear(void);
int32_t engine_shape_prepare(const float *vertices, size_t floats, const uint32_t *indices, size_t count, const uint8_t *options, size_t length);
int32_t engine_solid_prepare(const uint8_t *recipe, size_t count, const uint8_t *options, size_t length);

int32_t engine_mesh_create(const float *vertices, size_t vertex_count, const uint32_t *indices, size_t index_count);
// Fills 2D contours (points = [x, y] pairs, counts[k] points per contour; y up) by the non-zero or
// even-odd rule and extrudes them depth deep (0 = front face only, facing +Z). Returns the number of
// floats made (11 per vertex, unindexed triangles), copied out by engine_path_extrude_copy.
size_t engine_path_extrude(const float *points, const uint32_t *counts, size_t contour_count, float depth, int32_t even_odd);
size_t engine_path_extrude_copy(float *out, size_t cap);
// Geometry passes, in place (11 floats per vertex). Smooth: normals from the triangles, averaged
// across vertices at the same place. Face outward: flips triangles whose winding disagrees with
// their normals.
void engine_geometry_smooth_normals(float *vertices, size_t vertex_count, const uint32_t *indices, size_t index_count);

// Intermediate modelling results own their memory and allocate no registered mesh IDs. Data is
// [vertex_count, index_count, 11 floats per vertex (as u32 bits), u32 indices], valid until free.
typedef struct EngineGeometry EngineGeometry;
EngineGeometry *engine_geometry_solid(const uint8_t *recipe, size_t len);
EngineGeometry *engine_geometry_optimize(const float *vertices, size_t floats, const uint32_t *indices, size_t count, float ratio, float error, int32_t lock_borders);
const uint32_t *engine_geometry_data(const EngineGeometry *result);
size_t engine_geometry_size(const EngineGeometry *result);
const char *engine_geometry_error(const EngineGeometry *result);
void engine_geometry_free(EngineGeometry *result);
void engine_geometry_face_outward(const float *vertices, size_t vertex_count, uint32_t *indices, size_t index_count);
// Bakes a part into merged buffers: placement = position xyz, rotation quat xyzw, scale xyz, color
// rgb (13 floats). Writes vertex_count vertices and index_count indices (plus first).
void engine_geometry_place(const float *vertices, size_t vertex_count, const uint32_t *indices, size_t index_count, const float *placement,
                           uint32_t first, float *out_vertices, uint32_t *out_indices);

// PNG or JPEG. Returns the texture id, or -1.
int32_t engine_texture_load(const uint8_t *data, size_t len);
int32_t engine_texture_load_sized(const uint8_t *data, size_t len, uint32_t width, uint32_t height, uint32_t fit);
const uint8_t *engine_texture_pixels(uint32_t id); // width * height RGBA8, top row first
int32_t engine_texture_size(uint32_t id, uint32_t *out_wh);

// TrueType / OpenType: one extruded mesh per character of `chars` (UTF-8), depth in ems. Returns the
// font id, or -1. `weight` picks a variable font's weight (0 = its default). Glyphs: [codepoint, mesh
// (-1 = nothing drawn), advance in ems] floats.
int32_t engine_font_load(const uint8_t *data, size_t len, float depth, const char *chars, size_t chars_len, float weight);
const float *engine_font_glyphs(uint32_t font);
uint32_t engine_font_glyph_floats(uint32_t font);
float engine_font_cap_height(uint32_t font);

// Why the last model / texture / font / alias load failed (NUL-terminated into out). Returns the full
// length (0 = no error).
size_t engine_load_error(char *out, size_t cap);

// ── Audio (global) ───────────────────────────────────────────────────────
// The output stream starts on first use. WAV (PCM int or float, mono/stereo).
int32_t engine_audio_load_wav(const uint8_t *data, size_t len); // sound id, or -1
uint64_t engine_audio_play(uint32_t sound, float volume, float pan, float pitch, int32_t looping); // voice id, 0 = none
void engine_audio_stop(uint64_t voice);
int32_t engine_audio_control(uint64_t voice, uint32_t action, double value, float pan);
void engine_audio_set_volume(float volume);
// Frees a sound's samples (a played recording); its id then plays nothing.
void engine_audio_release(uint32_t sound);
// A sound's length in seconds (0 if unknown or released).
float engine_audio_duration(uint32_t sound);
// Writes up to `capacity` loudness values (one per 1/per_second s) into `out`; returns how many the
// sound has (pass a null `out` to ask).
size_t engine_audio_levels(uint32_t sound, float per_second, float *out, size_t capacity);
// A new sound: `sound` `pitch` times higher and `tempo` times faster (0.25..4 each); `clean` turns
// rumble and the room between words down, `loudness` > 0 levels the speech to that RMS. Returns its
// id, or -1; free it with engine_audio_release.
int32_t engine_audio_shift(uint32_t sound, float pitch, float tempo, float loudness, int32_t clean);
/* System speech: reply bytes are borrowed for the callback; completion means queued, not spoken. */
void engine_speech_request(const uint8_t *data, size_t len, void (*done)(void *context, const uint8_t *data, size_t len), void *context);
void engine_speech_shutdown(void);

// Microphone. Permission: 1 granted, 0 not asked yet, -1 denied (iOS; 1 elsewhere, the host asks).
int32_t engine_audio_mic_permission(void);
// Asks for the microphone and calls done(context, granted) once, possibly on another thread.
void engine_audio_mic_request(void (*done)(void *context, int32_t granted), void *context);
// Starts listening, keeping the last `max_seconds` of input. 1 if it's opening.
int32_t engine_audio_mic_start(float max_seconds);
void engine_audio_mic_stop(void);
// 0 off, 1 opening, 2 listening, -1 failed (no device or permission).
int32_t engine_audio_mic_state(void);
// How loud the input is now: 0 (-60 dBFS or quieter) .. 1 (full scale).
float engine_audio_mic_level(void);
// Seconds of input held.
float engine_audio_mic_held(void);
// A sound of the `seconds` of input that ended `skip_end` seconds ago; forgets what was heard.
// Returns its sound id, or -1.
int32_t engine_audio_mic_take(float seconds, float skip_end);
// Browser input: `count` mono samples at `rate`.
void engine_audio_mic_push(const float *samples, size_t count, uint32_t rate);
void engine_audio_set_muted(int32_t muted);
int32_t engine_audio_is_running(void);

// ── Android ──────────────────────────────────────────────────────────────
#ifdef __ANDROID__
// Call once at startup with the JavaVM and a JNI *global* reference to a Context (the Application):
// audio and haptics need them. Repeat calls are ignored.
void engine_android_init(void *java_vm, void *context);
#endif

// ── Built-in mesh generation and readback (global) ───────────────────
// Generates and registers all built-in shape meshes (cube, sphere, etc.) with the renderer.
void engine_generate_builtin_meshes(void);
// Vertex / index count of a registered renderer mesh, or 0.
/* engine_render_frame's arguments, but the frame is copied and drawn on the render thread; returns at once with the
 * view-projection written. 1 once the surface has presented a frame, 0 before, -1 if the last frame failed. */
int32_t engine_render_publish(int32_t surface, const double *frame, size_t frame_len, const float *matrices, const float *colors,
                              const float *regions, size_t capacity, const uint32_t *ranges, size_t ranges_len, size_t count,
                              float *out_view_proj, const World *world);
/* [frames presented, smoothed render ms] for a surface drawn by the render thread. */
void engine_render_stats(int32_t surface, double *out);
/* A core model's geometry (mesh_create, glTF, glyphs) to the renderer, inside Rust; texture < 0 = none. 1, or 0 if unknown. */
int32_t engine_render_model(uint32_t mesh, int32_t texture, float shine);
size_t engine_render_mesh_vertex_count(uint32_t mesh);
size_t engine_render_mesh_index_count(uint32_t mesh);
// Copies geometry into caller-owned buffers. Returns the actual count.
size_t engine_render_mesh_vertices(uint32_t mesh, float *out, size_t cap);
size_t engine_render_mesh_indices(uint32_t mesh, uint32_t *out, size_t cap);

// ── Renderer (wgpu: Vulkan, else GLES 3.0, on Android; Metal on iOS) ───────
#define ENGINE_FRAME_LEN 26 // at least: the scene scale (26) and FXAA (27) are optional
// Geometry (copied) drawn for a mesh id: vertex_count * 11 floats, u32 indices; texture -1 = none.
void engine_render_mesh(uint32_t mesh, const float *vertices, size_t vertex_count, const uint32_t *indices, size_t index_count,
                        int32_t texture, float shine);
// Attaches (or resizes) surface `surface` drawing into `window` (ANativeWindow* on Android, CAMetalLayer*
// on iOS) at width x height pixels. `window` must stay valid until engine_render_detach returns.
// Returns 1, or 0 on failure (see engine_render_error).
int32_t engine_render_attach(int32_t surface, void *window, uint32_t width, uint32_t height);
// Builds the GPU device and pipelines on a background thread before any surface exists, so the first
// engine_render_attach doesn't (it waits for a warm-up in progress). Returns at once; repeat calls do nothing.
void engine_render_warm_up(void);
void engine_render_detach(int32_t surface);
// Draws a frame. `frame`: ENGINE_FRAME_LEN doubles (layout in native/games/rust/render/game_gpu.rs, Frame::from_slice).
// Instance buffers hold `capacity` instances (regions may be NULL); `ranges` as engine_world_ranges.
// Returns 1 (drawn; out_view_proj gets 16 floats), 0 (surface not ready / frame skipped), -1 (error).
int32_t engine_render_frame(int32_t surface, const double *frame, size_t frame_len, const float *matrices, const float *colors,
                            const float *regions, size_t capacity, const uint32_t *ranges, size_t ranges_len, size_t count,
                            float *out_view_proj, const World *world);
// The screen-space overlay drawn over `surface` from its next frame on (scoreboards, buttons), copied
// from a world's buffers (as engine_render_frame). In points: x right and y up from the view's top-left
// (on screen y <= 0), z toward the viewer within -100..100; `width` x `height` is the view in points.
// Unlit and always in front of the scene. count 0 (or NULL buffers) removes it.
void engine_render_overlay(int32_t surface, const float *matrices, const float *colors, const float *regions, size_t capacity,
                           const uint32_t *ranges, size_t ranges_len, size_t count, float width, float height);
// Static scenery behind the scene, cached in a texture (same buffers as engine_render_overlay; count 0 removes it).
void engine_render_backdrop(int32_t surface, const float *matrices, const float *colors, const float *regions, size_t capacity, const uint32_t *ranges, size_t ranges_len, size_t count);
size_t engine_render_error(char *out, size_t cap);
// "vulkan", "gl", "metal", or "" before the first attach.
size_t engine_render_backend(char *out, size_t cap);

// ── Haptics (global; Core Haptics on iOS, the Vibrator service on Android) ──
int32_t engine_haptics_supported(void);
// `count` taps as [time, intensity 0..1, sharpness 0..1] triples.
void engine_haptics_play(const float *taps, uint32_t count, int32_t throttle);

// In-place premultiplied RGBA blur for bounded, downsampled native UI backdrops. Returns 1 on success.
int32_t engine_blur_rgba(uint8_t *pixels, size_t length, uint32_t width, uint32_t height, uint32_t radius);

// Engine-owned art documents. Positions are view points; pressure is normalized 0..1.
/* Returns -2 when drawing is disabled, -1 on invalid dimensions, or a document handle. */
int32_t engine_drawing_create(float width, float height, float ratio);
/* UI documents use the same surface transport without allocating editable drawing state. */
int32_t engine_component_create(void);
void engine_drawing_destroy(int32_t document);
char *engine_icon_request(const uint8_t *bytes, size_t length, const uint8_t *command, size_t count);
char *engine_drawing_command(int32_t document, const uint8_t *json, size_t length);
// Safe-area geometry and edge policies. Free with engine_drawing_result_free.
char *engine_safe_area_request(const uint8_t *json, size_t length);
void engine_drawing_result_free(char *result);
// Returns null when unchanged. Free non-null events with engine_drawing_result_free.
char *engine_drawing_take_event(int32_t document);
void engine_drawing_touch(int32_t document, int32_t phase, float x, float y, float pressure);
void engine_drawing_transform(int32_t document, float dx, float dy, float scale);
void engine_drawing_invalidate(int32_t document);
int32_t engine_drawing_present(int32_t document, int32_t surface, float width, float height, uint32_t background_rgb);

// Data-driven procedural worlds (JSON recipes of field graphs, terrain, solids and generation steps).
// Handles are u32 (0 = failed; see engine_worldgen_error). Building is reentrant on any thread. With
// a non-empty key, a world saved under it from the same recipe is restored, and a new one is saved.
// Out-buffer functions return the full length and copy only when `capacity` is large enough.
uint32_t engine_worldgen_build(const uint8_t *recipe, size_t len, const uint8_t *key, size_t key_len, int32_t prepare_terrain);
size_t engine_worldgen_error(uint8_t *out, size_t capacity);
int32_t engine_worldgen_kept(const uint8_t *key, size_t len);
void engine_worldgen_free(uint32_t world);
size_t engine_worldgen_info(uint32_t world, uint8_t *out, size_t capacity);
size_t engine_worldgen_layer(uint32_t world, const uint8_t *name, size_t len, double *out, size_t capacity);
size_t engine_worldgen_reachable(uint32_t world, double *out, size_t capacity);
size_t engine_worldgen_overview(uint32_t world, uint8_t *out, size_t capacity);
int32_t engine_worldgen_pick(uint32_t world, uint32_t run);
EngineGeometry *engine_worldgen_terrain(uint32_t world, uint32_t material);
EngineGeometry *engine_worldgen_mesh(const uint8_t *recipe, size_t len);
int32_t engine_worldgen_paint(float *vertices, size_t vertex_count, const uint8_t *recipe, size_t len);
double engine_worldgen_ground(uint32_t world, double x, double z);
int32_t engine_worldgen_surface(uint32_t world, double x, double z);
int32_t engine_worldgen_platform(uint32_t world, double x, double z);
int32_t engine_worldgen_walkable(uint32_t world, double x, double z, double radius);
double engine_worldgen_clearance(uint32_t world, double x, double z, double radius);
double engine_worldgen_solid_clearance(uint32_t world, double x, double z, double radius, double bottom, double top);
int32_t engine_worldgen_field_index(uint32_t world, const uint8_t *name, size_t len);
double engine_worldgen_field(uint32_t world, uint32_t field, double x, double z);
void engine_worldgen_tilt(uint32_t world, double x, double z, double yaw, double *out);
int32_t engine_worldgen_sight(uint32_t world, double ax, double az, double bx, double bz, double radius, double step, double rise);
void engine_worldgen_move(uint32_t world, double *point, double dx, double dz, double radius, const double *bodies, size_t count);

#ifdef __cplusplus
}
#endif
