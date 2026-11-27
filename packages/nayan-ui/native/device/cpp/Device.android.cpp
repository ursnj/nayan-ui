#ifdef __ANDROID__
#include "Device.h"
#include "AndroidDevice.h"
#include <fbjni/fbjni.h>

namespace nayan {
const char *deviceEnvironment() {
  static const bool emulator = [] {
    const auto cls = facebook::jni::findClassStatic("android/os/Build");
    auto field = [&](const char *name) {
      const auto value = facebook::jni::adopt_local(cls->getStaticFieldValue(cls->getStaticField<jstring>(name)));
      return value ? value->toStdString() : std::string{};
    };
    return androidEmulator({field("FINGERPRINT"), field("MODEL"), field("MANUFACTURER"), field("HARDWARE"),
        field("PRODUCT"), field("BRAND"), field("DEVICE"), field("BOARD"), field("BOOTLOADER")});
  }();
  return emulator ? "emulator" : "physical";
}
} // namespace nayan
#endif
