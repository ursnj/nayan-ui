#include "NayanEngineModule.h"
#include <cmath>
#include "clipboard/cpp/Clipboard.h"
#include "AppServices.h"
#include "device/cpp/Device.h"
#include "files/cpp/TemporaryFiles.h"
#include "sharing/cpp/Sharing.h"
#include "capture/cpp/Capture.h"
#include "assets/cpp/AssetReader.h"
#include "components/cpp/SystemBars.h"

#include <engine_core.h>

#include <algorithm>
#include <atomic>
#include <cstring>
#include <mutex>
#include <unordered_map>
#include <unordered_set>
#include <functional>
#include <thread>
#include <vector>

#ifdef __ANDROID__
#include <fbjni/fbjni.h>
#include <jni.h>
#endif
#include <string>
#include <vector>

namespace facebook::react {

namespace {
// Exposes Rust-owned memory to JS as an ArrayBuffer without copying (capacity is fixed, so it never
// moves). Holds a reference to the owning world, so a buffer JS keeps after destroyWorld stays valid.
// Memory owned by the buffer itself (results the core copies out).
class OwnedBuffer : public jsi::MutableBuffer {
 public:
  explicit OwnedBuffer(size_t size) : bytes_(size) {}
  size_t size() const override { return bytes_.size(); }
  uint8_t *data() override { return bytes_.data(); }

 private:
  std::vector<uint8_t> bytes_;
};

class ExternalBuffer : public jsi::MutableBuffer {
 public:
  ExternalBuffer(std::shared_ptr<void> owner, uint8_t *data, size_t size)
      : owner_(std::move(owner)), data_(data), size_(size) {}
  size_t size() const override { return size_; }
  uint8_t *data() override { return data_; }

