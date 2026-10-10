#include "NayanEngineModule.h"

#include <engine_core.h>

#include <algorithm>
#include <vector>

namespace facebook::react {

namespace {

// Exposes Rust-owned memory to JS as an ArrayBuffer without copying.
// Valid until the world is destroyed (capacity is fixed, so it never moves).
class ExternalBuffer : public jsi::MutableBuffer {
 public:
  ExternalBuffer(uint8_t *data, size_t size) : data_(data), size_(size) {}
  size_t size() const override { return size_; }
  uint8_t *data() override { return data_; }

 private:
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

} // namespace

NayanEngineModule::NayanEngineModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeNayanEngineCxxSpec(std::move(jsInvoker)) {}

NayanEngineModule::~NayanEngineModule() {
  for (auto &entry : worlds_) {
    engine_world_free(entry.second);
  }
}

::World *NayanEngineModule::find(double worldId) const {
  auto it = worlds_.find(static_cast<int>(worldId));
  return it == worlds_.end() ? nullptr : it->second;
}

jsi::Object NayanEngineModule::external(jsi::Runtime &rt, const void *data, size_t bytes) const {
  if (data == nullptr) {
    throw jsi::JSError(rt, "NayanEngine: unknown world");
  }
  jsi::ArrayBuffer buffer(
      rt, std::make_shared<ExternalBuffer>(reinterpret_cast<uint8_t *>(const_cast<void *>(data)), bytes));
  return jsi::Object(std::move(buffer));
}

double NayanEngineModule::createWorld(jsi::Runtime &, double capacity) {
  int worldId = next_++;
  // NaN / negative -> 0; the core clamps very large values.
  uint32_t n = capacity >= 1 ? static_cast<uint32_t>(std::min(capacity, 1048576.0)) : 0;
  worlds_[worldId] = engine_world_new(n);
  return worldId;
}

void NayanEngineModule::destroyWorld(jsi::Runtime &, double world) {
  auto it = worlds_.find(static_cast<int>(world));
  if (it != worlds_.end()) {
    engine_world_free(it->second);
    worlds_.erase(it);
  }
}

namespace {

// An encoded entity description: a Float64Array's ArrayBuffer of ENGINE_DESC_LEN doubles.
const double *descData(jsi::Runtime &rt, jsi::Object &desc, size_t &len) {
  if (!desc.isArrayBuffer(rt)) {
    throw jsi::JSError(rt, "NayanEngine: expected an ArrayBuffer description");
  }
  jsi::ArrayBuffer buffer = desc.getArrayBuffer(rt);
  len = buffer.size(rt) / sizeof(double);
  return reinterpret_cast<const double *>(buffer.data(rt));
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

bool NayanEngineModule::readPosition(jsi::Runtime &, double world, double entity) {
  return engine_world_read_position(find(world), id(entity)) != 0;
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
  ::World *w = find(world);
  return external(rt, engine_world_matrices(w), static_cast<size_t>(engine_world_capacity(w)) * 16 * sizeof(float));
}

jsi::Object NayanEngineModule::getColors(jsi::Runtime &rt, double world) {
  ::World *w = find(world);
  return external(rt, engine_world_colors(w), static_cast<size_t>(engine_world_capacity(w)) * 4 * sizeof(float));
}

jsi::Object NayanEngineModule::getRanges(jsi::Runtime &rt, double world) {
  return external(rt, engine_world_ranges(find(world)), ENGINE_MAX_MESHES * 2 * sizeof(uint32_t));
}

jsi::Object NayanEngineModule::getEvents(jsi::Runtime &rt, double world) {
  return external(rt, engine_world_events(find(world)), ENGINE_MAX_EVENTS * ENGINE_EVENT_STRIDE * sizeof(uint32_t));
}

double NayanEngineModule::eventLength(jsi::Runtime &, double world) {
  return engine_world_event_len(find(world));
}

jsi::Object NayanEngineModule::getScratch(jsi::Runtime &rt, double world) {
  return external(rt, engine_world_scratch(find(world)), 16 * sizeof(float));
}

void NayanEngineModule::setListener(jsi::Runtime &, double world, double entity) {
  engine_world_set_listener(find(world), id(entity));
}

double NayanEngineModule::audioLoad(jsi::Runtime &rt, jsi::Object data) {
  if (!data.isArrayBuffer(rt)) {
    throw jsi::JSError(rt, "NayanEngine.audioLoad: expected an ArrayBuffer");
  }
  jsi::ArrayBuffer buffer = data.getArrayBuffer(rt);
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
