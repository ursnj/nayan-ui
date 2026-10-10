# Android build of the engine's native module. React Native's autolinking adds this directory to the
# app's native build (see react-native.config.js); there is no Gradle project, so this is a "pure C++"
# dependency and the codegen header ships in cpp/generated (regenerate with `bun run codegen`).
cmake_minimum_required(VERSION 3.13)
project(NayanEngine CXX)

get_filename_component(ENGINE_ROOT "${CMAKE_CURRENT_LIST_DIR}/.." ABSOLUTE)

# Rust core, prebuilt per ABI by core/scripts/build-android.sh.
add_library(engine_core STATIC IMPORTED)
set_target_properties(engine_core PROPERTIES
  IMPORTED_LOCATION "${ENGINE_ROOT}/core/build/android/${ANDROID_ABI}/libengine_core.a")

# The codegen target autolinking expects (react_codegen_<codegenConfig.name>). It must be a real
# library: autolinking links `common_flags` into it with a plain target_link_libraries call.
add_library(react_codegen_NayanEngineSpec STATIC "${ENGINE_ROOT}/cpp/generated/NayanEngineSpecJSI.cpp")
# android/ holds NayanEngineSpec.h, the (empty) Java module provider autolinking includes.
target_include_directories(react_codegen_NayanEngineSpec PUBLIC "${ENGINE_ROOT}/cpp/generated" "${CMAKE_CURRENT_LIST_DIR}")
target_compile_features(react_codegen_NayanEngineSpec PUBLIC cxx_std_20)
target_link_libraries(react_codegen_NayanEngineSpec jsi reactnative)

# The TurboModule (shared with iOS) and the Rust core it calls.
add_library(NayanEngine STATIC "${ENGINE_ROOT}/cpp/NayanEngineModule.cpp")
target_include_directories(NayanEngine PUBLIC "${ENGINE_ROOT}/cpp" "${ENGINE_ROOT}/core/include")
target_compile_features(NayanEngine PUBLIC cxx_std_20)
target_link_libraries(NayanEngine
  react_codegen_NayanEngineSpec
  engine_core
  fbjni
  jsi
  reactnative
  aaudio   # audio output (cpal's AAudio backend)
  android
  log)
