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
  double spawn(jsi::Runtime &rt, double world, double x, double y, double z, double sx, double sy, double sz);
  void setAngularVelocity(jsi::Runtime &rt, double world, double entity, double x, double y, double z);
  void update(jsi::Runtime &rt, double world, double dt);
  double count(jsi::Runtime &rt, double world);
  jsi::Object getMatrices(jsi::Runtime &rt, double world);

 private:
  ::World *find(double id) const;

  std::unordered_map<int, ::World *> worlds_;
  int next_ = 1;
};

} // namespace facebook::react
