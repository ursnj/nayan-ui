#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/features.sh"
CORE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# Use the same Rust toolchain for rustc and its installed WASM standard library.
if command -v rustup >/dev/null 2>&1; then
  export RUSTC="$(rustup which rustc)"
fi
if ! command -v wasm-bindgen >/dev/null 2>&1; then
  echo 'Install wasm-bindgen-cli matching Cargo.lock (currently 0.2.129).' >&2
  exit 1
fi
# Apple's clang has no WASM target. A full LLVM install is needed for meshoptimizer's C++.
if [ -z "${CC_wasm32_unknown_unknown:-}" ]; then
  if command -v llvm-config >/dev/null 2>&1; then
    export CC_wasm32_unknown_unknown="$(llvm-config --bindir)/clang"
  elif [ -x /opt/homebrew/opt/llvm/bin/clang ]; then
    export CC_wasm32_unknown_unknown=/opt/homebrew/opt/llvm/bin/clang
  else
    export CC_wasm32_unknown_unknown=clang
  fi
fi
# Prefer an installed WASM linker when available (some macOS Rust distributions omit its rpath).
if [ -z "${CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_LINKER:-}" ]; then
  if command -v wasm-ld >/dev/null 2>&1; then
    export CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_LINKER="$(command -v wasm-ld)"
  elif [ -x /opt/homebrew/opt/lld/bin/wasm-ld ]; then
    export CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_LINKER=/opt/homebrew/opt/lld/bin/wasm-ld
  fi
fi
# meshopt 0.7's minimal WASM math header omits functions used by its newer sources.
export CFLAGS_wasm32_unknown_unknown="${CFLAGS_wasm32_unknown_unknown:-} -Dfloorf=__builtin_floorf -Dlog2f=__builtin_log2f -Dfrexpf=__builtin_frexpf -Dldexpf=__builtin_ldexpf -Dceilf=__builtin_ceilf -Dcosf=__builtin_cosf"
cargo build --locked ${ENGINE_FEATURE_ARGS[@]+"${ENGINE_FEATURE_ARGS[@]}"} --manifest-path "$CORE_DIR/Cargo.toml" --target wasm32-unknown-unknown --release --lib
wasm-bindgen "${CARGO_TARGET_DIR:-$CORE_DIR/target}/wasm32-unknown-unknown/release/engine_core.wasm" \
  --target web --out-dir "${NAYAN_ENGINE_WASM_OUT:-$CORE_DIR/build/web}" --out-name engine_core
