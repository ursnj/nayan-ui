#!/usr/bin/env bash
# Builds core/build/android/<abi>/libengine_core.a for every Android ABI the app may ship.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.cargo/bin:$PATH"

SDK="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}"
NDK="${ANDROID_NDK_HOME:-$(ls -d "$SDK"/ndk/* 2>/dev/null | sort -V | tail -1)}"
STRIP="$(ls "$NDK"/toolchains/llvm/prebuilt/*/bin/llvm-strip 2>/dev/null | head -1)"
if [ -z "$STRIP" ]; then
  echo "Android NDK not found (set ANDROID_NDK_HOME)" >&2
  exit 1
fi

# Rust target -> Android ABI directory name
TARGETS=(
  "aarch64-linux-android:arm64-v8a"
  "armv7-linux-androideabi:armeabi-v7a"
  "x86_64-linux-android:x86_64"
)
for pair in "${TARGETS[@]}"; do
  target="${pair%%:*}"
  abi="${pair##*:}"
  cargo build --release --target "$target"
  mkdir -p "build/android/$abi"
  cp "target/$target/release/libengine_core.a" "build/android/$abi/libengine_core.a"
  # Cargo's `strip` setting doesn't apply to static libraries. Drop debug info and the embedded LLVM
  # bitcode that Rust's prebuilt std carries (~45% of the file); exported engine_* symbols stay.
  "$STRIP" --strip-debug --remove-section=.llvmbc --remove-section=.llvmcmd "build/android/$abi/libengine_core.a"
done
