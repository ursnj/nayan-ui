#ifdef __ANDROID__
#include "Sharing.h"
#include <fbjni/fbjni.h>
#include <atomic>
#include <mutex>
#include <unordered_map>

namespace {
std::mutex sharingMutex;
std::atomic<jlong> nextSharingToken{1};
std::unordered_map<jlong, nayan::SharingCompletion> pendingSharing;
void finishSharing(jlong token, std::string error) {
  nayan::SharingCompletion completed;
  {
    std::lock_guard<std::mutex> lock(sharingMutex);
    auto found = pendingSharing.find(token);
    if (found == pendingSharing.end()) return;
    completed = std::move(found->second);
    pendingSharing.erase(found);
  }
  completed(std::move(error));
}
}
namespace nayan {
void share(std::string request, SharingCompletion completed) {
  const auto token = nextSharingToken++;
  { std::lock_guard<std::mutex> lock(sharingMutex); pendingSharing.emplace(token, std::move(completed)); }
  try {
    static const auto cls = facebook::jni::findClassStatic("com/nayanui/engine/EngineSharing");
    static const auto send = cls->getStaticMethod<void(jlong, jstring)>("request");
    send(cls, token, facebook::jni::make_jstring(request).get());
  } catch (...) { finishSharing(token, "Could not open sharing"); }
}
}
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineSharing_nativeCompleted(JNIEnv *, jclass, jlong token, jstring error) {
  finishSharing(token, error ? facebook::jni::wrap_alias(error)->toStdString() : std::string{});
}
#endif
