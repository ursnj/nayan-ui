#!/usr/bin/env bash
# Called by the CocoaPods Xcode build phase for the active SDK and architectures.
set -euo pipefail
source "$(dirname "$0")/features.sh"
source "$(dirname "$0")/rust-toolchain.sh"
cd "$(dirname "$0")/.."
export CARGO_TARGET_DIR="${PROJECT_TEMP_DIR:?}/NayanEngineRust/cargo"
output="${SCRIPT_OUTPUT_FILE_0:?}"
mkdir -p "$(dirname "$output")"
staging="$(mktemp -d "$(dirname "$output")/nayan-engine.XXXXXX")"
trap 'for archive in "$staging"/*.a; do [[ ! -f "$archive" ]] || unlink "$archive"; done; rmdir "$staging"' EXIT
archives=()
for arch in ${ARCHS:?}; do
  case "$PLATFORM_NAME:$arch" in
    iphoneos:arm64) target=aarch64-apple-ios ;;
    iphonesimulator:arm64) target=aarch64-apple-ios-sim ;;
    iphonesimulator:x86_64) target=x86_64-apple-ios ;;
    *) echo "Nayan Engine: unsupported iOS target $PLATFORM_NAME:$arch" >&2; exit 1 ;;
  esac
  rustup target add "$target"
  cargo rustc --locked ${ENGINE_FEATURE_ARGS[@]+"${ENGINE_FEATURE_ARGS[@]}"} --release --lib --crate-type staticlib --target "$target"
  archive="$staging/$arch.a"
  cp "$CARGO_TARGET_DIR/$target/release/libengine_core.a" "$archive"
  strip -S -x "$archive"
  archives+=("$archive")
done
if [[ "${#archives[@]}" == 1 ]]; then
  mv "${archives[0]}" "$output"
else
  lipo -create "${archives[@]}" -output "$staging/combined.a"
  mv "$staging/combined.a" "$output"
fi
