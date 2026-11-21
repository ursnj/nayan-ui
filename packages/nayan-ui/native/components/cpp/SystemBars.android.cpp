#ifdef __ANDROID__
#include "SystemBars.h"
#include <fbjni/fbjni.h>

namespace nayan {
void applySystemBars(EngineSystemBars state) {
  static const auto cls = facebook::jni::findClassStatic("com/nayanui/engine/EngineSystemBars");
  static const auto apply = cls->getStaticMethod<void(jboolean, jint, jint, jint, jint, jint, jint, jint, jboolean)>("apply");
  apply(cls, static_cast<jboolean>(state.enabled != 0), state.status_light, state.navigation_light, state.status_hidden, state.navigation_hidden,
      state.window_style, static_cast<jint>(state.background_light), static_cast<jint>(state.background_dark), static_cast<jboolean>(state.remember_window != 0));
}
}
#endif
