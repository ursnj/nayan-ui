#include "NayanEngineModule.h"

#include <engine_core.h>

#include <algorithm>

#ifdef __ANDROID__
#include <fbjni/fbjni.h>
#include <jni.h>
#endif
#include <string>
#include <vector>

namespace facebook::react {

namespace {

// Exposes Rust-owned memory to JS as an ArrayBuffer without copying (capacity is fixed, so it never
// moves). Holds a reference to the owning world, so a buffer JS keeps after destroyWorld stays valid.
class ExternalBuffer : public jsi::MutableBuffer {
 public:
  ExternalBuffer(std::shared_ptr<void> owner, uint8_t *data, size_t size)
      : owner_(std::move(owner)), data_(data), size_(size) {}
  size_t size() const override { return size_; }
  uint8_t *data() override { return data_; }

 private:
  std::shared_ptr<void> owner_;
  uint8_t *data_;
  size_t size_;
};

// JS numbers -> entity ids. Negative or out-of-range values (e.g. -1 for "none") map to NO_ENTITY.
uint32_t id(double v) {
  return (v >= 0 && v <= static_cast<double>(UINT32_MAX)) ? static_cast<uint32_t>(v) : ENGINE_NO_ENTITY;
}

// JS numbers -> layer/mask bit sets (layers are 32 bits; -1 or 0xffffffff means "all").
uint32_t bits(double v) {
  if (!(v >= -2147483648.0 && v <= 4294967295.0)) {
    return 0; // NaN or out of range (the cast below would be undefined)
  }
  return static_cast<uint32_t>(static_cast<int64_t>(v) & 0xffffffff);
}

#ifdef __ANDROID__
// Gives the core the JavaVM and the Application context, which audio (cpal's AAudio backend) and
// haptics (the Vibrator service) need. Runs once; any failure leaves audio and haptics silent.
void initAndroid() {
  static bool done = false;
  if (done) {
    return;
  }
  done = true;
  try {
    JNIEnv *env = facebook::jni::Environment::current();
    JavaVM *vm = nullptr;
    if (env == nullptr || env->GetJavaVM(&vm) != JNI_OK || vm == nullptr) {
      return;
    }
    jclass activityThread = env->FindClass("android/app/ActivityThread");
    jmethodID currentApplication = activityThread == nullptr
        ? nullptr
        : env->GetStaticMethodID(activityThread, "currentApplication", "()Landroid/app/Application;");
    jobject app = currentApplication == nullptr ? nullptr : env->CallStaticObjectMethod(activityThread, currentApplication);
    if (env->ExceptionCheck()) {
      env->ExceptionClear();
    }
    if (app != nullptr) {
      engine_android_init(vm, env->NewGlobalRef(app)); // global ref: lives for the whole process
      env->DeleteLocalRef(app);
    }
    if (activityThread != nullptr) {
      env->DeleteLocalRef(activityThread);
    }
  } catch (...) {
    // No JNI environment on this thread: audio and haptics stay off rather than crash.
  }
}
#endif

} // namespace

NayanEngineModule::NayanEngineModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeNayanEngineCxxSpec(std::move(jsInvoker)) {
#ifdef __ANDROID__
  initAndroid();
#endif
}

// Worlds are freed when the module and every buffer aliasing them are gone.
NayanEngineModule::~NayanEngineModule() = default;

std::shared_ptr<::World> NayanEngineModule::owner(double worldId) const {
  // NaN, fractional and out-of-range ids are unknown (casting them to int is undefined or aliases another id).
  if (!(worldId >= 1 && worldId < next_) || worldId != static_cast<int>(worldId)) {
    return nullptr;
  }
  auto it = worlds_.find(static_cast<int>(worldId));
  return it == worlds_.end() ? nullptr : it->second;
}

::World *NayanEngineModule::find(double worldId) const {
  return owner(worldId).get(); // the map still holds it
}

jsi::Object NayanEngineModule::external(
    jsi::Runtime &rt, std::shared_ptr<void> owner, const void *data, size_t bytes) const {
  if (data == nullptr) {
    throw jsi::JSError(rt, "NayanEngine: unknown world, mesh or texture");
  }
  jsi::ArrayBuffer buffer(
      rt,
      std::make_shared<ExternalBuffer>(
          std::move(owner), reinterpret_cast<uint8_t *>(const_cast<void *>(data)), bytes));
  return jsi::Object(std::move(buffer));
}

double NayanEngineModule::createWorld(jsi::Runtime &, double capacity) {
  int worldId = next_++;
  // NaN / negative -> 0; the core clamps very large values.
  uint32_t n = capacity >= 1 ? static_cast<uint32_t>(std::min(capacity, 1048576.0)) : 0;
  worlds_[worldId] = std::shared_ptr<::World>(engine_world_new(n), engine_world_free);
  return worldId;
}

void NayanEngineModule::destroyWorld(jsi::Runtime &, double world) {
  if (owner(world) != nullptr) {
    worlds_.erase(static_cast<int>(world));
  }
}

namespace {

// An encoded description (entity, animation, burst): a Float64Array's ArrayBuffer of doubles.
const double *descData(jsi::Runtime &rt, jsi::Object &desc, size_t &len) {
  if (!desc.isArrayBuffer(rt)) {
    throw jsi::JSError(rt, "NayanEngine: expected an ArrayBuffer description");
  }
  jsi::ArrayBuffer buffer = desc.getArrayBuffer(rt);
  len = buffer.size(rt) / sizeof(double);
  return reinterpret_cast<const double *>(buffer.data(rt));
}

// Bytes of a file passed from JS (copied by the core).
jsi::ArrayBuffer fileData(jsi::Runtime &rt, jsi::Object &data, const char *method) {
  if (!data.isArrayBuffer(rt)) {
    throw jsi::JSError(rt, std::string("NayanEngine.") + method + ": expected an ArrayBuffer");
  }
  return data.getArrayBuffer(rt);
}

} // namespace

double NayanEngineModule::spawnDesc(jsi::Runtime &rt, double world, jsi::Object desc) {
  size_t len = 0;
  const double *data = descData(rt, desc, len);
  uint32_t entity = engine_world_spawn_desc(find(world), data, len);
  return entity == ENGINE_NO_ENTITY ? -1 : static_cast<double>(entity);
}

bool NayanEngineModule::setDesc(jsi::Runtime &rt, double world, double entity, jsi::Object desc) {
  size_t len = 0;
  const double *data = descData(rt, desc, len);
  return engine_world_set_desc(find(world), id(entity), data, len) != 0;
}

bool NayanEngineModule::despawn(jsi::Runtime &, double world, double entity) {
  return engine_world_despawn(find(world), id(entity)) != 0;
}

void NayanEngineModule::impulse(jsi::Runtime &, double world, double entity, double x, double y, double z) {
  engine_world_apply_impulse(find(world), id(entity), x, y, z);
}

void NayanEngineModule::setGravity(jsi::Runtime &, double world, double x, double y, double z) {
  engine_world_set_gravity(find(world), x, y, z);
}

void NayanEngineModule::setBounds(
    jsi::Runtime &, double world, double minX, double minZ, double maxX, double maxZ) {
  engine_world_set_bounds(find(world), minX, minZ, maxX, maxZ);
}

double NayanEngineModule::raycast(
    jsi::Runtime &, double world, double ox, double oy, double oz, double dx, double dy, double dz,
    double maxDistance, double mask) {
  uint32_t hit = engine_world_raycast(find(world), ox, oy, oz, dx, dy, dz, maxDistance, bits(mask));
  return hit == ENGINE_NO_ENTITY ? -1 : static_cast<double>(hit);
}

double NayanEngineModule::pick(jsi::Runtime &, double world, double ox, double oy, double oz, double dx, double dy, double dz) {
  uint32_t hit = engine_world_pick(find(world), ox, oy, oz, dx, dy, dz);
  return hit == ENGINE_NO_ENTITY ? -1 : static_cast<double>(hit);
}

bool NayanEngineModule::readPosition(jsi::Runtime &, double world, double entity, bool rendered) {
  return engine_world_read_position(find(world), id(entity), rendered ? 1 : 0) != 0;
}

double NayanEngineModule::animate(jsi::Runtime &rt, double world, jsi::Object animation) {
  size_t len = 0;
  const double *data = descData(rt, animation, len);
  return engine_world_animate(find(world), data, len);
}

bool NayanEngineModule::stopAnimation(jsi::Runtime &, double world, double entity) {
  return engine_world_stop_animation(find(world), id(entity)) != 0;
}

double NayanEngineModule::burst(jsi::Runtime &rt, double world, jsi::Object burst) {
  size_t len = 0;
  const double *data = descData(rt, burst, len);
  return engine_world_burst(find(world), data, len);
}

bool NayanEngineModule::readVelocity(jsi::Runtime &, double world, double entity) {
  return engine_world_read_velocity(find(world), id(entity)) != 0;
}

void NayanEngineModule::update(jsi::Runtime &, double world, double dt) {
  engine_world_update(find(world), static_cast<float>(dt));
}

double NayanEngineModule::count(jsi::Runtime &, double world) {
  return engine_world_count(find(world));
}

jsi::Object NayanEngineModule::getMatrices(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_matrices(w.get()), static_cast<size_t>(engine_world_capacity(w.get())) * 16 * sizeof(float));
}

