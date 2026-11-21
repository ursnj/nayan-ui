#ifdef __ANDROID__
#include "Clipboard.h"
#include <fbjni/fbjni.h>
#include <atomic>
#include <mutex>
#include <unordered_map>

namespace {
std::mutex clipboardMutex;
std::atomic<jlong> nextClipboardToken{1};
std::unordered_map<jlong, nayan::ClipboardCompletion> pendingClipboard;

void finishClipboard(jlong token, std::string value, std::string error) {
  nayan::ClipboardCompletion completed;
  {
    std::lock_guard<std::mutex> lock(clipboardMutex);
    auto found = pendingClipboard.find(token);
    if (found == pendingClipboard.end()) return;
    completed = std::move(found->second);
    pendingClipboard.erase(found);
  }
  completed(std::move(value), std::move(error));
}
} // namespace

namespace nayan {
void requestClipboard(std::string action, std::string text, ClipboardCompletion completed) {
  const auto token = nextClipboardToken++;
  { std::lock_guard<std::mutex> lock(clipboardMutex); pendingClipboard.emplace(token, std::move(completed)); }
  try {
    static const auto cls = facebook::jni::findClassStatic("com/nayanui/engine/EngineClipboard");
    static const auto request = cls->getStaticMethod<void(jlong, jstring, jstring)>("request");
    request(cls, token, facebook::jni::make_jstring(action).get(), facebook::jni::make_jstring(text).get());
  } catch (...) {
    finishClipboard(token, {}, "Clipboard access failed");
  }
}
} // namespace nayan

extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineClipboard_nativeCompleted(
    JNIEnv *, jclass, jlong token, jstring value, jstring error) {
  finishClipboard(token,
      value ? facebook::jni::wrap_alias(value)->toStdString() : std::string{},
      error ? facebook::jni::wrap_alias(error)->toStdString() : std::string{});
}
#endif
