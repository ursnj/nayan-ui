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
  double spawnDesc(jsi::Runtime &rt, double world, jsi::Object desc);
  bool setDesc(jsi::Runtime &rt, double world, double entity, jsi::Object desc);
  bool despawn(jsi::Runtime &rt, double world, double entity);
  void impulse(jsi::Runtime &rt, double world, double entity, double x, double y, double z);
  void setGravity(jsi::Runtime &rt, double world, double x, double y, double z);
  void setBounds(jsi::Runtime &rt, double world, double minX, double minZ, double maxX, double maxZ);
  void setListener(jsi::Runtime &rt, double world, double entity);
  double raycast(jsi::Runtime &rt, double world, double ox, double oy, double oz, double dx, double dy, double dz, double maxDistance, double mask);
  bool readPosition(jsi::Runtime &rt, double world, double entity);
  bool readVelocity(jsi::Runtime &rt, double world, double entity);
  void update(jsi::Runtime &rt, double world, double dt);
  double count(jsi::Runtime &rt, double world);
  jsi::Object getMatrices(jsi::Runtime &rt, double world);
  jsi::Object getColors(jsi::Runtime &rt, double world);
  jsi::Object getRanges(jsi::Runtime &rt, double world);
  jsi::Object getEvents(jsi::Runtime &rt, double world);
  double eventLength(jsi::Runtime &rt, double world);
  jsi::Object getScratch(jsi::Runtime &rt, double world);
  double audioLoad(jsi::Runtime &rt, jsi::Object data);
  double audioPlay(jsi::Runtime &rt, double sound, double volume, double pan, double pitch, bool loop);
  void audioStop(jsi::Runtime &rt, double voice);
  void audioSetVolume(jsi::Runtime &rt, double volume);
  void audioSetMuted(jsi::Runtime &rt, bool muted);
  bool audioIsRunning(jsi::Runtime &rt);
  bool hapticsSupported(jsi::Runtime &rt);
  void hapticsPlay(jsi::Runtime &rt, jsi::Array taps, bool throttle);

 private:
  ::World *find(double id) const;
  jsi::Object external(jsi::Runtime &rt, const void *data, size_t bytes) const;

  std::unordered_map<int, ::World *> worlds_;
  int next_ = 1;
};

} // namespace facebook::react
