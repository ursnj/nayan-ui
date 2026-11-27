#!/usr/bin/env bash
# Builds native/core/build/android/<abi>/libengine_core.a for every Android ABI the app may ship.
set -euo pipefail
source "$(dirname "$0")/features.sh"
source "$(dirname "$0")/rust-toolchain.sh"
cd "$(dirname "$0")/.."

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$USER_HOME/Library/Android/sdk}}"
# `|| true`: with pipefail a failed `ls` would exit here silently instead of reaching the message below.
NDK="${ANDROID_NDK_HOME:-$(ls -d "$SDK"/ndk/* 2>/dev/null | sort -V | tail -1 || true)}"
STRIP="$(ls "$NDK"/toolchains/llvm/prebuilt/*/bin/llvm-strip 2>/dev/null | head -1 || true)"
if [ -z "$STRIP" ]; then
  echo "Android NDK not found (set ANDROID_NDK_HOME)" >&2
  exit 1
fi

# Rust target -> Android ABI directory name (React Native's default reactNativeArchitectures)
TARGETS=(
  "aarch64-linux-android:arm64-v8a"
  "armv7-linux-androideabi:armeabi-v7a"
  "x86_64-linux-android:x86_64"
  "i686-linux-android:x86"
)
requested_abi="${1:-}"
output_dir="${2:-$PWD/build/android}"
if [[ -n "$requested_abi" ]]; then
  case "$requested_abi" in
    arm64-v8a|armeabi-v7a|x86_64|x86) ;;
    *) echo "Nayan Engine: unsupported Android ABI $requested_abi" >&2; exit 1 ;;
  esac
fi
for pair in "${TARGETS[@]}"; do
  target="${pair%%:*}"
  abi="${pair##*:}"
  if [[ -n "$requested_abi" && "$abi" != "$requested_abi" ]]; then continue; fi
  rustup target add "$target"
  # meshoptimizer includes C++ sources. Point cc-rs at the same NDK/API as the host apps,
  # including when the NDK toolchain directory is not on PATH (EAS and local macOS builds).
  compiler_target="$target"
  if [ "$target" = "armv7-linux-androideabi" ]; then
    compiler_target="armv7a-linux-androideabi"
  fi
  toolchain_bin="$(dirname "$STRIP")"
  compiler_key="${target//-/_}"
  # Only the staticlib: Cargo skips the release profile's LTO when the rlib (for tests and the
  # bench) is built alongside it.
  env "CC_${compiler_key}=$toolchain_bin/${compiler_target}${NAYAN_ANDROID_API_LEVEL:-26}-clang" \
      "CXX_${compiler_key}=$toolchain_bin/${compiler_target}${NAYAN_ANDROID_API_LEVEL:-26}-clang++" \
      "AR_${compiler_key}=$toolchain_bin/llvm-ar" \
      cargo rustc --locked ${ENGINE_FEATURE_ARGS[@]+"${ENGINE_FEATURE_ARGS[@]}"} --release --lib --crate-type staticlib --target "$target"
  mkdir -p "$output_dir/$abi"
  archive="$(mktemp "$output_dir/$abi/engine-core.XXXXXX")"
  trap '[[ ! -f "$archive" ]] || unlink "$archive"' EXIT
  cp "${CARGO_TARGET_DIR:-target}/$target/release/libengine_core.a" "$archive"
  # Cargo's `strip` setting doesn't apply to static libraries. Drop debug info and the embedded LLVM
  # bitcode that Rust's prebuilt std carries (~45% of the file); exported engine_* symbols stay.
  "$STRIP" --strip-debug --remove-section=.llvmbc --remove-section=.llvmcmd "$archive"
  mv "$archive" "$output_dir/$abi/libengine_core.a"
  trap - EXIT
done
