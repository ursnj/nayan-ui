#include "NayanEngineModule.h"

#include <engine_core.h>

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

} // namespace

NayanEngineModule::NayanEngineModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeNayanEngineCxxSpec(std::move(jsInvoker)) {}

NayanEngineModule::~NayanEngineModule() {
  for (auto &entry : worlds_) {
    engine_world_free(entry.second);
  }
}

::World *NayanEngineModule::find(double id) const {
  auto it = worlds_.find(static_cast<int>(id));
  return it == worlds_.end() ? nullptr : it->second;
}

double NayanEngineModule::createWorld(jsi::Runtime &, double capacity) {
  int id = next_++;
  worlds_[id] = engine_world_new(static_cast<uint32_t>(capacity));
  return id;
}

void NayanEngineModule::destroyWorld(jsi::Runtime &, double world) {
  auto it = worlds_.find(static_cast<int>(world));
  if (it != worlds_.end()) {
    engine_world_free(it->second);
    worlds_.erase(it);
  }
}

double NayanEngineModule::spawn(
    jsi::Runtime &, double world, double x, double y, double z, double sx, double sy, double sz) {
  uint32_t id = engine_world_spawn(find(world), x, y, z, sx, sy, sz);
  return id == UINT32_MAX ? -1 : static_cast<double>(id);
}

void NayanEngineModule::setAngularVelocity(jsi::Runtime &, double world, double entity, double x, double y, double z) {
  engine_world_set_angular_velocity(find(world), static_cast<uint32_t>(entity), x, y, z);
}

void NayanEngineModule::setRotation(
    jsi::Runtime &, double world, double entity, double x, double y, double z, double w) {
  engine_world_set_rotation(find(world), static_cast<uint32_t>(entity), x, y, z, w);
}

void NayanEngineModule::setOscillation(
    jsi::Runtime &, double world, double entity, double ax, double ay, double az, double frequency, double phase) {
  engine_world_set_oscillation(find(world), static_cast<uint32_t>(entity), ax, ay, az, frequency, phase);
}

void NayanEngineModule::update(jsi::Runtime &, double world, double dt) {
  engine_world_update(find(world), static_cast<float>(dt));
}

double NayanEngineModule::count(jsi::Runtime &, double world) {
  return engine_world_count(find(world));
}

jsi::Object NayanEngineModule::getMatrices(jsi::Runtime &rt, double world) {
  ::World *w = find(world);
  if (w == nullptr) {
    throw jsi::JSError(rt, "NayanEngine: unknown world");
  }
  auto *data = reinterpret_cast<uint8_t *>(const_cast<float *>(engine_world_matrices(w)));
  size_t bytes = static_cast<size_t>(engine_world_count(w)) * 16 * sizeof(float);
  jsi::ArrayBuffer buffer(rt, std::make_shared<ExternalBuffer>(data, bytes));
  return jsi::Object(std::move(buffer));
}

} // namespace facebook::react
