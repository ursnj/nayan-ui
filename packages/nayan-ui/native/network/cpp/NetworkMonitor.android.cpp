#ifdef __ANDROID__
#include "NetworkMonitor.h"
#include <fbjni/fbjni.h>
#include <atomic>
#include <mutex>
#include <stdexcept>
#include <unordered_map>

namespace {
std::mutex mutex;
std::atomic<jlong> nextToken{1};
std::unordered_map<jlong, std::function<void(int)>> listeners;

class AndroidNetworkMonitor final : public nayan::NetworkMonitor {
 public:
  explicit AndroidNetworkMonitor(std::function<void(int)> changed) : token_(nextToken++) {
    { std::lock_guard<std::mutex> lock(mutex); listeners.emplace(token_, std::move(changed)); }
    auto *env = facebook::jni::Environment::current();
    auto cls = facebook::jni::findClassStatic("com/nayanui/engine/EngineNetwork");
    auto start = env->GetStaticMethodID(cls.get(), "start", "(J)Lcom/nayanui/engine/EngineNetwork;");
    jobject object = start ? env->CallStaticObjectMethod(cls.get(), start, token_) : nullptr;
    if (env->ExceptionCheck() || object == nullptr) {
      env->ExceptionClear();
      std::lock_guard<std::mutex> lock(mutex);
      listeners.erase(token_);
      throw std::runtime_error("Engine network monitoring could not start");
    }
    object_ = env->NewGlobalRef(object);
    env->DeleteLocalRef(object);
  }
  ~AndroidNetworkMonitor() override {
    { std::lock_guard<std::mutex> lock(mutex); listeners.erase(token_); }
    auto *env = facebook::jni::Environment::current();
    jclass cls = env->GetObjectClass(object_);
    auto stop = env->GetMethodID(cls, "stop", "()V");
    if (stop) env->CallVoidMethod(object_, stop);
    if (env->ExceptionCheck()) env->ExceptionClear();
    env->DeleteLocalRef(cls);
    env->DeleteGlobalRef(object_);
  }

 private:
  jlong token_;
  jobject object_ = nullptr;
};
} // namespace

namespace nayan {
std::unique_ptr<NetworkMonitor> watchNetwork(std::function<void(int)> changed) {
  return std::make_unique<AndroidNetworkMonitor>(std::move(changed));
}
} // namespace nayan

extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineNetwork_nativeChanged(JNIEnv *, jclass, jlong token, jint state) {
  std::function<void(int)> changed;
  {
    std::lock_guard<std::mutex> lock(mutex);
    auto found = listeners.find(token);
    if (found != listeners.end()) changed = found->second;
  }
  if (changed) changed(state);
}
#endif