 private:
  std::shared_ptr<void> owner_;
  uint8_t *data_;
  size_t size_;
};

using StorageResult = std::unique_ptr<EngineStorageResult, decltype(&engine_storage_free)>;
StorageResult storageResult(jsi::Runtime &rt, EngineStorageResult *raw) {
  StorageResult result(raw, engine_storage_free);
  const char *error = engine_storage_error(result.get());
  if (error[0] != '\0') throw jsi::JSError(rt, std::string("Engine storage: ") + error);
  return result;
}

jsi::Object geometryResult(jsi::Runtime &rt, EngineGeometry *raw) {
  std::unique_ptr<EngineGeometry, decltype(&engine_geometry_free)> result(raw, engine_geometry_free);
  const char *error = engine_geometry_error(result.get());
  if (error[0] != '\0') throw jsi::JSError(rt, std::string("NayanEngine modelling: ") + error);
  const uint32_t *data = engine_geometry_data(result.get());
  const size_t bytes = engine_geometry_size(result.get());
  if (data == nullptr || bytes < 8) throw jsi::JSError(rt, "NayanEngine modelling: invalid result");
  const size_t vertexBytes = static_cast<size_t>(data[0]) * 11 * sizeof(float);
  const size_t indexBytes = static_cast<size_t>(data[1]) * sizeof(uint32_t);
  if (bytes != 8 + vertexBytes + indexBytes) throw jsi::JSError(rt, "NayanEngine modelling: invalid buffers");
  auto vertices = std::make_shared<OwnedBuffer>(vertexBytes);
  auto indices = std::make_shared<OwnedBuffer>(indexBytes);
  if (vertexBytes > 0) std::memcpy(vertices->data(), data + 2, vertexBytes);
  if (indexBytes > 0) std::memcpy(indices->data(), reinterpret_cast<const uint8_t *>(data + 2) + vertexBytes, indexBytes);
  jsi::Object out(rt);
  out.setProperty(rt, "vertices", jsi::ArrayBuffer(rt, std::move(vertices)));
  out.setProperty(rt, "indices", jsi::ArrayBuffer(rt, std::move(indices)));
  return out;
}

// JS numbers -> entity ids. Negative or out-of-range values (e.g. -1 for "none") map to NO_ENTITY.
uint32_t id(double v) {
  return (v >= 0 && v <= static_cast<double>(UINT32_MAX)) ? static_cast<uint32_t>(v) : ENGINE_NO_ENTITY;
}

// JS numbers -> layer/mask bit sets (layers are 32 bits; -1 or 0xffffffff means "all").
uint32_t bits(double v) {
  if (!(v >= -2147483648.0 && v <= 4294967295.0)) {
    return 0; // NaN or out of range (the cast below would be undefined)
  }
  return static_cast<uint32_t>(static_cast<int64_t>(v) & 0xffffffff);
}

#ifdef __ANDROID__
// Gives the core the JavaVM and the Application context, which audio (cpal's AAudio backend) and
// haptics (the Vibrator service) need. Runs once; any failure leaves audio and haptics silent.
void initAndroid() {
  static bool done = false;
  if (done) {
    return;
  }
  done = true;
  try {
    JNIEnv *env = facebook::jni::Environment::current();
    JavaVM *vm = nullptr;
    if (env == nullptr || env->GetJavaVM(&vm) != JNI_OK || vm == nullptr) {
      return;
    }
    jclass activityThread = env->FindClass("android/app/ActivityThread");
    jmethodID currentApplication = activityThread == nullptr
        ? nullptr
        : env->GetStaticMethodID(activityThread, "currentApplication", "()Landroid/app/Application;");
    jobject app = currentApplication == nullptr ? nullptr : env->CallStaticObjectMethod(activityThread, currentApplication);
    if (env->ExceptionCheck()) {
      env->ExceptionClear();
    }
    if (app != nullptr) {
      // Android's files directory is durable app-private data, not the OS-purgeable cache.
      jclass appClass = env->GetObjectClass(app);
      jmethodID getFilesDir = env->GetMethodID(appClass, "getFilesDir", "()Ljava/io/File;");
      jobject files = getFilesDir == nullptr ? nullptr : env->CallObjectMethod(app, getFilesDir);
      if (files != nullptr && !env->ExceptionCheck()) {
        jclass fileClass = env->GetObjectClass(files);
        jmethodID getPath = env->GetMethodID(fileClass, "getAbsolutePath", "()Ljava/lang/String;");
        jstring path = getPath == nullptr ? nullptr : static_cast<jstring>(env->CallObjectMethod(files, getPath));
        if (path != nullptr && !env->ExceptionCheck()) {
          const char *text = env->GetStringUTFChars(path, nullptr);
          if (text != nullptr) { engine_cache_directory(reinterpret_cast<const uint8_t *>(text), std::strlen(text)); env->ReleaseStringUTFChars(path, text); }
          env->DeleteLocalRef(path);
        }
        env->DeleteLocalRef(fileClass); env->DeleteLocalRef(files);
      }
      if (env->ExceptionCheck()) env->ExceptionClear();
      env->DeleteLocalRef(appClass);
      engine_android_init(vm, env->NewGlobalRef(app)); // global ref: lives for the whole process
      env->DeleteLocalRef(app);
    }
    if (activityThread != nullptr) {
      env->DeleteLocalRef(activityThread);
    }
  } catch (...) {
    // No JNI environment on this thread: audio and haptics stay off rather than crash.
  }
}
#endif

} // namespace

namespace {
// Display-clock frames. The registry holds no JS values (those stay in the module, on the JS thread):
// the clock's thread only schedules a call by surface id, and a module torn down by a reload is never
// called again.
struct FrameClient {
  std::shared_ptr<CallInvoker> invoker;
  NayanEngineModule *owner;
  std::shared_ptr<std::atomic<bool>> pending;
};
std::mutex framesMutex;
std::unordered_map<int, FrameClient> frameClients;
std::unordered_set<NayanEngineModule *> liveModules; // guarded by framesMutex
} // namespace

void deliverFrame(int surface, double timeMs) {
  std::shared_ptr<CallInvoker> invoker;
  NayanEngineModule *owner = nullptr;
  std::shared_ptr<std::atomic<bool>> pending;
  {
    std::lock_guard<std::mutex> lock(framesMutex);
    auto it = frameClients.find(surface);
    if (it == frameClients.end() || it->second.pending->exchange(true)) return; // none, or JS hasn't run the last one
    invoker = it->second.invoker;
    owner = it->second.owner;
    pending = it->second.pending;
  }
  invoker->invokeAsync(SchedulerPriority::UserBlockingPriority, [owner, surface, timeMs, pending](jsi::Runtime &rt) {
    pending->store(false);
    {
      std::lock_guard<std::mutex> lock(framesMutex);
      if (liveModules.count(owner) == 0) return;
    }
    owner->callFrame(rt, surface, timeMs); // modules are destroyed on this (JS) thread, so it's still alive here
  });
}

NayanEngineModule::NayanEngineModule(std::shared_ptr<CallInvoker> jsInvoker)
    : NativeNayanEngineCxxSpec(std::move(jsInvoker)) {
  {
    std::lock_guard<std::mutex> lock(framesMutex);
    liveModules.insert(this);
  }
#ifdef __ANDROID__
  initAndroid();
#endif
}

// Worlds are freed when the module and every buffer aliasing them are gone.
NayanEngineModule::~NayanEngineModule() {
  engine_sqlite_release(reinterpret_cast<uintptr_t>(this));
  if (char *command = engine_app_services_release(reinterpret_cast<uintptr_t>(this))) {
    std::string text(command); engine_drawing_result_free(command);
    try { nayan::requestAppServices(std::move(text), [](std::string, std::string) {}); } catch (...) {}
  }
  EngineSystemBars bars{};
  bool restoreBars = false;
  for (const auto &owner : systemBarOwners_) {
    restoreBars = engine_system_bars_remove(reinterpret_cast<const uint8_t *>(owner.data()), owner.size(), &bars) != 0 || restoreBars;
  }
  if (restoreBars) { try { nayan::applySystemBars(bars); } catch (...) {} }
  if (networkActive_) networkActive_->store(false);
  network_.reset();
  engine_speech_shutdown();
  {
    std::lock_guard<std::mutex> lock(framesMutex);
    liveModules.erase(this);
    for (auto it = frameClients.begin(); it != frameClients.end();) it = it->second.owner == this ? frameClients.erase(it) : std::next(it);
  }
  for (int document : drawings_) engine_drawing_destroy(document);
}

bool NayanEngineModule::hasImagePicker(jsi::Runtime &) {
  return nayan::hasImagePicker();
}

jsi::Value NayanEngineModule::appRequest(jsi::Runtime &rt, jsi::String command) {
  auto promise = std::make_shared<AsyncPromise<std::string>>(rt, jsInvoker_);
  jsi::Value result(rt, promise->get(rt));
  const auto text = command.utf8(rt);
  char *raw = engine_app_services_prepare(reinterpret_cast<uintptr_t>(this), reinterpret_cast<const uint8_t *>(text.data()), text.size());
  std::string prepared(raw); engine_drawing_result_free(raw);
  nayan::requestAppServices(std::move(prepared), [promise](std::string value, std::string error) {
    if (error.empty()) promise->resolve(std::move(value)); else promise->reject(Error(std::move(error)));
  });
  return result;
}

jsi::Value NayanEngineModule::sqliteRequest(jsi::Runtime &rt, jsi::String command) {
  using SQLitePromise = AsyncPromise<std::string>;
  auto pending = std::make_unique<SQLitePromise>(rt, jsInvoker_);
  jsi::Value result(rt, pending->get(rt));
  const auto text = command.utf8(rt);
  auto *callback = pending.release();
  if (!engine_sqlite_submit(reinterpret_cast<uintptr_t>(this), reinterpret_cast<const uint8_t *>(text.data()), text.size(), callback,
      [](void *context, const uint8_t *data, size_t length) {
        std::unique_ptr<SQLitePromise> promise(static_cast<SQLitePromise *>(context));
        promise->resolve(std::string(reinterpret_cast<const char *>(data), length));
      })) {
    pending.reset(callback);
    pending->reject(Error("SQLite could not queue the request. Check the engine build and command size."));
  }
  return result;
}

jsi::String NayanEngineModule::storageRequest(jsi::Runtime &rt, jsi::String command) {
  const auto text = command.utf8(rt);
  auto result = storageResult(rt, engine_storage_request(reinterpret_cast<const uint8_t *>(text.data()), text.size()));
  return jsi::String::createFromUtf8(rt, engine_storage_data(result.get()), engine_storage_size(result.get()));
}

jsi::Object NayanEngineModule::storageRead(jsi::Runtime &rt, double handle, jsi::String key) {
  const auto text = key.utf8(rt);
  auto result = storageResult(rt, engine_storage_read(id(handle), reinterpret_cast<const uint8_t *>(text.data()), text.size()));
  const auto size = engine_storage_size(result.get());
  const auto *data = engine_storage_data(result.get());
  jsi::Object output(rt);
  if (size == 0) return output;
  if (data[0] == 1) {
    output.setProperty(rt, "value", jsi::String::createFromUtf8(rt, data + 1, size - 1));
  } else if (data[0] == 2 && size == 9) {
    uint64_t bits = 0;
    for (int i = 0; i < 8; ++i) bits |= static_cast<uint64_t>(data[i + 1]) << (i * 8);
    double number;
    std::memcpy(&number, &bits, sizeof(number));
    output.setProperty(rt, "value", number);
  } else if (data[0] == 3 && size == 2 && data[1] <= 1) {
    output.setProperty(rt, "value", data[1] != 0);
  } else if (data[0] == 4) {
    auto buffer = rt.global().getPropertyAsFunction(rt, "ArrayBuffer").callAsConstructor(rt, static_cast<double>(size - 1)).getObject(rt).getArrayBuffer(rt);
    if (size > 1) std::memcpy(buffer.data(rt), data + 1, size - 1);
    output.setProperty(rt, "value", std::move(buffer));
  } else {
    throw jsi::JSError(rt, "Engine storage: invalid stored value");
  }
  return output;
}

void NayanEngineModule::storageWrite(jsi::Runtime &rt, double handle, jsi::String key, jsi::Object input) {
  const auto text = key.utf8(rt);
  const auto value = input.getProperty(rt, "value");
  std::vector<uint8_t> bytes;
  if (value.isString()) {
    const auto string = value.asString(rt).utf8(rt);
    bytes.reserve(string.size() + 1);
    bytes.push_back(1);
    bytes.insert(bytes.end(), string.begin(), string.end());
  } else if (value.isNumber()) {
    const double number = value.asNumber();
    uint64_t bits;
    std::memcpy(&bits, &number, sizeof(bits));
    bytes.push_back(2);
    for (int i = 0; i < 8; ++i) bytes.push_back(static_cast<uint8_t>(bits >> (i * 8)));
  } else if (value.isBool()) {
    bytes = {3, static_cast<uint8_t>(value.getBool())};
  } else if (value.isObject() && value.asObject(rt).isArrayBuffer(rt)) {
    auto buffer = value.asObject(rt).getArrayBuffer(rt);
    bytes.push_back(4);
    if (buffer.size(rt)) bytes.insert(bytes.end(), buffer.data(rt), buffer.data(rt) + buffer.size(rt));
  } else {
    throw jsi::JSError(rt, "Engine storage: expected a string, number or boolean, or binary buffer");
  }
  auto result = storageResult(rt, engine_storage_write(id(handle), reinterpret_cast<const uint8_t *>(text.data()), text.size(), bytes.data(), bytes.size()));
}

void NayanEngineModule::networkStart(jsi::Runtime &rt, jsi::Function changed) {
  networkStop(rt);
  auto active = std::make_shared<std::atomic<bool>>(true);
  networkActive_ = active;
  networkCallback_ = std::make_unique<jsi::Function>(std::move(changed));
  auto invoker = jsInvoker_;
  try {
    network_ = nayan::watchNetwork([this, active, invoker](int state) {
      if (!active->load()) return;
      invoker->invokeAsync([this, active, state](jsi::Runtime &runtime) {
        // The module and its JS callback are touched only on JS, after checking this watch's lifetime.
        if (active->load() && networkCallback_) networkCallback_->call(runtime, state);
      });
    });
  } catch (...) {
    networkStop(rt);
    throw;
  }
}
void NayanEngineModule::networkStop(jsi::Runtime &) {
  if (networkActive_) networkActive_->store(false);
  network_.reset();
  networkCallback_.reset();
  networkActive_.reset();
}

jsi::String NayanEngineModule::deviceEnvironment(jsi::Runtime &rt) {
  return jsi::String::createFromUtf8(rt, nayan::deviceEnvironment());
}
jsi::String NayanEngineModule::safeAreaRequest(jsi::Runtime &rt, jsi::String command) {
  auto json = command.utf8(rt);
  char *result = engine_safe_area_request(reinterpret_cast<const uint8_t *>(json.data()), json.size());
  auto value = jsi::String::createFromUtf8(rt, result ? result : "{\"ok\":false}");
  engine_drawing_result_free(result);
  return value;
}

jsi::String NayanEngineModule::authRequest(jsi::Runtime &rt, jsi::String command) {
  const auto json = command.utf8(rt);
  std::unique_ptr<char, decltype(&engine_drawing_result_free)> result(
      engine_auth_request(reinterpret_cast<const uint8_t *>(json.data()), json.size()), engine_drawing_result_free);
  return jsi::String::createFromUtf8(rt, result.get());
}

jsi::Value NayanEngineModule::fileRequest(jsi::Runtime &rt, jsi::String action, jsi::String value, jsi::String fileName) {
  auto promise = std::make_shared<AsyncPromise<std::string>>(rt, jsInvoker_);
  jsi::Value result(rt, promise->get(rt));
  nayan::temporaryFile(action.utf8(rt), value.utf8(rt), fileName.utf8(rt), [promise](std::string value, std::string error) {
    if (error.empty()) promise->resolve(std::move(value));
    else promise->reject(Error(std::move(error)));
  });
  return result;
}

jsi::Value NayanEngineModule::clipboardRequest(jsi::Runtime &rt, jsi::String action, jsi::String text) {
  auto promise = std::make_shared<AsyncPromise<std::string>>(rt, jsInvoker_);
  jsi::Value result(rt, promise->get(rt));
  nayan::requestClipboard(action.utf8(rt), text.utf8(rt), [promise](std::string value, std::string error) {
    if (error.empty()) promise->resolve(std::move(value));
    else promise->reject(Error(std::move(error)));
  });
  return result;
}

jsi::Value NayanEngineModule::captureRequest(jsi::Runtime &rt, jsi::String action, jsi::String uri) {
  auto promise = std::make_shared<AsyncPromise<std::string>>(rt, jsInvoker_);
  jsi::Value result(rt, promise->get(rt));
  nayan::capture(action.utf8(rt), uri.utf8(rt), [promise](std::string value, std::string error) {
    if (error.empty()) promise->resolve(std::move(value));
    else promise->reject(Error(std::move(error)));
  });
  return result;
}

jsi::Value NayanEngineModule::sharingRequest(jsi::Runtime &rt, jsi::String options) {
  auto promise = std::make_shared<AsyncPromise<>>(rt, jsInvoker_);
  jsi::Value result(rt, promise->get(rt));
  nayan::share(options.utf8(rt), [promise](std::string error) {
    if (error.empty()) promise->resolve();
    else promise->reject(Error(std::move(error)));
  });
  return result;
}

void NayanEngineModule::systemBarsSet(jsi::Runtime &rt, jsi::String id, jsi::String configuration) {
  const auto owner = std::to_string(reinterpret_cast<uintptr_t>(this)) + ":" + id.utf8(rt);
  const auto command = configuration.utf8(rt);
  EngineSystemBars bars{};
  if (!engine_system_bars_set(reinterpret_cast<const uint8_t *>(owner.data()), owner.size(),
      reinterpret_cast<const uint8_t *>(command.data()), command.size(), &bars))
    throw jsi::JSError(rt, "NTheme system bars: invalid configuration or UI support is unavailable");
  systemBarOwners_.insert(owner);
  nayan::applySystemBars(bars);
}
void NayanEngineModule::systemThemeSet(jsi::Runtime &rt, jsi::String id, jsi::String configuration) {
  systemBarsSet(rt, std::move(id), std::move(configuration));
}
void NayanEngineModule::systemBarsRemove(jsi::Runtime &rt, jsi::String id) {
  const auto owner = std::to_string(reinterpret_cast<uintptr_t>(this)) + ":" + id.utf8(rt);
  if (!systemBarOwners_.erase(owner)) return;
  EngineSystemBars bars{};
  if (engine_system_bars_remove(reinterpret_cast<const uint8_t *>(owner.data()), owner.size(), &bars)) nayan::applySystemBars(bars);
}

jsi::String NayanEngineModule::uuid(jsi::Runtime &rt) {
  uint8_t output[36];
  if (!engine_uuid(output, sizeof(output))) throw jsi::JSError(rt, "Engine: UUID generation failed");
  return jsi::String::createFromUtf8(rt, output, sizeof(output));
}

bool NayanEngineModule::hasFrameClock(jsi::Runtime &) {
#if defined(__ANDROID__) || defined(__APPLE__)
  return true; // EngineSurfaceView's Choreographer / NayanEngineSurfaceView's CADisplayLink call deliverFrame
#else
  return false;
#endif
}

void NayanEngineModule::startFrames(jsi::Runtime &rt, double surface, jsi::Function onFrame) {
  int s = static_cast<int>(surface);
  frameCallbacks_.erase(s);
  frameCallbacks_.emplace(s, std::move(onFrame));
  std::lock_guard<std::mutex> lock(framesMutex);
  frameClients[s] = FrameClient{jsInvoker_, this, std::make_shared<std::atomic<bool>>(false)};
}

void NayanEngineModule::stopFrames(jsi::Runtime &, double surface) {
  int s = static_cast<int>(surface);
  {
    std::lock_guard<std::mutex> lock(framesMutex);
    auto it = frameClients.find(s);
    if (it != frameClients.end() && it->second.owner == this) frameClients.erase(it);
  }
  frameCallbacks_.erase(s);
}

void NayanEngineModule::callFrame(jsi::Runtime &rt, int surface, double timeMs) {
  auto it = frameCallbacks_.find(surface);
  if (it != frameCallbacks_.end()) it->second.call(rt, timeMs);
}

namespace {
// NaN, fractional and out-of-range ids are unknown (casting them to int is undefined or aliases another id).
bool knownWorldId(double worldId, int next) {
  return worldId >= 1 && worldId < next && worldId == static_cast<int>(worldId);
}
} // namespace

std::shared_ptr<::World> NayanEngineModule::owner(double worldId) const {
  if (!knownWorldId(worldId, next_)) {
    return nullptr;
  }
  auto it = worlds_.find(static_cast<int>(worldId));
  return it == worlds_.end() ? nullptr : it->second;
}

::World *NayanEngineModule::find(double worldId) const {
  if (!knownWorldId(worldId, next_)) {
    return nullptr;
  }
  // No shared_ptr copy (atomic refcount) per call: the map owns the world, and every caller runs on
  // the JS thread, which is also the only thread that can erase it (destroyWorld).
  auto it = worlds_.find(static_cast<int>(worldId));
  return it == worlds_.end() ? nullptr : it->second.get();
}

jsi::Object NayanEngineModule::external(
    jsi::Runtime &rt, std::shared_ptr<void> owner, const void *data, size_t bytes) const {
  if (data == nullptr) {
    throw jsi::JSError(rt, "NayanEngine: unknown world, mesh or texture");
  }
  jsi::ArrayBuffer buffer(
      rt,
      std::make_shared<ExternalBuffer>(
          std::move(owner), reinterpret_cast<uint8_t *>(const_cast<void *>(data)), bytes));
  return jsi::Object(std::move(buffer));
}

struct AssetBuffer {
  std::shared_ptr<std::vector<uint8_t>> bytes;
};
template <> struct Bridging<AssetBuffer> {
  static jsi::ArrayBuffer toJs(jsi::Runtime &rt, const AssetBuffer &result) {
    return jsi::ArrayBuffer(rt, std::make_shared<ExternalBuffer>(result.bytes, result.bytes->data(), result.bytes->size()));
  }
};

jsi::Value NayanEngineModule::assetRead(jsi::Runtime &rt, jsi::String uri) {
  auto promise = std::make_shared<AsyncPromise<AssetBuffer>>(rt, jsInvoker_);
  jsi::Value result(rt, promise->get(rt));
  nayan::readAsset(uri.utf8(rt), [promise](std::vector<uint8_t> bytes, std::string error) {
    if (!error.empty()) promise->reject(Error(error));
    else promise->resolve(AssetBuffer{std::make_shared<std::vector<uint8_t>>(std::move(bytes))});
  });
  return result;
}

double NayanEngineModule::createWorld(jsi::Runtime &rt, double capacity) {
  // NaN / negative -> 0; the core clamps very large values.
  uint32_t n = capacity >= 1 ? static_cast<uint32_t>(std::min(capacity, 1048576.0)) : 0;
  auto world = std::shared_ptr<::World>(engine_world_new(n), engine_world_free);
  if (!world) throw jsi::JSError(rt, "Games were disabled in this engine build");
  int worldId = next_++;
  worlds_[worldId] = std::move(world);
  return worldId;
}

void NayanEngineModule::destroyWorld(jsi::Runtime &, double world) {
  if (owner(world) != nullptr) {
    worlds_.erase(static_cast<int>(world));
  }
}

namespace {

// An encoded description (entity, animation, burst): a Float64Array's ArrayBuffer of doubles.
const double *descData(jsi::Runtime &rt, jsi::Object &desc, size_t &len) {
  if (!desc.isArrayBuffer(rt)) {
    throw jsi::JSError(rt, "NayanEngine: expected an ArrayBuffer description");
  }
  jsi::ArrayBuffer buffer = desc.getArrayBuffer(rt);
  len = buffer.size(rt) / sizeof(double);
  return reinterpret_cast<const double *>(buffer.data(rt));
}

// Bytes of a file passed from JS (copied by the core).
jsi::ArrayBuffer fileData(jsi::Runtime &rt, jsi::Object &data, const char *method) {
  if (!data.isArrayBuffer(rt)) {
    throw jsi::JSError(rt, std::string("NayanEngine.") + method + ": expected an ArrayBuffer");
  }
  return data.getArrayBuffer(rt);
}

/** An ArrayBuffer's bytes, copied so a background thread can read them after the JS call returns. */
std::vector<uint8_t> copyBytes(jsi::Runtime &rt, jsi::Object &data, const char *method) {
  jsi::ArrayBuffer buffer = fileData(rt, data, method);
  const uint8_t *bytes = buffer.data(rt);
  return std::vector<uint8_t>(bytes, bytes + buffer.size(rt));
}

/**
 * Runs `job` (which must not touch JSI) on its own native thread and settles a JS promise with its
 * result on the JS thread. Decoding images, glTF models, fonts and sounds this way keeps them off
 * the JS thread, and several loads run in parallel on the phone's cores. The core's asset
 * registries are locked, so concurrent loads are safe.
 */
jsi::Value runInBackground(jsi::Runtime &rt, const std::shared_ptr<CallInvoker> &jsInvoker, std::function<double()> job) {
  auto promise = std::make_shared<AsyncPromise<double>>(rt, jsInvoker);
  jsi::Value result(rt, promise->get(rt));
  std::thread([promise, job = std::move(job)]() { promise->resolve(job()); }).detach();
  return result;
}

} // namespace

jsi::Value NayanEngineModule::iconRequest(jsi::Runtime &rt, jsi::Object data, jsi::String command) {
  auto bytes = std::make_shared<std::vector<uint8_t>>(copyBytes(rt, data, "iconRequest"));
  auto text = command.utf8(rt);
  auto promise = std::make_shared<AsyncPromise<std::string>>(rt, jsInvoker_);
  jsi::Value result(rt, promise->get(rt));
  std::thread([promise, bytes, text = std::move(text)]() {
    try {
      static const uint8_t empty = 0;
      std::unique_ptr<char, decltype(&engine_drawing_result_free)> output(
          engine_icon_request(bytes->empty() ? &empty : bytes->data(), bytes->size(), reinterpret_cast<const uint8_t *>(text.data()), text.size()), engine_drawing_result_free);
      promise->resolve(output ? std::string(output.get()) : "{\"ok\":false,\"error\":\"Icon request failed\"}");
    } catch (const std::exception &error) { promise->reject(Error(error.what())); }
  }).detach();
  return result;
}

double NayanEngineModule::spawnDesc(jsi::Runtime &rt, double world, jsi::Object desc) {
  size_t len = 0;
  const double *data = descData(rt, desc, len);
  uint32_t entity = engine_world_spawn_desc(find(world), data, len);
  return entity == ENGINE_NO_ENTITY ? -1 : static_cast<double>(entity);
}

bool NayanEngineModule::setDesc(jsi::Runtime &rt, double world, double entity, jsi::Object desc) {
  size_t len = 0;
  const double *data = descData(rt, desc, len);
  return engine_world_set_desc(find(world), id(entity), data, len) != 0;
}

bool NayanEngineModule::despawn(jsi::Runtime &, double world, double entity) {
  return engine_world_despawn(find(world), id(entity)) != 0;
}

double NayanEngineModule::setTransforms(jsi::Runtime &rt, double world, jsi::Object data, double count) {
  size_t len = 0;
  const double *values = descData(rt, data, len);
  return engine_world_set_transforms(find(world), values, len, count > 0 ? static_cast<size_t>(std::min(count, static_cast<double>(len / 16))) : 0);
}

void NayanEngineModule::impulse(jsi::Runtime &, double world, double entity, double x, double y, double z) {
  engine_world_apply_impulse(find(world), id(entity), x, y, z);
}

void NayanEngineModule::setGravity(jsi::Runtime &, double world, double x, double y, double z) {
  engine_world_set_gravity(find(world), x, y, z);
}

void NayanEngineModule::setBounds(
    jsi::Runtime &, double world, double minX, double minZ, double maxX, double maxZ) {
  engine_world_set_bounds(find(world), minX, minZ, maxX, maxZ);
}

double NayanEngineModule::raycast(
    jsi::Runtime &, double world, double ox, double oy, double oz, double dx, double dy, double dz,
    double maxDistance, double mask) {
  uint32_t hit = engine_world_raycast(find(world), ox, oy, oz, dx, dy, dz, maxDistance, bits(mask));
  return hit == ENGINE_NO_ENTITY ? -1 : static_cast<double>(hit);
}

double NayanEngineModule::pick(jsi::Runtime &, double world, double ox, double oy, double oz, double dx, double dy, double dz) {
  uint32_t hit = engine_world_pick(find(world), ox, oy, oz, dx, dy, dz);
  return hit == ENGINE_NO_ENTITY ? -1 : static_cast<double>(hit);
}

double NayanEngineModule::pickScreen(jsi::Runtime &, double world, double x, double y) {
  uint32_t hit = engine_world_pick_screen(find(world), x, y);
  return hit == ENGINE_NO_ENTITY ? -1 : static_cast<double>(hit);
}

void NayanEngineModule::setView(jsi::Runtime &rt, double world, jsi::Object viewProj, double width, double height) {
  jsi::ArrayBuffer vp = fileData(rt, viewProj, "setView");
  engine_world_set_view(find(world), reinterpret_cast<const float *>(vp.data(rt)), width, height);
}

bool NayanEngineModule::screenRay(jsi::Runtime &, double world, double x, double y) {
  return engine_world_screen_ray(find(world), x, y) != 0;
}

bool NayanEngineModule::screenToWorld(
    jsi::Runtime &, double world, double x, double y,
    double ppx, double ppy, double ppz, double pnx, double pny, double pnz) {
  return engine_world_screen_to_world(find(world), x, y, ppx, ppy, ppz, pnx, pny, pnz) != 0;
}

bool NayanEngineModule::toScreen(jsi::Runtime &, double world, double x, double y, double z) {
  return engine_world_to_screen(find(world), x, y, z) != 0;
}

bool NayanEngineModule::readPosition(jsi::Runtime &, double world, double entity, bool rendered) {
  return engine_world_read_position(find(world), id(entity), rendered ? 1 : 0) != 0;
}

double NayanEngineModule::animate(jsi::Runtime &rt, double world, jsi::Object animation) {
  size_t len = 0;
  const double *data = descData(rt, animation, len);
  return engine_world_animate(find(world), data, len);
}

bool NayanEngineModule::stopAnimation(jsi::Runtime &, double world, double entity) {
  return engine_world_stop_animation(find(world), id(entity)) != 0;
}

double NayanEngineModule::burst(jsi::Runtime &rt, double world, jsi::Object burst) {
  size_t len = 0;
  const double *data = descData(rt, burst, len);
  return engine_world_burst(find(world), data, len);
}

bool NayanEngineModule::readVelocity(jsi::Runtime &, double world, double entity) {
  return engine_world_read_velocity(find(world), id(entity)) != 0;
}

void NayanEngineModule::update(jsi::Runtime &, double world, double dt) {
  engine_world_update(find(world), static_cast<float>(dt));
}

double NayanEngineModule::after(jsi::Runtime &, double world, double seconds) {
  return engine_world_after(find(world), static_cast<float>(seconds));
}

double NayanEngineModule::cancelTimers(jsi::Runtime &, double world) {
  return engine_world_cancel_timers(find(world));
}

double NayanEngineModule::scoreboard(jsi::Runtime &, double world, double op, double a, double b) {
  return engine_world_scoreboard(find(world), op >= 0 ? static_cast<uint32_t>(op) : UINT32_MAX, a, b);
}

jsi::Object NayanEngineModule::getScoreboard(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_scoreboard_state(w.get()), ENGINE_SCOREBOARD_LEN * sizeof(double));
}

