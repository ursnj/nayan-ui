#ifdef __ANDROID__
#include "AssetReader.h"
#include <fbjni/fbjni.h>
#include <atomic>
#include <mutex>
#include <unordered_map>

namespace {
std::mutex assetMutex;
std::atomic<jlong> nextAssetToken{1};
std::unordered_map<jlong, nayan::AssetCompletion> pendingAssets;
void finishAsset(jlong token, std::vector<uint8_t> bytes, std::string error) {
  nayan::AssetCompletion completed;
  {
    std::lock_guard<std::mutex> lock(assetMutex);
    auto found = pendingAssets.find(token);
    if (found == pendingAssets.end()) return;
    completed = std::move(found->second);
    pendingAssets.erase(found);
  }
  completed(std::move(bytes), std::move(error));
}
} // namespace

namespace nayan {
void readAsset(std::string uri, AssetCompletion completed) {
  const auto token = nextAssetToken++;
  { std::lock_guard<std::mutex> lock(assetMutex); pendingAssets.emplace(token, std::move(completed)); }
  try {
    static const auto cls = facebook::jni::findClassStatic("com/nayanui/engine/EngineAssets");
    static const auto read = cls->getStaticMethod<void(jlong, jstring)>("read");
    read(cls, token, facebook::jni::make_jstring(uri).get());
  } catch (...) {
    finishAsset(token, {}, "Native asset reader is unavailable");
  }
}
} // namespace nayan

extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineAssets_nativeCompleted(
    JNIEnv *env, jclass, jlong token, jbyteArray data, jstring error) {
  if (error != nullptr) {
    finishAsset(token, {}, facebook::jni::wrap_alias(error)->toStdString());
    return;
  }
  try {
    const auto size = data == nullptr ? 0 : env->GetArrayLength(data);
    std::vector<uint8_t> bytes(size);
    if (size > 0) env->GetByteArrayRegion(data, 0, size, reinterpret_cast<jbyte *>(bytes.data()));
    if (env->ExceptionCheck()) { env->ExceptionClear(); finishAsset(token, {}, "Could not copy asset bytes"); return; }
    finishAsset(token, std::move(bytes), {});
  } catch (...) {
    finishAsset(token, {}, "Could not allocate asset bytes");
  }
}
#endif
