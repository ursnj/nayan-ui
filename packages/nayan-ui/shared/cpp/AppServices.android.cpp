#ifdef __ANDROID__
#include "AppServices.h"
#include <fbjni/fbjni.h>
#include <atomic>
#include <mutex>
#include <unordered_map>

namespace {
std::mutex appServicesMutex;
std::atomic<jlong> nextAppServicesToken{1};
std::unordered_map<jlong, nayan::AppCompletion> pendingAppServices;

void finishAppServices(jlong token, std::string value, std::string error) {
  nayan::AppCompletion completed;
  {
    std::lock_guard<std::mutex> lock(appServicesMutex);
    auto found = pendingAppServices.find(token);
    if (found == pendingAppServices.end()) return;
    completed = std::move(found->second);
    pendingAppServices.erase(found);
  }
  completed(std::move(value), std::move(error));
}
} // namespace

namespace nayan {
bool hasImagePicker() {
  static const auto cls = facebook::jni::findClassStatic("com/nayanui/engine/EngineAppServices");
  static const auto available = cls->getStaticMethod<jboolean()>("hasImagePicker");
  return available(cls);
}

void requestAppServices(std::string command, AppCompletion completed) {
  const auto token = nextAppServicesToken++;
  { std::lock_guard<std::mutex> lock(appServicesMutex); pendingAppServices.emplace(token, std::move(completed)); }
  try {
    static const auto cls = facebook::jni::findClassStatic("com/nayanui/engine/EngineAppServices");
    static const auto request = cls->getStaticMethod<void(jlong, jstring)>("request");
    request(cls, token, facebook::jni::make_jstring(command).get());
  } catch (...) {
    finishAppServices(token, {}, "AppServices access failed");
  }
}
} // namespace nayan

extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineAppServices_nativeCompleted(
    JNIEnv *, jclass, jlong token, jstring value, jstring error) {
  finishAppServices(token,
      value ? facebook::jni::wrap_alias(value)->toStdString() : std::string{},
      error ? facebook::jni::wrap_alias(error)->toStdString() : std::string{});
}

extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineAppServices_nativePermissionCompleted(
    JNIEnv *, jclass, jlong token, jstring observation) {
  finishAppServices(token, nayan::permissionResult(facebook::jni::wrap_alias(observation)->toStdString()), {});
}
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineAppServices_nativeLocationCompleted(
    JNIEnv *, jclass, jlong token, jstring sample) {
  finishAppServices(token, nayan::locationPosition(facebook::jni::wrap_alias(sample)->toStdString()), {});
}
#endif