jsi::Object NayanEngineModule::getColors(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_colors(w.get()), static_cast<size_t>(engine_world_capacity(w.get())) * 4 * sizeof(float));
}

jsi::Object NayanEngineModule::getRegions(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_regions(w.get()), static_cast<size_t>(engine_world_capacity(w.get())) * 4 * sizeof(float));
}

jsi::Object NayanEngineModule::getRanges(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_ranges(w.get()), ENGINE_MAX_MESHES * 4 * sizeof(uint32_t));
}

jsi::Object NayanEngineModule::getDone(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  size_t room = static_cast<size_t>(engine_world_capacity(w.get())) * ENGINE_DONE_PER_ENTITY + 64;
  return external(rt, w, engine_world_done(w.get()), room * sizeof(uint32_t));
}

double NayanEngineModule::doneLength(jsi::Runtime &, double world) {
  return engine_world_done_len(find(world));
}

jsi::Object NayanEngineModule::getEvents(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_events(w.get()), ENGINE_MAX_EVENTS * ENGINE_EVENT_STRIDE * sizeof(uint32_t));
}

double NayanEngineModule::eventLength(jsi::Runtime &, double world) {
  return engine_world_event_len(find(world));
}

jsi::Object NayanEngineModule::getScratch(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_scratch(w.get()), 16 * sizeof(float));
}

