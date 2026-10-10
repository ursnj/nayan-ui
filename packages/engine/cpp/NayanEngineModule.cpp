#include "NayanEngineModule.h"

#include <engine_core.h>

#include <algorithm>

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

double NayanEngineModule::spawn(
    jsi::Runtime &, double world, double mesh, double x, double y, double z, double sx, double sy, double sz,
    double r, double g, double b, double a) {
  uint32_t entity = engine_world_spawn(
      find(world), id(mesh), x, y, z, sx, sy, sz, r, g, b, a); // invalid mesh -> rejected by the core
  return entity == ENGINE_NO_ENTITY ? -1 : static_cast<double>(entity);
}

bool NayanEngineModule::despawn(jsi::Runtime &, double world, double entity) {
  return engine_world_despawn(find(world), id(entity)) != 0;
}

void NayanEngineModule::setPosition(jsi::Runtime &, double world, double entity, double x, double y, double z) {
  engine_world_set_position(find(world), id(entity), x, y, z);
}

void NayanEngineModule::setRotation(
    jsi::Runtime &, double world, double entity, double x, double y, double z, double w) {
  engine_world_set_rotation(find(world), id(entity), x, y, z, w);
}

void NayanEngineModule::setScale(jsi::Runtime &, double world, double entity, double x, double y, double z) {
  engine_world_set_scale(find(world), id(entity), x, y, z);
}

void NayanEngineModule::setColor(jsi::Runtime &, double world, double entity, double r, double g, double b, double a) {
  engine_world_set_color(find(world), id(entity), r, g, b, a);
}

void NayanEngineModule::setVelocity(jsi::Runtime &, double world, double entity, double x, double y, double z) {
  engine_world_set_velocity(find(world), id(entity), x, y, z);
}

void NayanEngineModule::setAngularVelocity(
    jsi::Runtime &, double world, double entity, double x, double y, double z) {
  engine_world_set_angular_velocity(find(world), id(entity), x, y, z);
}

void NayanEngineModule::setOscillation(
    jsi::Runtime &, double world, double entity, double ax, double ay, double az, double frequency, double phase) {
  engine_world_set_oscillation(find(world), id(entity), ax, ay, az, frequency, phase);
}

void NayanEngineModule::setLifetime(jsi::Runtime &, double world, double entity, double seconds) {
  engine_world_set_lifetime(find(world), id(entity), seconds);
}

bool NayanEngineModule::setParent(jsi::Runtime &, double world, double entity, double parent) {
  return engine_world_set_parent(find(world), id(entity), id(parent)) != 0; // -1 -> NO_ENTITY: detach
}

void NayanEngineModule::setPlanarVelocity(jsi::Runtime &, double world, double entity, double x, double z) {
  engine_world_set_planar_velocity(find(world), id(entity), x, z);
}

void NayanEngineModule::applyImpulse(jsi::Runtime &, double world, double entity, double x, double y, double z) {
  engine_world_apply_impulse(find(world), id(entity), x, y, z);
}

void NayanEngineModule::setGravity(jsi::Runtime &, double world, double x, double y, double z) {
  engine_world_set_gravity(find(world), x, y, z);
}

bool NayanEngineModule::setPhysics(
    jsi::Runtime &, double world, double entity, double kind, double shape, double sx, double sy, double sz,
    double layer, double mask, bool sensor, double friction, double restitution, double density,
    double linearDamping, double angularDamping, double gravityScale, bool lockRotations, bool ccd) {
  EnginePhysicsDesc desc{};
  desc.kind = id(kind);   // out-of-range values are rejected by the core
  desc.shape = id(shape);
  desc.size[0] = static_cast<float>(sx);
  desc.size[1] = static_cast<float>(sy);
  desc.size[2] = static_cast<float>(sz);
  desc.layer = bits(layer);
  desc.mask = bits(mask);
  desc.sensor = sensor ? 1 : 0;
  desc.friction = static_cast<float>(friction);
  desc.restitution = static_cast<float>(restitution);
  desc.density = static_cast<float>(density);
  desc.linear_damping = static_cast<float>(linearDamping);
  desc.angular_damping = static_cast<float>(angularDamping);
  desc.gravity_scale = static_cast<float>(gravityScale);
  desc.lock_rotations = lockRotations ? 1 : 0;
  desc.ccd = ccd ? 1 : 0;
  return engine_world_set_physics(find(world), id(entity), &desc) != 0;
}

double NayanEngineModule::raycast(
    jsi::Runtime &, double world, double ox, double oy, double oz, double dx, double dy, double dz,
    double maxDistance, double mask) {
  uint32_t hit = engine_world_raycast(find(world), ox, oy, oz, dx, dy, dz, maxDistance, bits(mask));
  return hit == ENGINE_NO_ENTITY ? -1 : static_cast<double>(hit);
}

void NayanEngineModule::setFollow(jsi::Runtime &, double world, double entity, double target, double speed) {
  engine_world_set_follow(find(world), id(entity), id(target), speed);
}

void NayanEngineModule::setBounds(
    jsi::Runtime &, double world, double minX, double minZ, double maxX, double maxZ) {
  engine_world_set_bounds(find(world), minX, minZ, maxX, maxZ);
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

} // namespace facebook::react
