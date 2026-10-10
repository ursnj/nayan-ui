#!/usr/bin/env bash
# Builds core/build/EngineCore.xcframework (iOS device + Apple-silicon simulator).
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.cargo/bin:$PATH"

TARGETS=(aarch64-apple-ios aarch64-apple-ios-sim)
args=()
for t in "${TARGETS[@]}"; do
  cargo build --release --target "$t"
  args+=(-library "target/$t/release/libengine_core.a")
done

rm -rf build/EngineCore.xcframework
mkdir -p build
xcodebuild -create-xcframework "${args[@]}" -output build/EngineCore.xcframework