void NayanEngineModule::setListener(jsi::Runtime &, double world, double entity) {
  engine_world_set_listener(find(world), id(entity));
}

double NayanEngineModule::modelLoad(jsi::Runtime &rt, jsi::Object data, bool center, double fit) {
  jsi::ArrayBuffer buffer = fileData(rt, data, "modelLoad");
  return engine_model_load(buffer.data(rt), buffer.size(rt), center ? 1 : 0, static_cast<float>(fit)); // copied
}

jsi::Object NayanEngineModule::modelVertices(jsi::Runtime &rt, double mesh) {
  uint32_t m = id(mesh);
  return external(rt, nullptr, engine_model_vertices(m), static_cast<size_t>(engine_model_vertex_count(m)) * 11 * sizeof(float));
}

jsi::Object NayanEngineModule::modelIndices(jsi::Runtime &rt, double mesh) {
  uint32_t m = id(mesh);
  return external(rt, nullptr, engine_model_indices(m), static_cast<size_t>(engine_model_index_count(m)) * sizeof(uint32_t));
}

jsi::Array NayanEngineModule::modelSize(jsi::Runtime &rt, double mesh) {
  float size[3] = {0, 0, 0};
  engine_model_size(id(mesh), size);
  return jsi::Array::createWithElements(rt, size[0], size[1], size[2]);
}

double NayanEngineModule::modelTexture(jsi::Runtime &, double mesh) {
  return engine_model_texture(id(mesh));
}

double NayanEngineModule::meshAlias(jsi::Runtime &, double base) {
  return engine_mesh_alias(id(base));
}