double NayanEngineModule::count(jsi::Runtime &, double world) {
  return engine_world_count(find(world));
}

jsi::Object NayanEngineModule::getMatrices(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_matrices(w.get()), static_cast<size_t>(engine_world_capacity(w.get())) * 16 * sizeof(float));
}

jsi::Object NayanEngineModule::getColors(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_colors(w.get()), static_cast<size_t>(engine_world_capacity(w.get())) * 4 * sizeof(float));
}

jsi::Object NayanEngineModule::getRegions(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_regions(w.get()), static_cast<size_t>(engine_world_capacity(w.get())) * 4 * sizeof(float));
}

jsi::Object NayanEngineModule::getRanges(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_ranges(w.get()), ENGINE_MAX_MESHES * 4 * sizeof(uint32_t));
}

jsi::Object NayanEngineModule::getDone(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  size_t room = static_cast<size_t>(engine_world_capacity(w.get())) * ENGINE_DONE_PER_ENTITY + 64;
  return external(rt, w, engine_world_done(w.get()), room * sizeof(uint32_t));
}

double NayanEngineModule::doneLength(jsi::Runtime &, double world) {
  return engine_world_done_len(find(world));
}

jsi::Object NayanEngineModule::getEvents(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_events(w.get()), ENGINE_MAX_EVENTS * ENGINE_EVENT_STRIDE * sizeof(uint32_t));
}

