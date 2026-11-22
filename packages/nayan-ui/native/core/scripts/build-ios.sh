#!/usr/bin/env bash
# Builds native/core/build/EngineCore.xcframework (iOS device + Apple-silicon simulator).
set -euo pipefail
source "$(dirname "$0")/features.sh"
source "$(dirname "$0")/rust-toolchain.sh"
cd "$(dirname "$0")/.."

TARGETS=(aarch64-apple-ios aarch64-apple-ios-sim)
rustup target add "${TARGETS[@]}"
mkdir -p build
staging=$(mktemp -d "$PWD/build/.ios.XXXXXX")
trap 'rm -rf "$staging"' EXIT
args=()
for t in "${TARGETS[@]}"; do
  # Only the staticlib: Cargo skips the release profile's LTO when the rlib (for tests and the
  # bench) is built alongside it.
  cargo rustc --locked ${ENGINE_FEATURE_ARGS[@]+"${ENGINE_FEATURE_ARGS[@]}"} --release --lib --crate-type staticlib --target "$t"
  # Cargo's `strip` setting doesn't apply to static libraries. Drop debug info and local symbols
  # (exported engine_* functions stay): ~22 MB -> ~6 MB per slice.
  mkdir "$staging/$t"
  archive="$staging/$t/libengine_core.a"
  cp "${CARGO_TARGET_DIR:-target}/$t/release/libengine_core.a" "$archive"
  strip -S -x "$archive"
  args+=(-library "$archive")
done

xcodebuild -create-xcframework "${args[@]}" -output "$staging/EngineCore.xcframework"
rm -rf build/EngineCore.xcframework
mv "$staging/EngineCore.xcframework" build/
