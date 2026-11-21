#pragma once
#include <algorithm>
#include <cctype>
#include <initializer_list>
#include <string>

namespace nayan {
struct AndroidBuild {
  std::string fingerprint, model, manufacturer, hardware, product, brand, device, board, bootloader;
};

/** Build signatures are a compatibility heuristic, not an integrity/security check. */
inline bool androidEmulator(AndroidBuild build) {
  auto lower = [](std::string &value) {
    std::transform(value.begin(), value.end(), value.begin(), [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
  };
  for (auto *value : {&build.fingerprint, &build.model, &build.manufacturer, &build.hardware, &build.product, &build.brand, &build.device, &build.board, &build.bootloader}) lower(*value);
  auto contains = [](const std::string &value, std::initializer_list<const char *> markers) {
    for (const auto *marker : markers) if (value.find(marker) != std::string::npos) return true;
    return false;
  };
  return build.fingerprint.starts_with("generic") || build.fingerprint.starts_with("unknown") ||
      contains(build.fingerprint, {"google/sdk_gphone", "vbox"}) ||
      contains(build.hardware, {"goldfish", "ranchu", "vbox", "nox"}) ||
      contains(build.model, {"emulator", "google_sdk", "android sdk", "sdk_gphone", "droid4x"}) ||
      contains(build.manufacturer, {"genymotion"}) ||
      contains(build.product, {"sdk", "emulator", "simulator", "vbox", "nox"}) ||
      contains(build.board, {"nox"}) || contains(build.bootloader, {"nox"}) ||
      (build.brand.starts_with("generic") && build.device.starts_with("generic"));
}
} // namespace nayan
