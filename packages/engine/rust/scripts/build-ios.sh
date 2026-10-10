#!/usr/bin/env bash
# Builds rust/build/EngineCore.xcframework (iOS device + Apple-silicon simulator).
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.cargo/bin:$PATH"

TARGETS=(aarch64-apple-ios aarch64-apple-ios-sim)
args=()
for t in "${TARGETS[@]}"; do
  cargo build --release --target "$t"
  # Cargo's `strip` setting doesn't apply to static libraries. Drop debug info and local symbols
  # (exported engine_* functions stay): ~22 MB -> ~6 MB per slice.
  mkdir -p "build/$t"
  cp "target/$t/release/libengine_core.a" "build/$t/libengine_core.a"
  strip -S -x "build/$t/libengine_core.a"
  args+=(-library "build/$t/libengine_core.a")
done

rm -rf build/EngineCore.xcframework
xcodebuild -create-xcframework "${args[@]}" -output build/EngineCore.xcframework
rm -rf "${TARGETS[@]/#/build/}"
