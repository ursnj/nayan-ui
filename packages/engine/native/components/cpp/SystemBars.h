#pragma once
#include <engine_core.h>

namespace nayan {
void applySystemBars(EngineSystemBars state);
// iOS window persistence/bootstrap shares the Rust-resolved theme with system bars.
void applyWindowTheme(EngineSystemBars state);
}