double NayanEngineModule::eventLength(jsi::Runtime &, double world) {
  return engine_world_event_len(find(world));
}

jsi::Object NayanEngineModule::getScratch(jsi::Runtime &rt, double world) {
  auto w = owner(world);
  return external(rt, w, engine_world_scratch(w.get()), 16 * sizeof(float));
}

void NayanEngineModule::setListener(jsi::Runtime &, double world, double entity) {
  engine_world_set_listener(find(world), id(entity));
}

jsi::String NayanEngineModule::modelRig(jsi::Runtime &rt, double mesh) {
  std::string metadata(engine_model_rig(id(mesh), nullptr, 0) + 1, '\0');
  metadata.resize(engine_model_rig(id(mesh), reinterpret_cast<uint8_t *>(metadata.data()), metadata.size()));
  return jsi::String::createFromUtf8(rt, metadata);
}

bool NayanEngineModule::playClip(jsi::Runtime &rt, double world, double entity, jsi::String clip, bool loop, double speed, double fade, double time) {
  std::string name = clip.utf8(rt);
  return engine_world_play_clip(find(world), id(entity), reinterpret_cast<const uint8_t *>(name.data()), name.size(), loop ? 1 : 0, speed, fade, time) != 0;
}

bool NayanEngineModule::stopClip(jsi::Runtime &, double world, double entity, bool reset) {
  return engine_world_stop_clip(find(world), id(entity), reset ? 1 : 0) != 0;
}

bool NayanEngineModule::skinPoints(jsi::Runtime &rt, double world, double entity, jsi::Object vertices, jsi::Object output, double after) {
  auto indices = fileData(rt, vertices, "skinPoints");
  auto out = fileData(rt, output, "skinPoints");
  size_t count = indices.size(rt) / sizeof(uint32_t);
  if (out.size(rt) / sizeof(float) / 3 < count) return false;
  return engine_world_skin_points(find(world), id(entity), reinterpret_cast<const uint32_t *>(indices.data(rt)), count, reinterpret_cast<float *>(out.data(rt)), after) != 0;
}

jsi::Object NayanEngineModule::cacheRead(jsi::Runtime &rt, jsi::String key) {
  const auto text = key.utf8(rt);
  auto raw = engine_cache_read(reinterpret_cast<const uint8_t *>(text.data()), text.size());
  if (raw == nullptr) return jsi::ArrayBuffer(rt, std::make_shared<OwnedBuffer>(0));
  std::shared_ptr<void> owner(raw, [](void *value) { engine_cache_free(static_cast<EngineCacheBlob *>(value)); });
  return external(rt, std::move(owner), engine_cache_data(raw), engine_cache_size(raw));
}
bool NayanEngineModule::cacheWrite(jsi::Runtime &rt, jsi::String key, jsi::Object data) {
  const auto text = key.utf8(rt); auto bytes = fileData(rt, data, "cacheWrite");
  return engine_cache_write(reinterpret_cast<const uint8_t *>(text.data()), text.size(), bytes.data(rt), bytes.size(rt)) != 0;
}
bool NayanEngineModule::cacheRemove(jsi::Runtime &rt, jsi::String key) {
  const auto text = key.utf8(rt);
  return engine_cache_remove(reinterpret_cast<const uint8_t *>(text.data()), text.size()) != 0;
}
bool NayanEngineModule::cacheClear(jsi::Runtime &) { return engine_cache_clear() != 0; }
double NayanEngineModule::shapePrepare(jsi::Runtime &rt, jsi::Object vertices, jsi::Object indices, jsi::String options) {
  const auto text = options.utf8(rt); auto v = fileData(rt, vertices, "shapePrepare"); auto i = fileData(rt, indices, "shapePrepare");
  return engine_shape_prepare(reinterpret_cast<const float *>(v.data(rt)), v.size(rt)/4,
    reinterpret_cast<const uint32_t *>(i.data(rt)), i.size(rt)/4, reinterpret_cast<const uint8_t *>(text.data()), text.size());
}
double NayanEngineModule::solidPrepare(jsi::Runtime &rt, jsi::String recipe, jsi::String options) {
  const auto r = recipe.utf8(rt); const auto o = options.utf8(rt);
  return engine_solid_prepare(reinterpret_cast<const uint8_t *>(r.data()), r.size(), reinterpret_cast<const uint8_t *>(o.data()), o.size());
}

double NayanEngineModule::modelLoad(jsi::Runtime &rt, jsi::Object data, bool center, double fit) {
  jsi::ArrayBuffer buffer = fileData(rt, data, "modelLoad");
  return engine_model_load(buffer.data(rt), buffer.size(rt), center ? 1 : 0, static_cast<float>(fit)); // copied
}

jsi::Value NayanEngineModule::modelLoadAsync(jsi::Runtime &rt, jsi::Object data, bool center, double fit) {
  auto bytes = std::make_shared<std::vector<uint8_t>>(copyBytes(rt, data, "modelLoadAsync"));
  return runInBackground(rt, jsInvoker_, [bytes, center, fit]() {
    return static_cast<double>(engine_model_load(bytes->data(), bytes->size(), center ? 1 : 0, static_cast<float>(fit)));
  });
}

jsi::Object NayanEngineModule::modelVertices(jsi::Runtime &rt, double mesh) {
  uint32_t m = id(mesh);
  return external(rt, nullptr, engine_model_vertices(m), static_cast<size_t>(engine_model_vertex_count(m)) * 11 * sizeof(float));
}

jsi::Object NayanEngineModule::modelIndices(jsi::Runtime &rt, double mesh) {
  uint32_t m = id(mesh);
  return external(rt, nullptr, engine_model_indices(m), static_cast<size_t>(engine_model_index_count(m)) * sizeof(uint32_t));
}

jsi::Array NayanEngineModule::modelSize(jsi::Runtime &rt, double mesh) {
  float size[3] = {0, 0, 0};
  engine_model_size(id(mesh), size);
  return jsi::Array::createWithElements(rt, size[0], size[1], size[2]);
}

jsi::Array NayanEngineModule::modelBake(jsi::Runtime &rt, double mesh, jsi::String spec) {
  const auto json = spec.utf8(rt);
  float out[4] = {0, 0, 0, 0};
  if (!engine_model_bake(id(mesh), reinterpret_cast<const uint8_t *>(json.data()), json.size(), out)) {
    return jsi::Array(rt, 0);
  }
  return jsi::Array::createWithElements(rt, out[0], out[1], out[2], out[3]);
}

bool NayanEngineModule::bakeKept(jsi::Runtime &rt, jsi::String key) {
  const auto k = key.utf8(rt);
  return engine_bake_kept(reinterpret_cast<const uint8_t *>(k.data()), k.size()) != 0;
}

double NayanEngineModule::modelTexture(jsi::Runtime &, double mesh) {
  return engine_model_texture(id(mesh));
}

bool NayanEngineModule::renderModel(jsi::Runtime &, double mesh, double texture, double shine) {
  int32_t t = texture >= 0 && texture <= INT32_MAX ? static_cast<int32_t>(texture) : -1;
  return engine_render_model(id(mesh), t, static_cast<float>(shine)) != 0;
}

double NayanEngineModule::meshAlias(jsi::Runtime &, double base) {
  return engine_mesh_alias(id(base));
}

