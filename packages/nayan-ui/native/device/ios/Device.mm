#include "device/cpp/Device.h"
#include <TargetConditionals.h>

namespace nayan {
const char *deviceEnvironment() {
#if TARGET_OS_SIMULATOR
  return "simulator";
#else
  return "physical";
#endif
}
} // namespace nayan
