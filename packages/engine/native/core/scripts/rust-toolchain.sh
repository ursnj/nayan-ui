# Sourced by native builders, including the CocoaPods phase on a fresh build host.
USER_HOME="$(eval echo "~$(id -un)")"
if [ -z "${RUSTUP_HOME:-}" ] && [ ! -d "$HOME/.rustup" ] && [ -d "$USER_HOME/.rustup" ]; then
  export RUSTUP_HOME="$USER_HOME/.rustup" CARGO_HOME="$USER_HOME/.cargo"
fi
export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$USER_HOME/.cargo/bin:$PATH"
if ! command -v rustup >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal
  export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$PATH"
fi
