#ifdef __ANDROID__
#include "TemporaryFiles.h"
#include <fbjni/fbjni.h>
#include <atomic>
#include <mutex>
#include <unordered_map>
namespace {
std::mutex fileMutex;
std::atomic<jlong> nextFileToken{1};
std::unordered_map<jlong, nayan::FileCompletion> pendingFiles;
void finishFile(jlong token, std::string value, std::string error) {
  nayan::FileCompletion completed;
  {
    std::lock_guard<std::mutex> lock(fileMutex);
    auto found = pendingFiles.find(token);
    if (found == pendingFiles.end()) return;
    completed = std::move(found->second); pendingFiles.erase(found);
  }
  completed(std::move(value), std::move(error));
}
}
namespace nayan {
void temporaryFile(std::string action, std::string value, std::string fileName, FileCompletion completed) {
  const auto token = nextFileToken++;
  { std::lock_guard<std::mutex> lock(fileMutex); pendingFiles.emplace(token, std::move(completed)); }
  try {
    static const auto cls = facebook::jni::findClassStatic("com/nayanui/engine/EngineFiles");
    static const auto request = cls->getStaticMethod<void(jlong, jstring, jstring, jstring)>("request");
    request(cls, token, facebook::jni::make_jstring(action).get(), facebook::jni::make_jstring(value).get(), facebook::jni::make_jstring(fileName).get());
  } catch (...) { finishFile(token, {}, "Native temporary file support is unavailable"); }
}
}
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineFiles_nativeCompleted(JNIEnv *, jclass, jlong token, jstring value, jstring error) {
  finishFile(token, value ? facebook::jni::wrap_alias(value)->toStdString() : std::string{}, error ? facebook::jni::wrap_alias(error)->toStdString() : std::string{});
}
#endif