double NayanEngineModule::meshCreate(jsi::Runtime &rt, jsi::Object vertices, jsi::Object indices) {
  jsi::ArrayBuffer v = fileData(rt, vertices, "meshCreate");
  jsi::ArrayBuffer i = fileData(rt, indices, "meshCreate");
  return engine_mesh_create(
      reinterpret_cast<const float *>(v.data(rt)), v.size(rt) / (11 * sizeof(float)),
      reinterpret_cast<const uint32_t *>(i.data(rt)), i.size(rt) / sizeof(uint32_t)); // copied
}

jsi::Object NayanEngineModule::pathExtrude(jsi::Runtime &rt, jsi::Object points, jsi::Array counts, double depth, bool evenOdd) {
  jsi::ArrayBuffer p = fileData(rt, points, "pathExtrude");
  size_t available = p.size(rt) / (2 * sizeof(float));
  std::vector<uint32_t> n(counts.size(rt));
  size_t total = 0;
  for (size_t k = 0; k < n.size(); k++) {
    double c = counts.getValueAtIndex(rt, k).asNumber();
    n[k] = c >= 0 && c <= static_cast<double>(UINT32_MAX) ? static_cast<uint32_t>(c) : 0;
    total += n[k];
  }
  if (total > available) {
    throw jsi::JSError(rt, "NayanEngine.pathExtrude: the counts add up to more points than given");
  }
  size_t floats = engine_path_extrude(reinterpret_cast<const float *>(p.data(rt)), n.data(), n.size(), static_cast<float>(depth), evenOdd ? 1 : 0);
  auto out = std::make_shared<OwnedBuffer>(floats * sizeof(float));
  engine_path_extrude_copy(reinterpret_cast<float *>(out->data()), floats);
  return jsi::Object(jsi::ArrayBuffer(rt, std::move(out)));
}

void NayanEngineModule::geometrySmoothNormals(jsi::Runtime &rt, jsi::Object vertices, jsi::Object indices) {
  jsi::ArrayBuffer v = fileData(rt, vertices, "geometrySmoothNormals");
  jsi::ArrayBuffer i = fileData(rt, indices, "geometrySmoothNormals");
  engine_geometry_smooth_normals(
      reinterpret_cast<float *>(v.data(rt)), v.size(rt) / (11 * sizeof(float)),
      reinterpret_cast<const uint32_t *>(i.data(rt)), i.size(rt) / sizeof(uint32_t));
}

jsi::Object NayanEngineModule::geometrySolid(jsi::Runtime &rt, jsi::String recipe) {
  const auto json = recipe.utf8(rt);
  return geometryResult(rt, engine_geometry_solid(reinterpret_cast<const uint8_t *>(json.data()), json.size()));
}

jsi::Object NayanEngineModule::geometryOptimize(jsi::Runtime &rt, jsi::Object vertices, jsi::Object indices, double ratio, double error, bool lockBorders) {
  auto v = fileData(rt, vertices, "geometryOptimize");
  auto i = fileData(rt, indices, "geometryOptimize");
  if (v.size(rt) % (11 * sizeof(float)) != 0 || i.size(rt) % (3 * sizeof(uint32_t)) != 0) {
    throw jsi::JSError(rt, "NayanEngine.geometryOptimize: incomplete vertices or triangles");
  }
  return geometryResult(rt, engine_geometry_optimize(reinterpret_cast<const float *>(v.data(rt)), v.size(rt) / sizeof(float),
      reinterpret_cast<const uint32_t *>(i.data(rt)), i.size(rt) / sizeof(uint32_t), static_cast<float>(ratio), static_cast<float>(error), lockBorders ? 1 : 0));
}

void NayanEngineModule::geometryFaceOutward(jsi::Runtime &rt, jsi::Object vertices, jsi::Object indices) {
  jsi::ArrayBuffer v = fileData(rt, vertices, "geometryFaceOutward");
  jsi::ArrayBuffer i = fileData(rt, indices, "geometryFaceOutward");
  engine_geometry_face_outward(
      reinterpret_cast<const float *>(v.data(rt)), v.size(rt) / (11 * sizeof(float)),
      reinterpret_cast<uint32_t *>(i.data(rt)), i.size(rt) / sizeof(uint32_t));
}

void NayanEngineModule::geometryPlace(
    jsi::Runtime &rt,
    jsi::Object vertices,
    jsi::Object indices,
    jsi::Array placement,
    double first,
    jsi::Object outVertices,
    double vertexOffset,
    jsi::Object outIndices,
    double indexOffset) {
  jsi::ArrayBuffer v = fileData(rt, vertices, "geometryPlace");
  jsi::ArrayBuffer i = fileData(rt, indices, "geometryPlace");
  jsi::ArrayBuffer ov = fileData(rt, outVertices, "geometryPlace");
  jsi::ArrayBuffer oi = fileData(rt, outIndices, "geometryPlace");
  if (placement.size(rt) < 13) {
    throw jsi::JSError(rt, "NayanEngine.geometryPlace: placement needs 13 numbers");
  }
  float p[13];
  for (size_t k = 0; k < 13; k++) p[k] = static_cast<float>(placement.getValueAtIndex(rt, k).asNumber());
  size_t vertexCount = v.size(rt) / (11 * sizeof(float));
  size_t indexCount = i.size(rt) / sizeof(uint32_t);
  size_t vo = vertexOffset > 0 ? static_cast<size_t>(vertexOffset) : 0; // floats
  size_t io = indexOffset > 0 ? static_cast<size_t>(indexOffset) : 0;
  if (vo + vertexCount * 11 > ov.size(rt) / sizeof(float) || io + indexCount > oi.size(rt) / sizeof(uint32_t)) {
    throw jsi::JSError(rt, "NayanEngine.geometryPlace: the output is too small");
  }
  engine_geometry_place(
      reinterpret_cast<const float *>(v.data(rt)), vertexCount, reinterpret_cast<const uint32_t *>(i.data(rt)), indexCount, p,
      first > 0 ? static_cast<uint32_t>(first) : 0, reinterpret_cast<float *>(ov.data(rt)) + vo, reinterpret_cast<uint32_t *>(oi.data(rt)) + io);
}

double NayanEngineModule::textureLoad(jsi::Runtime &rt, jsi::Object data) {
  jsi::ArrayBuffer buffer = fileData(rt, data, "textureLoad");
  return engine_texture_load(buffer.data(rt), buffer.size(rt)); // decoded and copied
}

jsi::Value NayanEngineModule::textureLoadAsync(jsi::Runtime &rt, jsi::Object data) {
  auto bytes = std::make_shared<std::vector<uint8_t>>(copyBytes(rt, data, "textureLoadAsync"));
  return runInBackground(rt, jsInvoker_, [bytes]() { return static_cast<double>(engine_texture_load(bytes->data(), bytes->size())); });
}

jsi::Value NayanEngineModule::textureLoadSizedAsync(jsi::Runtime &rt, jsi::Object data, double width, double height, double fit) {
  auto bytes = std::make_shared<std::vector<uint8_t>>(copyBytes(rt, data, "textureLoadSizedAsync"));
  auto w = static_cast<uint32_t>(std::clamp(width, 0.0, 4096.0));
  auto h = static_cast<uint32_t>(std::clamp(height, 0.0, 4096.0));
  auto mode = static_cast<uint32_t>(std::clamp(fit, 0.0, 3.0));
  return runInBackground(rt, jsInvoker_, [bytes, w, h, mode]() { return static_cast<double>(engine_texture_load_sized(bytes->data(), bytes->size(), w, h, mode)); });
}

jsi::Object NayanEngineModule::texturePixels(jsi::Runtime &rt, double texture) {
  uint32_t size[2] = {0, 0};
  engine_texture_size(id(texture), size);
  return external(rt, nullptr, engine_texture_pixels(id(texture)), static_cast<size_t>(size[0]) * size[1] * 4);
}

jsi::Array NayanEngineModule::textureSize(jsi::Runtime &rt, double texture) {
  uint32_t size[2] = {0, 0};
  engine_texture_size(id(texture), size);
  return jsi::Array::createWithElements(rt, static_cast<double>(size[0]), static_cast<double>(size[1]));
}

double NayanEngineModule::fontLoad(jsi::Runtime &rt, jsi::Object data, double depth, jsi::String chars, double weight) {
  jsi::ArrayBuffer buffer = fileData(rt, data, "fontLoad");
  std::string utf8 = chars.utf8(rt);
  return engine_font_load(buffer.data(rt), buffer.size(rt), static_cast<float>(depth), utf8.data(), utf8.size(), static_cast<float>(weight));
}

jsi::Value NayanEngineModule::fontLoadAsync(jsi::Runtime &rt, jsi::Object data, double depth, jsi::String chars, double weight) {
  auto bytes = std::make_shared<std::vector<uint8_t>>(copyBytes(rt, data, "fontLoadAsync"));
  auto utf8 = std::make_shared<std::string>(chars.utf8(rt));
  return runInBackground(rt, jsInvoker_, [bytes, utf8, depth, weight]() {
    return static_cast<double>(
        engine_font_load(bytes->data(), bytes->size(), static_cast<float>(depth), utf8->data(), utf8->size(), static_cast<float>(weight)));
  });
}

jsi::Array NayanEngineModule::fontGlyphs(jsi::Runtime &rt, double font) {
  uint32_t f = id(font);
  const float *glyphs = engine_font_glyphs(f);
  size_t n = glyphs == nullptr ? 0 : engine_font_glyph_floats(f);
  jsi::Array out(rt, n + 1);
  for (size_t i = 0; i < n; i++) {
    out.setValueAtIndex(rt, i, static_cast<double>(glyphs[i]));
  }
  out.setValueAtIndex(rt, n, static_cast<double>(engine_font_cap_height(f)));
  return out;
}

jsi::String NayanEngineModule::loadError(jsi::Runtime &rt) {
  // Sized to the full message: truncating could split a UTF-8 sequence.
  std::string message(engine_load_error(nullptr, 0) + 1, '\0');
  message.resize(engine_load_error(message.data(), message.size()));
  return jsi::String::createFromUtf8(rt, message);
}

void NayanEngineModule::generateBuiltinMeshes(jsi::Runtime &) {
  engine_generate_builtin_meshes();
}

void NayanEngineModule::renderWarmUp(jsi::Runtime &) {
  engine_render_warm_up();
}

jsi::Object NayanEngineModule::renderMeshVertices(jsi::Runtime &rt, double mesh) {
  uint32_t m = id(mesh);
  size_t vertexCount = engine_render_mesh_vertex_count(m);
  size_t floats = vertexCount * 11;
  auto buf = std::make_shared<OwnedBuffer>(floats * sizeof(float));
  engine_render_mesh_vertices(m, reinterpret_cast<float *>(buf->data()), floats);
  return jsi::Object(jsi::ArrayBuffer(rt, std::move(buf)));
}