double NayanEngineModule::textureLoad(jsi::Runtime &rt, jsi::Object data) {
  jsi::ArrayBuffer buffer = fileData(rt, data, "textureLoad");
  return engine_texture_load(buffer.data(rt), buffer.size(rt)); // decoded and copied
}

jsi::Object NayanEngineModule::texturePixels(jsi::Runtime &rt, double texture) {
  uint32_t size[2] = {0, 0};
  engine_texture_size(id(texture), size);
  return external(rt, nullptr, engine_texture_pixels(id(texture)), static_cast<size_t>(size[0]) * size[1] * 4);
}

jsi::Array NayanEngineModule::textureSize(jsi::Runtime &rt, double texture) {
  uint32_t size[2] = {0, 0};
  engine_texture_size(id(texture), size);
  return jsi::Array::createWithElements(rt, static_cast<double>(size[0]), static_cast<double>(size[1]));
}

double NayanEngineModule::fontLoad(jsi::Runtime &rt, jsi::Object data, double depth, jsi::String chars) {
  jsi::ArrayBuffer buffer = fileData(rt, data, "fontLoad");
  std::string utf8 = chars.utf8(rt);
  return engine_font_load(buffer.data(rt), buffer.size(rt), static_cast<float>(depth), utf8.data(), utf8.size());
}

jsi::Array NayanEngineModule::fontGlyphs(jsi::Runtime &rt, double font) {
  uint32_t f = id(font);
  const float *glyphs = engine_font_glyphs(f);
  size_t n = glyphs == nullptr ? 0 : engine_font_glyph_floats(f);
  jsi::Array out(rt, n + 1);
  for (size_t i = 0; i < n; i++) {
    out.setValueAtIndex(rt, i, static_cast<double>(glyphs[i]));
  }
  out.setValueAtIndex(rt, n, static_cast<double>(engine_font_cap_height(f)));
  return out;
}

jsi::String NayanEngineModule::loadError(jsi::Runtime &rt) {
  // Sized to the full message: truncating could split a UTF-8 sequence.
  std::string message(engine_load_error(nullptr, 0) + 1, '\0');
  message.resize(engine_load_error(message.data(), message.size()));
  return jsi::String::createFromUtf8(rt, message);
}

double NayanEngineModule::audioLoad(jsi::Runtime &rt, jsi::Object data) {
  jsi::ArrayBuffer buffer = fileData(rt, data, "audioLoad");
  return engine_audio_load_wav(buffer.data(rt), buffer.size(rt)); // copied by the core
}

double NayanEngineModule::audioPlay(jsi::Runtime &, double sound, double volume, double pan, double pitch, bool loop) {
  return static_cast<double>(engine_audio_play(id(sound), volume, pan, pitch, loop ? 1 : 0));
}

void NayanEngineModule::audioStop(jsi::Runtime &, double voice) {
  if (voice >= 1 && voice <= 9007199254740992.0) {
    engine_audio_stop(static_cast<uint64_t>(voice));
  }
}

void NayanEngineModule::audioSetVolume(jsi::Runtime &, double volume) {
  engine_audio_set_volume(volume);
}

void NayanEngineModule::audioSetMuted(jsi::Runtime &, bool muted) {
  engine_audio_set_muted(muted ? 1 : 0);
}

bool NayanEngineModule::audioIsRunning(jsi::Runtime &) {
  return engine_audio_is_running() != 0;
}

bool NayanEngineModule::hapticsSupported(jsi::Runtime &) {
  return engine_haptics_supported() != 0;
}

void NayanEngineModule::hapticsPlay(jsi::Runtime &rt, jsi::Array taps, bool throttle) {
  size_t n = taps.size(rt) / 3 * 3;
  std::vector<float> values(n);
  for (size_t i = 0; i < n; i++) {
    jsi::Value v = taps.getValueAtIndex(rt, i);
    values[i] = v.isNumber() ? static_cast<float>(v.asNumber()) : 0.0f;
  }
  engine_haptics_play(values.data(), static_cast<uint32_t>(n / 3), throttle ? 1 : 0);
}

} // namespace facebook::react
