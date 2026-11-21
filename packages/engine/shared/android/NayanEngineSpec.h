// Autolinking includes <NayanEngineSpec.h> and calls this provider for every library with a codegen
// config. The engine has no Java module (it is registered through the C++ provider in
// NayanEngineModule.h), so this always declines.
#pragma once

#include <ReactCommon/JavaTurboModule.h>

namespace facebook::react {

inline std::shared_ptr<TurboModule> NayanEngineSpec_ModuleProvider(
    const std::string&, const JavaTurboModule::InitParams&) {
  return nullptr;
}

} // namespace facebook::react