jsi::Object NayanEngineModule::renderMeshIndices(jsi::Runtime &rt, double mesh) {
  uint32_t m = id(mesh);
  size_t indexCount = engine_render_mesh_index_count(m);
  auto buf = std::make_shared<OwnedBuffer>(indexCount * sizeof(uint32_t));
  engine_render_mesh_indices(m, reinterpret_cast<uint32_t *>(buf->data()), indexCount);
  return jsi::Object(jsi::ArrayBuffer(rt, std::move(buf)));
}

void NayanEngineModule::renderMesh(
    jsi::Runtime &rt, double mesh, jsi::Object vertices, jsi::Object indices, double texture, double shine) {
  jsi::ArrayBuffer v = fileData(rt, vertices, "renderMesh");
  jsi::ArrayBuffer i = fileData(rt, indices, "renderMesh");
  engine_render_mesh(
      id(mesh), reinterpret_cast<const float *>(v.data(rt)), v.size(rt) / (11 * sizeof(float)),
      reinterpret_cast<const uint32_t *>(i.data(rt)), i.size(rt) / sizeof(uint32_t),
      texture >= 0 ? static_cast<int32_t>(texture) : -1, static_cast<float>(shine)); // copied
}

double NayanEngineModule::renderFrame(
    jsi::Runtime &rt,
    double surface,
    jsi::Object frame,
    jsi::Object matrices,
    jsi::Object colors,
    jsi::Object regions,
    jsi::Object ranges,
    double count,
    jsi::Object viewProj,
    double world) {
  jsi::ArrayBuffer f = fileData(rt, frame, "renderFrame");
  jsi::ArrayBuffer m = fileData(rt, matrices, "renderFrame");
  jsi::ArrayBuffer c = fileData(rt, colors, "renderFrame");
  jsi::ArrayBuffer g = fileData(rt, regions, "renderFrame");
  jsi::ArrayBuffer r = fileData(rt, ranges, "renderFrame");
  jsi::ArrayBuffer out = fileData(rt, viewProj, "renderFrame");
  // The instance count every buffer has room for.
  size_t capacity = std::min({m.size(rt) / (16 * sizeof(float)), c.size(rt) / (4 * sizeof(float)), g.size(rt) / (4 * sizeof(float))});
  size_t n = count > 0 ? std::min(static_cast<size_t>(count), capacity) : 0;
  return engine_render_frame(
      static_cast<int32_t>(surface), reinterpret_cast<const double *>(f.data(rt)), f.size(rt) / sizeof(double),
      reinterpret_cast<const float *>(m.data(rt)), reinterpret_cast<const float *>(c.data(rt)),
      reinterpret_cast<const float *>(g.data(rt)), capacity, reinterpret_cast<const uint32_t *>(r.data(rt)),
      r.size(rt) / sizeof(uint32_t), n, out.size(rt) >= 16 * sizeof(float) ? reinterpret_cast<float *>(out.data(rt)) : nullptr, find(world));
}

double NayanEngineModule::publishFrame(
    jsi::Runtime &rt,
    double surface,
    jsi::Object frame,
    jsi::Object matrices,
    jsi::Object colors,
    jsi::Object regions,
    jsi::Object ranges,
    double count,
    jsi::Object viewProj,
    double world) {
  jsi::ArrayBuffer f = fileData(rt, frame, "publishFrame");
  jsi::ArrayBuffer m = fileData(rt, matrices, "publishFrame");
  jsi::ArrayBuffer c = fileData(rt, colors, "publishFrame");
  jsi::ArrayBuffer g = fileData(rt, regions, "publishFrame");
  jsi::ArrayBuffer r = fileData(rt, ranges, "publishFrame");
  jsi::ArrayBuffer out = fileData(rt, viewProj, "publishFrame");
  size_t capacity = std::min({m.size(rt) / (16 * sizeof(float)), c.size(rt) / (4 * sizeof(float)), g.size(rt) / (4 * sizeof(float))});
  size_t n = count > 0 ? std::min(static_cast<size_t>(count), capacity) : 0;
  return engine_render_publish(
      static_cast<int32_t>(surface), reinterpret_cast<const double *>(f.data(rt)), f.size(rt) / sizeof(double),
      reinterpret_cast<const float *>(m.data(rt)), reinterpret_cast<const float *>(c.data(rt)),
      reinterpret_cast<const float *>(g.data(rt)), capacity, reinterpret_cast<const uint32_t *>(r.data(rt)),
      r.size(rt) / sizeof(uint32_t), n, out.size(rt) >= 16 * sizeof(float) ? reinterpret_cast<float *>(out.data(rt)) : nullptr, find(world));
}

jsi::Array NayanEngineModule::renderStats(jsi::Runtime &rt, double surface) {
  double out[2] = {0, 0};
  engine_render_stats(static_cast<int32_t>(surface), out);
  return jsi::Array::createWithElements(rt, out[0], out[1]);
}

void NayanEngineModule::renderOverlay(
    jsi::Runtime &rt,
    double surface,
    jsi::Object matrices,
    jsi::Object colors,
    jsi::Object regions,
    jsi::Object ranges,
    double count,
    double width,
    double height) {
  jsi::ArrayBuffer m = fileData(rt, matrices, "renderOverlay");
  jsi::ArrayBuffer c = fileData(rt, colors, "renderOverlay");
  jsi::ArrayBuffer g = fileData(rt, regions, "renderOverlay");
  jsi::ArrayBuffer r = fileData(rt, ranges, "renderOverlay");
  size_t capacity = std::min({m.size(rt) / (16 * sizeof(float)), c.size(rt) / (4 * sizeof(float)), g.size(rt) / (4 * sizeof(float))});
  size_t n = count > 0 ? std::min(static_cast<size_t>(count), capacity) : 0;
  engine_render_overlay(
      static_cast<int32_t>(surface), reinterpret_cast<const float *>(m.data(rt)), reinterpret_cast<const float *>(c.data(rt)),
      reinterpret_cast<const float *>(g.data(rt)), capacity, reinterpret_cast<const uint32_t *>(r.data(rt)), r.size(rt) / sizeof(uint32_t), n,
      static_cast<float>(width), static_cast<float>(height));
}

void NayanEngineModule::renderBackdrop(
    jsi::Runtime &rt, double surface, jsi::Object matrices, jsi::Object colors, jsi::Object regions, jsi::Object ranges, double count) {
  jsi::ArrayBuffer m = fileData(rt, matrices, "renderBackdrop");
  jsi::ArrayBuffer c = fileData(rt, colors, "renderBackdrop");
  jsi::ArrayBuffer g = fileData(rt, regions, "renderBackdrop");
  jsi::ArrayBuffer r = fileData(rt, ranges, "renderBackdrop");
  size_t capacity = std::min({m.size(rt) / (16 * sizeof(float)), c.size(rt) / (4 * sizeof(float)), g.size(rt) / (4 * sizeof(float))});
  size_t n = count > 0 ? std::min(static_cast<size_t>(count), capacity) : 0;
  engine_render_backdrop(
      static_cast<int32_t>(surface), reinterpret_cast<const float *>(m.data(rt)), reinterpret_cast<const float *>(c.data(rt)),
      reinterpret_cast<const float *>(g.data(rt)), capacity, reinterpret_cast<const uint32_t *>(r.data(rt)), r.size(rt) / sizeof(uint32_t), n);
}

jsi::String NayanEngineModule::renderError(jsi::Runtime &rt) {
  std::string message(engine_render_error(nullptr, 0) + 1, '\0');
  message.resize(engine_render_error(message.data(), message.size()));
  return jsi::String::createFromUtf8(rt, message);
}

jsi::String NayanEngineModule::renderBackend(jsi::Runtime &rt) {
  char name[16] = {0};
  engine_render_backend(name, sizeof(name));
  return jsi::String::createFromAscii(rt, name);
}

double NayanEngineModule::componentCreate(jsi::Runtime &) {
  const int document = engine_component_create();
  if (document >= 0) drawings_.insert(document);
  return document;
}

double NayanEngineModule::drawingCreate(jsi::Runtime &, double width, double height, double ratio) {
  const int document = engine_drawing_create(width, height, ratio);
  if (document >= 0) drawings_.insert(document);
  return document;
}
jsi::String NayanEngineModule::drawingCommand(jsi::Runtime &rt, double document, jsi::String command) {
  if (!(document >= 0 && document <= INT32_MAX) || document != static_cast<int32_t>(document)) throw jsi::JSError(rt, "Invalid drawing identifier");
  const auto text = command.utf8(rt);
  std::unique_ptr<char, decltype(&engine_drawing_result_free)> result(
      engine_drawing_command(static_cast<int32_t>(document), reinterpret_cast<const uint8_t *>(text.data()), text.size()), engine_drawing_result_free);
  if (!result) throw jsi::JSError(rt, "Drawing command failed");
  return jsi::String::createFromUtf8(rt, result.get());
}
void NayanEngineModule::drawingDestroy(jsi::Runtime &, double document) {
  if (!(document >= 0 && document <= INT32_MAX) || document != static_cast<int32_t>(document)) return;
  engine_drawing_destroy(static_cast<int32_t>(document));
  drawings_.erase(static_cast<int>(document));
}

double NayanEngineModule::audioLoad(jsi::Runtime &rt, jsi::Object data) {
  jsi::ArrayBuffer buffer = fileData(rt, data, "audioLoad");
  return engine_audio_load_wav(buffer.data(rt), buffer.size(rt)); // copied by the core
}

jsi::Value NayanEngineModule::audioLoadAsync(jsi::Runtime &rt, jsi::Object data) {
  auto bytes = std::make_shared<std::vector<uint8_t>>(copyBytes(rt, data, "audioLoadAsync"));
  return runInBackground(rt, jsInvoker_, [bytes]() { return static_cast<double>(engine_audio_load_wav(bytes->data(), bytes->size())); });
}

double NayanEngineModule::audioPlay(jsi::Runtime &, double sound, double volume, double pan, double pitch, bool loop) {
  return static_cast<double>(engine_audio_play(id(sound), volume, pan, pitch, loop ? 1 : 0));
}

void NayanEngineModule::audioStop(jsi::Runtime &, double voice) {
  if (voice >= 1 && voice <= 9007199254740992.0) {
    engine_audio_stop(static_cast<uint64_t>(voice));
  }
}

bool NayanEngineModule::audioControl(jsi::Runtime &, double voice, double action, double value, double pan) {
  if (!(voice >= 0 && voice <= 9007199254740991.0) || !(action >= 0 && action <= 7)) return false;
  if (std::floor(voice) != voice || std::floor(action) != action) return false;
  return engine_audio_control(static_cast<uint64_t>(voice), static_cast<uint32_t>(action), value, pan) != 0;
}

