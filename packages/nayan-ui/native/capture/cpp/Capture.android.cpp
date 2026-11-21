#ifdef __ANDROID__
#include "Capture.h"
#include <fbjni/fbjni.h>
#include <atomic>
#include <mutex>
#include <unordered_map>
namespace {
std::mutex captureMutex;
std::atomic<jlong> nextCaptureToken{1};
std::unordered_map<jlong, nayan::CaptureCompletion> pendingCaptures;
void finishCapture(jlong token, std::string result, std::string error) {
  nayan::CaptureCompletion completed;
  {
    std::lock_guard<std::mutex> lock(captureMutex);
    auto found = pendingCaptures.find(token);
    if (found == pendingCaptures.end()) return;
    completed = std::move(found->second); pendingCaptures.erase(found);
  }
  completed(std::move(result), std::move(error));
}
}
namespace nayan {
void capture(std::string action, std::string uri, CaptureCompletion completed) {
  auto token = nextCaptureToken++;
  { std::lock_guard<std::mutex> lock(captureMutex); pendingCaptures.emplace(token, std::move(completed)); }
  try {
    static const auto cls = facebook::jni::findClassStatic("com/nayanui/engine/EngineCapture");
    static const auto request = cls->getStaticMethod<void(jlong, jstring, jstring)>("request");
    request(cls, token, facebook::jni::make_jstring(action).get(), facebook::jni::make_jstring(uri).get());
  } catch (...) { finishCapture(token, {}, "Native capture is unavailable"); }
}
}
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineCapture_nativeCompleted(
    JNIEnv *, jclass, jlong token, jstring result, jstring error) {
  finishCapture(token, result ? facebook::jni::wrap_alias(result)->toStdString() : std::string{},
      error ? facebook::jni::wrap_alias(error)->toStdString() : std::string{});
}
#endif
