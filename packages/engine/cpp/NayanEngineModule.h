#pragma once

#include <NayanEngineSpecJSI.h>

#include <memory>
#include <unordered_map>

struct World;

namespace facebook::react {

class NayanEngineModule : public NativeNayanEngineCxxSpec<NayanEngineModule> {
 public:
  explicit NayanEngineModule(std::shared_ptr<CallInvoker> jsInvoker);
  ~NayanEngineModule();

  double createWorld(jsi::Runtime &rt, double capacity);
  void destroyWorld(jsi::Runtime &rt, double world);
  double spawn(jsi::Runtime &rt, double world, double mesh, double x, double y, double z, double sx, double sy, double sz, double r, double g, double b, double a);
  bool despawn(jsi::Runtime &rt, double world, double entity);
  void setPosition(jsi::Runtime &rt, double world, double entity, double x, double y, double z);
  void setRotation(jsi::Runtime &rt, double world, double entity, double x, double y, double z, double w);
  void setScale(jsi::Runtime &rt, double world, double entity, double x, double y, double z);
  void setColor(jsi::Runtime &rt, double world, double entity, double r, double g, double b, double a);
  void setVelocity(jsi::Runtime &rt, double world, double entity, double x, double y, double z);
  void setAngularVelocity(jsi::Runtime &rt, double world, double entity, double x, double y, double z);
  void setOscillation(jsi::Runtime &rt, double world, double entity, double ax, double ay, double az, double frequency, double phase);
  void setCollider(jsi::Runtime &rt, double world, double entity, double radius, double layer, double mask);
  void setFollow(jsi::Runtime &rt, double world, double entity, double target, double speed);
  void setBounds(jsi::Runtime &rt, double world, double minX, double minZ, double maxX, double maxZ);
  bool readPosition(jsi::Runtime &rt, double world, double entity);
  void update(jsi::Runtime &rt, double world, double dt);
  double count(jsi::Runtime &rt, double world);
  jsi::Object getMatrices(jsi::Runtime &rt, double world);
  jsi::Object getColors(jsi::Runtime &rt, double world);
  jsi::Object getRanges(jsi::Runtime &rt, double world);
  jsi::Object getEvents(jsi::Runtime &rt, double world);
  double eventLength(jsi::Runtime &rt, double world);
  jsi::Object getScratch(jsi::Runtime &rt, double world);

 private:
  ::World *find(double id) const;
  jsi::Object external(jsi::Runtime &rt, const void *data, size_t bytes) const;

  std::unordered_map<int, ::World *> worlds_;
  int next_ = 1;
};

} // namespace facebook::react