jsi::Object NayanEngineModule::audioVoiceStatus(jsi::Runtime &rt, double voice) {
  float status[3];
  const bool valid = voice > 0 && voice <= 9007199254740991.0 && std::floor(voice) == voice;
  const bool found = valid && engine_audio_voice_status(static_cast<uint64_t>(voice), status);
  auto buffer = std::make_shared<OwnedBuffer>(found ? sizeof(status) : 0);
  if (found) std::memcpy(buffer->data(), status, sizeof(status));
  return jsi::ArrayBuffer(rt, buffer);
}

jsi::Object NayanEngineModule::audioEncodeWav(jsi::Runtime &rt, double sound) {
  const auto key = id(sound);
  const size_t size = engine_audio_encode_wav(key, nullptr, 0);
  auto buffer = std::make_shared<OwnedBuffer>(size);
  if (size && engine_audio_encode_wav(key, buffer->data(), size) != size) {
    throw jsi::JSError(rt, "Could not export the audio sound as WAV");
  }
  return jsi::ArrayBuffer(rt, buffer);
}

void NayanEngineModule::audioSetVolume(jsi::Runtime &, double volume) {
  engine_audio_set_volume(volume);
}

void NayanEngineModule::audioSetMuted(jsi::Runtime &, bool muted) {
  engine_audio_set_muted(muted ? 1 : 0);
}

bool NayanEngineModule::audioIsRunning(jsi::Runtime &) {
  return engine_audio_is_running() != 0;
}

void NayanEngineModule::audioRelease(jsi::Runtime &, double sound) {
  engine_audio_release(id(sound));
}

double NayanEngineModule::audioDuration(jsi::Runtime &, double sound) {
  return engine_audio_duration(id(sound));
}

jsi::Object NayanEngineModule::audioLevels(jsi::Runtime &rt, double sound, double perSecond) {
  const uint32_t s = id(sound);
  const size_t count = engine_audio_levels(s, static_cast<float>(perSecond), nullptr, 0);
  auto buffer = std::make_shared<OwnedBuffer>(count * sizeof(float));
  engine_audio_levels(s, static_cast<float>(perSecond), reinterpret_cast<float *>(buffer->data()), count);
  return jsi::ArrayBuffer(rt, buffer);
}

double NayanEngineModule::audioShift(jsi::Runtime &, double sound, double pitch, double tempo, double loudness, bool clean) {
  return engine_audio_shift(id(sound), static_cast<float>(pitch), static_cast<float>(tempo), static_cast<float>(loudness), clean ? 1 : 0);
}

namespace {
// A pending microphone prompt: the promise it resolves, owned until the answer arrives.
using MicPromise = AsyncPromise<bool>;

#ifndef __ANDROID__
void micAnswered(void *context, int32_t granted) {
  std::unique_ptr<std::shared_ptr<MicPromise>> promise(static_cast<std::shared_ptr<MicPromise> *>(context));
  (*promise)->resolve(granted != 0);
}
#endif

#ifdef __ANDROID__
facebook::jni::alias_ref<facebook::jni::JClass> microphoneClass() {
  static auto cls = facebook::jni::findClassStatic("com/nayanui/engine/EngineMicrophone");
  return cls;
}
#endif
} // namespace

double NayanEngineModule::micPermission(jsi::Runtime &) {
#ifdef __ANDROID__
  if (engine_audio_mic_permission() == -2) return -2;
  try {
    static const auto permission = microphoneClass()->getStaticMethod<jint()>("permission");
    return permission(microphoneClass());
  } catch (...) {
    return 0;
  }
#else
  return engine_audio_mic_permission();
#endif
}

jsi::Value NayanEngineModule::micRequestPermission(jsi::Runtime &rt) {
  auto promise = std::make_shared<MicPromise>(rt, jsInvoker_);
  jsi::Value result(rt, promise->get(rt));
#ifdef __ANDROID__
  if (engine_audio_mic_permission() == -2) {
    promise->resolve(false);
    return result;
  }
  // Java answers through nativePermissionResult(token, granted) below, which frees the token.
  auto *token = new std::shared_ptr<MicPromise>(promise);
  try {
    static const auto request = microphoneClass()->getStaticMethod<void(jlong)>("request");
    request(microphoneClass(), static_cast<jlong>(reinterpret_cast<intptr_t>(token)));
  } catch (...) {
    delete token;
    promise->resolve(false);
  }
#else
  engine_audio_mic_request(micAnswered, new std::shared_ptr<MicPromise>(promise));
#endif
  return result;
}

bool NayanEngineModule::micStart(jsi::Runtime &, double maxSeconds) {
  return engine_audio_mic_start(static_cast<float>(maxSeconds)) != 0;
}

void NayanEngineModule::micStop(jsi::Runtime &) {
  engine_audio_mic_stop();
}

bool NayanEngineModule::micPause(jsi::Runtime &, bool paused) {
  return engine_audio_mic_pause(paused ? 1 : 0) != 0;
}

double NayanEngineModule::micState(jsi::Runtime &) {
  return engine_audio_mic_state();
}

double NayanEngineModule::micLevel(jsi::Runtime &) {
  return engine_audio_mic_level();
}

double NayanEngineModule::micHeld(jsi::Runtime &) {
  return engine_audio_mic_held();
}

double NayanEngineModule::micTake(jsi::Runtime &, double seconds, double skipEnd) {
  return engine_audio_mic_take(static_cast<float>(seconds), static_cast<float>(skipEnd));
}

bool NayanEngineModule::hapticsSupported(jsi::Runtime &) {
  return engine_haptics_supported() != 0;
}

void NayanEngineModule::hapticsPlay(jsi::Runtime &rt, jsi::Array taps, bool throttle) {
  size_t n = taps.size(rt) / 3 * 3;
  std::vector<float> values(n);
  for (size_t i = 0; i < n; i++) {
    jsi::Value v = taps.getValueAtIndex(rt, i);
    values[i] = v.isNumber() ? static_cast<float>(v.asNumber()) : 0.0f;
  }
  engine_haptics_play(values.data(), static_cast<uint32_t>(n / 3), throttle ? 1 : 0);
}

// Procedural worlds. Handles are the core's own (u32, 0 = none); no JSI object owns them.

namespace {

uint32_t handle(double v) {
  return (v >= 0 && v <= static_cast<double>(UINT32_MAX)) ? static_cast<uint32_t>(v) : 0;
}

const uint8_t *utf8(const std::string &text) {
  return reinterpret_cast<const uint8_t *>(text.data());
}

/** A core function's f64 output (two calls: size, then copy) as an owned ArrayBuffer. */
jsi::Object doubles(jsi::Runtime &rt, const std::function<size_t(double *, size_t)> &read) {
  const size_t count = read(nullptr, 0);
  auto out = std::make_shared<OwnedBuffer>(count * sizeof(double));
  if (count > 0 && read(reinterpret_cast<double *>(out->data()), count) != count) {
    throw jsi::JSError(rt, "NayanEngine worldgen: output changed while reading");
  }
  return jsi::ArrayBuffer(rt, std::move(out));
}

std::string text(const std::function<size_t(uint8_t *, size_t)> &read) {
  std::string out(read(nullptr, 0), '\0');
  if (!out.empty()) read(reinterpret_cast<uint8_t *>(out.data()), out.size() + 1);
  return out;
}

} // namespace

double NayanEngineModule::worldgenBuild(jsi::Runtime &rt, jsi::String recipe, jsi::String key, bool prepareTerrain) {
  const auto r = recipe.utf8(rt), k = key.utf8(rt);
  return engine_worldgen_build(utf8(r), r.size(), utf8(k), k.size(), prepareTerrain ? 1 : 0);
}

jsi::Value NayanEngineModule::worldgenBuildAsync(jsi::Runtime &rt, jsi::String recipe, jsi::String key, bool prepareTerrain) {
  auto r = std::make_shared<std::string>(recipe.utf8(rt));
  auto k = std::make_shared<std::string>(key.utf8(rt));
  return runInBackground(rt, jsInvoker_, [r, k, prepareTerrain]() {
    return static_cast<double>(engine_worldgen_build(utf8(*r), r->size(), utf8(*k), k->size(), prepareTerrain ? 1 : 0));
  });
}

jsi::String NayanEngineModule::worldgenError(jsi::Runtime &rt) {
  return jsi::String::createFromUtf8(rt, text([](uint8_t *out, size_t cap) { return engine_worldgen_error(out, cap); }));
}

bool NayanEngineModule::worldgenKept(jsi::Runtime &rt, jsi::String key) {
  const auto k = key.utf8(rt);
  return engine_worldgen_kept(utf8(k), k.size()) != 0;
}

void NayanEngineModule::worldgenFree(jsi::Runtime &, double world) {
  engine_worldgen_free(handle(world));
}

jsi::String NayanEngineModule::worldgenInfo(jsi::Runtime &rt, double world) {
  const uint32_t w = handle(world);
  return jsi::String::createFromUtf8(rt, text([w](uint8_t *out, size_t cap) { return engine_worldgen_info(w, out, cap); }));
}

jsi::Object NayanEngineModule::worldgenLayer(jsi::Runtime &rt, double world, jsi::String name) {
  const uint32_t w = handle(world);
  const auto n = name.utf8(rt);
  return doubles(rt, [w, &n](double *out, size_t cap) { return engine_worldgen_layer(w, utf8(n), n.size(), out, cap); });
}

jsi::Object NayanEngineModule::worldgenReachable(jsi::Runtime &rt, double world) {
  const uint32_t w = handle(world);
  return doubles(rt, [w](double *out, size_t cap) { return engine_worldgen_reachable(w, out, cap); });
}

jsi::Object NayanEngineModule::worldgenOverview(jsi::Runtime &rt, double world) {
  const uint32_t w = handle(world);
  const size_t count = engine_worldgen_overview(w, nullptr, 0);
  auto out = std::make_shared<OwnedBuffer>(count);
  if (count > 0) engine_worldgen_overview(w, out->data(), count);
  return jsi::ArrayBuffer(rt, std::move(out));
}

bool NayanEngineModule::worldgenPick(jsi::Runtime &, double world, double run) {
  return engine_worldgen_pick(handle(world), handle(run)) != 0;
}

jsi::Object NayanEngineModule::worldgenTerrain(jsi::Runtime &rt, double world, double material) {
  return geometryResult(rt, engine_worldgen_terrain(handle(world), handle(material)));
}

jsi::Object NayanEngineModule::worldgenMesh(jsi::Runtime &rt, jsi::String recipe) {
  const auto r = recipe.utf8(rt);
  return geometryResult(rt, engine_worldgen_mesh(utf8(r), r.size()));
}

