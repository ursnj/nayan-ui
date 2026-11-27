# Android build of the engine's native module. React Native's autolinking adds this directory to the
# app's native build (see react-native.config.js). The Java view managers have a separate Gradle
# target. The codegen header ships in shared/cpp/generated (regenerate with `bun run codegen`).
cmake_minimum_required(VERSION 3.13)
project(NayanEngine CXX)

get_filename_component(SHARED_ROOT "${CMAKE_CURRENT_LIST_DIR}/.." ABSOLUTE)
get_filename_component(NATIVE_ROOT "${SHARED_ROOT}/../native" ABSOLUTE)

# The host's Gradle file is also read by the Java module. PROJECT_BUILD_DIR is supplied
# by React Native; hosts with a custom build layout can pass NAYAN_ENGINE_FEATURE_FILE.
if(NOT DEFINED NAYAN_ENGINE_FEATURE_FILE AND DEFINED PROJECT_BUILD_DIR)
  set(NAYAN_ENGINE_FEATURE_FILE "${PROJECT_BUILD_DIR}/../../gradle.properties")
endif()
if(EXISTS "${NAYAN_ENGINE_FEATURE_FILE}")
  set_property(DIRECTORY APPEND PROPERTY CMAKE_CONFIGURE_DEPENDS "${NAYAN_ENGINE_FEATURE_FILE}")
  file(STRINGS "${NAYAN_ENGINE_FEATURE_FILE}" FEATURE_LINES REGEX "^[ 	]*nayanEngine\\.features[ 	]*=")
endif()

set(CORE_ROOT "${NATIVE_ROOT}/core")
set(core_archive "${CORE_ROOT}/build/android/${ANDROID_ABI}/libengine_core.a")
add_library(engine_core STATIC IMPORTED)
if(FEATURE_LINES)
  list(GET FEATURE_LINES -1 profile)
  string(REGEX REPLACE "^.*=" "" profile "${profile}")
  string(STRIP "${profile}" profile)
  if(NOT profile MATCHES "^([a-z-]+(,[a-z-]+)*)?$")
    message(FATAL_ERROR "Nayan Engine: nayanEngine.features must be a comma-separated feature list")
  endif()
  string(SHA256 profile_key "${profile}:${CMAKE_ANDROID_NDK}:${ANDROID_PLATFORM}")
  set(output "${CMAKE_CURRENT_BINARY_DIR}/rust/${profile_key}")
  set(core_archive "${output}/${ANDROID_ABI}/libengine_core.a")
  file(GLOB_RECURSE core_sources CONFIGURE_DEPENDS
    "${CORE_ROOT}/src/*" "${CORE_ROOT}/scripts/*.sh" "${NATIVE_ROOT}/*/rust/*")
  string(REGEX REPLACE "^android-" "" native_api "${ANDROID_PLATFORM}")
  add_custom_command(OUTPUT "${core_archive}"
    COMMAND "${CMAKE_COMMAND}" -E env
      "ANDROID_NDK_HOME=${CMAKE_ANDROID_NDK}"
      "NAYAN_ANDROID_API_LEVEL=${native_api}"
      "NAYAN_ENGINE_FEATURES=${profile}"
      "CARGO_TARGET_DIR=${output}/cargo"
      bash "${CORE_ROOT}/scripts/build-android.sh" "${ANDROID_ABI}" "${output}"
    DEPENDS ${core_sources} "${CORE_ROOT}/Cargo.toml" "${CORE_ROOT}/Cargo.lock"
      "${CORE_ROOT}/.cargo/config.toml"
    COMMENT "Building selected Nayan Engine Rust features for ${ANDROID_ABI}"
    VERBATIM)
  add_custom_target(nayan_engine_rust_profile DEPENDS "${core_archive}")
  add_dependencies(engine_core nayan_engine_rust_profile)
endif()
set_target_properties(engine_core PROPERTIES IMPORTED_LOCATION "${core_archive}")

# The codegen target autolinking expects (react_codegen_<codegenConfig.name>). It must be a real
# library: autolinking links `common_flags` into it with a plain target_link_libraries call.
add_library(react_codegen_NayanEngineSpec STATIC "${SHARED_ROOT}/cpp/generated/NayanEngineSpecJSI.cpp")
# android/ holds NayanEngineSpec.h, the (empty) Java module provider autolinking includes.
target_include_directories(react_codegen_NayanEngineSpec PUBLIC "${SHARED_ROOT}/cpp/generated" "${CMAKE_CURRENT_LIST_DIR}")
target_compile_features(react_codegen_NayanEngineSpec PUBLIC cxx_std_20)
target_link_libraries(react_codegen_NayanEngineSpec jsi reactnative)

# The TurboModule (shared with iOS) and the Rust core it calls.
add_library(NayanEngine STATIC
  "${SHARED_ROOT}/cpp/AppServices.android.cpp"
  "${SHARED_ROOT}/cpp/NayanEngineModule.cpp"
  "${NATIVE_ROOT}/network/cpp/NetworkMonitor.android.cpp"
  "${NATIVE_ROOT}/clipboard/cpp/Clipboard.android.cpp"
  "${NATIVE_ROOT}/device/cpp/Device.android.cpp"
  "${NATIVE_ROOT}/files/cpp/TemporaryFiles.android.cpp"
  "${NATIVE_ROOT}/assets/cpp/AssetReader.android.cpp"
  "${NATIVE_ROOT}/components/cpp/SystemBars.android.cpp"
  "${NATIVE_ROOT}/sharing/cpp/Sharing.android.cpp"
  "${NATIVE_ROOT}/capture/cpp/Capture.android.cpp")
target_include_directories(NayanEngine PUBLIC "${NATIVE_ROOT}" "${SHARED_ROOT}/cpp" "${CORE_ROOT}/include")
target_compile_features(NayanEngine PUBLIC cxx_std_20)
if(NOT FEATURE_LINES OR profile MATCHES "(^|,)document-picker(,|$)")
  target_compile_definitions(NayanEngine PRIVATE NAYAN_ENGINE_DOCUMENT_PICKER=1)
endif()
target_link_libraries(NayanEngine
  react_codegen_NayanEngineSpec
  engine_core
  fbjni
  jsi
  reactnative
  aaudio   # audio output (cpal's AAudio backend)
  android
  log)