bool NayanEngineModule::worldgenPaint(jsi::Runtime &rt, jsi::Object vertices, jsi::String recipe) {
  jsi::ArrayBuffer v = fileData(rt, vertices, "worldgenPaint");
  if (v.size(rt) % (11 * sizeof(float)) != 0) {
    throw jsi::JSError(rt, "NayanEngine.worldgenPaint: incomplete vertices");
  }
  const auto r = recipe.utf8(rt);
  return engine_worldgen_paint(reinterpret_cast<float *>(v.data(rt)), v.size(rt) / (11 * sizeof(float)), utf8(r), r.size()) != 0;
}

double NayanEngineModule::worldgenGround(jsi::Runtime &, double world, double x, double z) {
  return engine_worldgen_ground(handle(world), x, z);
}

double NayanEngineModule::worldgenSurface(jsi::Runtime &, double world, double x, double z) {
  return engine_worldgen_surface(handle(world), x, z);
}

double NayanEngineModule::worldgenPlatform(jsi::Runtime &, double world, double x, double z) {
  return engine_worldgen_platform(handle(world), x, z);
}

bool NayanEngineModule::worldgenWalkable(jsi::Runtime &, double world, double x, double z, double radius) {
  return engine_worldgen_walkable(handle(world), x, z, radius) != 0;
}

double NayanEngineModule::worldgenClearance(jsi::Runtime &, double world, double x, double z, double radius) {
  return engine_worldgen_clearance(handle(world), x, z, radius);
}

double NayanEngineModule::worldgenSolidClearance(jsi::Runtime &, double world, double x, double z, double radius, double bottom, double top) {
  return engine_worldgen_solid_clearance(handle(world), x, z, radius, bottom, top);
}

double NayanEngineModule::worldgenFieldIndex(jsi::Runtime &rt, double world, jsi::String name) {
  const auto n = name.utf8(rt);
  return engine_worldgen_field_index(handle(world), utf8(n), n.size());
}

double NayanEngineModule::worldgenField(jsi::Runtime &, double world, double field, double x, double z) {
  return engine_worldgen_field(handle(world), handle(field), x, z);
}

jsi::Array NayanEngineModule::worldgenTilt(jsi::Runtime &rt, double world, double x, double z, double yaw) {
  double q[4] = {0, 0, 0, 1};
  engine_worldgen_tilt(handle(world), x, z, yaw, q);
  return jsi::Array::createWithElements(rt, q[0], q[1], q[2], q[3]);
}

bool NayanEngineModule::worldgenSight(jsi::Runtime &, double world, double ax, double az, double bx, double bz, double radius, double step, double rise) {
  return engine_worldgen_sight(handle(world), ax, az, bx, bz, radius, step, rise) != 0;
}

jsi::Array NayanEngineModule::worldgenMove(jsi::Runtime &rt, double world, double x, double z, double dx, double dz, double radius, jsi::Object bodies) {
  auto list = fileData(rt, bodies, "worldgenMove");
  double point[2] = {x, z};
  engine_worldgen_move(handle(world), point, dx, dz, radius, reinterpret_cast<const double *>(list.data(rt)), list.size(rt) / (3 * sizeof(double)));
  return jsi::Array::createWithElements(rt, point[0], point[1]);
}

} // namespace facebook::react

#ifdef __ANDROID__
#include <android/native_window_jni.h>

extern "C" JNIEXPORT jlong JNICALL Java_com_nayanui_engine_EngineDrawerView_nativeCreate(JNIEnv *, jclass) { return reinterpret_cast<jlong>(engine_drawer_new()); }
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineDrawerView_nativeFree(JNIEnv *, jclass, jlong motion) { engine_drawer_free(reinterpret_cast<EngineDrawer *>(motion)); }
extern "C" JNIEXPORT jdouble JNICALL Java_com_nayanui_engine_EngineDrawerView_nativeConfigure(JNIEnv *, jclass, jlong motion, jfloat width, jfloat viewport, jfloat edge, jint flags) { return engine_drawer_configure(reinterpret_cast<EngineDrawer *>(motion),width,viewport,edge,flags); }
extern "C" JNIEXPORT jdouble JNICALL Java_com_nayanui_engine_EngineDrawerView_nativeInput(JNIEnv *, jclass, jlong motion, jint action, jfloat x, jfloat y, jdouble time) { return engine_drawer_input(reinterpret_cast<EngineDrawer *>(motion),action,x,y,time); }

#include <mutex>
#include <unordered_map>

extern "C" JNIEXPORT jboolean JNICALL
Java_com_nayanui_engine_EngineBlurView_nativeBlur(JNIEnv *env, jclass, jobject buffer, jint width, jint height, jint radius) {
  auto *pixels = static_cast<uint8_t *>(env->GetDirectBufferAddress(buffer));
  const auto length = env->GetDirectBufferCapacity(buffer);
  if (pixels == nullptr || length <= 0 || width <= 0 || height <= 0 || radius < 0) return JNI_FALSE;
  return engine_blur_rgba(pixels, static_cast<size_t>(length), static_cast<uint32_t>(width), static_cast<uint32_t>(height), static_cast<uint32_t>(radius)) != 0;
}

// JNI for com.nayanui.engine.EngineSurfaceView: hands its Surface to the renderer. Called on the UI
// thread; the renderer draws from the JS thread and serializes both with its own lock.
namespace {
std::mutex windowsMutex;
std::unordered_map<int, ANativeWindow *> windows;

void releaseWindow(int surface) {
  engine_render_detach(surface); // the renderer stops using the window before it's released
  std::lock_guard<std::mutex> lock(windowsMutex);
  auto it = windows.find(surface);
  if (it != windows.end()) {
    ANativeWindow_release(it->second);
    windows.erase(it);
  }
}
} // namespace

extern "C" JNIEXPORT jboolean JNICALL
Java_com_nayanui_engine_EngineSurfaceView_nativeAttach(JNIEnv *env, jclass, jint surface, jobject javaSurface, jint width, jint height) {
  ANativeWindow *window = ANativeWindow_fromSurface(env, javaSurface);
  if (window == nullptr) {
    return JNI_FALSE;
  }
  {
    std::lock_guard<std::mutex> lock(windowsMutex);
    auto it = windows.find(surface);
    if (it != windows.end() && it->second == window) {
      ANativeWindow_release(window); // same window: just a resize
      window = it->second;
    } else if (it != windows.end()) {
      engine_render_detach(surface);
      ANativeWindow_release(it->second);
      it->second = window;
    } else {
      windows[surface] = window;
    }
  }
  return engine_render_attach(surface, window, static_cast<uint32_t>(width), static_cast<uint32_t>(height)) == 1 ? JNI_TRUE : JNI_FALSE;
}

/** EngineMicrophone's answer to micRequestPermission: resolves the promise and frees its token. */
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineMicrophone_nativePermissionResult(JNIEnv *, jclass, jlong token, jboolean granted) {
  std::unique_ptr<std::shared_ptr<facebook::react::AsyncPromise<bool>>> promise(
      reinterpret_cast<std::shared_ptr<facebook::react::AsyncPromise<bool>> *>(static_cast<intptr_t>(token)));
  if (promise) (*promise)->resolve(granted == JNI_TRUE);
}

extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineSurfaceView_nativeDetach(JNIEnv *, jclass, jint surface) {
  releaseWindow(surface);
}

/** Called by EngineSurfaceView's Choreographer once per display refresh while it's attached and visible. */
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineSurfaceView_nativeVsync(JNIEnv *, jclass, jint surface, jlong frameTimeNanos) {
  facebook::react::deliverFrame(surface, static_cast<double>(frameTimeNanos) / 1e6);
}
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineSurfaceView_nativeDrawingPresent(JNIEnv *, jclass, jint drawing, jint surface, jfloat width, jfloat height, jint color) {
  engine_drawing_present(drawing, surface, width, height, static_cast<uint32_t>(color));
}
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineSurfaceView_nativeDrawingTouch(JNIEnv *, jclass, jint drawing, jint phase, jfloat x, jfloat y, jfloat pressure) {
  engine_drawing_touch(drawing, phase, x, y, pressure);
}
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineSurfaceView_nativeDrawingTransform(JNIEnv *, jclass, jint drawing, jfloat dx, jfloat dy, jfloat scale) {
  engine_drawing_transform(drawing, dx, dy, scale);
}
extern "C" JNIEXPORT void JNICALL Java_com_nayanui_engine_EngineSurfaceView_nativeDrawingInvalidate(JNIEnv *, jclass, jint drawing) {
  engine_drawing_invalidate(drawing);
}
#endif

#ifdef __ANDROID__
extern "C" JNIEXPORT jbyteArray JNICALL Java_com_nayanui_engine_EngineSurfaceView_nativeDrawingEvent(JNIEnv *env, jclass, jint drawing) {
  char *event = engine_drawing_take_event(drawing);
  if (event == nullptr) return nullptr;
  const size_t length = std::strlen(event);
  jbyteArray result = env->NewByteArray(static_cast<jsize>(length));
  if (result != nullptr) env->SetByteArrayRegion(result, 0, static_cast<jsize>(length), reinterpret_cast<const jbyte *>(event));
  engine_drawing_result_free(event);
  return result;
}
#endif

namespace {
void speechAnswered(void *context, const uint8_t *data, size_t len) {
  using Promise = facebook::react::AsyncPromise<std::string>;
  std::unique_ptr<std::shared_ptr<Promise>> promise(static_cast<std::shared_ptr<Promise> *>(context));
  (*promise)->resolve(std::string(reinterpret_cast<const char *>(data), len));
}
}
namespace facebook::react {
jsi::Value NayanEngineModule::speechRequest(jsi::Runtime &rt, jsi::String command) {
  auto promise = std::make_shared<AsyncPromise<std::string>>(rt, jsInvoker_);
  jsi::Value result(rt, promise->get(rt));
  const std::string text = command.utf8(rt);
  engine_speech_request(reinterpret_cast<const uint8_t *>(text.data()), text.size(), speechAnswered,
      new std::shared_ptr<AsyncPromise<std::string>>(promise));
  return result;
}
}

#ifdef __ANDROID__
extern "C" JNIEXPORT jstring JNICALL Java_com_nayanui_engine_EngineSafeAreaView_nativeRequest(JNIEnv *env, jclass, jstring command) {
  const char *text=env->GetStringUTFChars(command,nullptr);
  if (!text) return nullptr;
  char *result=engine_safe_area_request(reinterpret_cast<const uint8_t *>(text),std::strlen(text));
  env->ReleaseStringUTFChars(command,text);
  jstring value=result ? env->NewStringUTF(result) : nullptr;
  engine_drawing_result_free(result);
  return value;
}
#endif
