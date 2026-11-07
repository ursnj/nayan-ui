#!/usr/bin/env bash
# Checks shared by the local publish scripts (docker-publish.sh) that what they build is the latest
# code: source it, then call the functions. Each one stops the script with an error (fail).

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
warn() { printf '\033[1;33mWarning: %s\033[0m\n' "$1"; }
fail() {
  printf '\033[1;31mError: %s\033[0m\n' "$1" >&2
  exit 1
}

# One run of `name` at a time: a second one would rebuild what the first is packing. The lock goes
# when the script exits, however it exits (a script that sets its own EXIT trap removes it too).
take_publish_lock() {
  local lock="${TMPDIR:-/tmp}/nayan-ui-$1.lock" other
  if ! mkdir "$lock" 2>/dev/null; then
    other="$(cat "$lock/pid" 2>/dev/null || true)"
    if [ -n "$other" ] && kill -0 "$other" 2>/dev/null; then
      fail "another $1 is running (pid $other): wait for it to finish"
    fi
    rm -rf "$lock" # left by a run that was killed
    mkdir "$lock" || fail "couldn't take the $1 lock ($lock)"
  fi
  echo $$ >"$lock/pid"
  PUBLISH_LOCK="$lock"
  trap 'rm -rf "$PUBLISH_LOCK"' EXIT
}

# The committed, latest code of the repository in the current directory: no uncommitted changes
# (unless `allow_dirty` is true), nothing on GitHub's main or this branch's upstream that HEAD doesn't
# have. `strict` (true for a real publish) turns an unreachable GitHub into an error, not a warning.
require_latest_code() {
  local allow_dirty="$1" strict="$2" repo upstream behind
  repo="$(basename "$(git rev-parse --show-toplevel)")"
  if [ "$allow_dirty" = false ] && [ -n "$(git status --porcelain)" ]; then
    fail "$repo has uncommitted changes: commit them first (or pass --allow-dirty)"
  fi
  if ! git fetch --quiet origin 2>/dev/null; then
    [ "$strict" = true ] && fail "couldn't reach GitHub to check $repo is the latest code (git fetch failed)"
    warn "git fetch failed in $repo: this may not be the latest code."
    return 0
  fi
  behind="$(git rev-list --count HEAD..origin/main)"
  [ "$behind" -eq 0 ] || fail "$repo HEAD is missing $behind commit(s) from origin/main: merge or pull main first"
  if upstream="$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null)"; then
    behind="$(git rev-list --count "HEAD..$upstream")"
    [ "$behind" -eq 0 ] || fail "$repo $(git branch --show-current) is $behind commit(s) behind $upstream: run \`git pull\` first"
  fi
  echo "$repo: $(git rev-parse --short HEAD) ($(git branch --show-current)), up to date with origin/main"
}

# Exports the repository in the current directory into `dir`: the files committed at HEAD, or with
# `working_tree` true, the working tree's tracked and untracked files (still never ignored ones, so
# local .env files and build output can't get in).
export_repo() {
  local dir="$1" working_tree="$2" tree index
  mkdir -p "$dir"
  if [ "$working_tree" = true ]; then
    # A snapshot of the working tree through a throwaway index; the real index is left alone
    index="$(mktemp "${TMPDIR:-/tmp}/nayan-ui-index.XXXXXX")"
    cp "$(git rev-parse --git-path index)" "$index"
    GIT_INDEX_FILE="$index" git add -A
    tree="$(GIT_INDEX_FILE="$index" git write-tree)"
    rm -f "$index"
  else
    tree=HEAD
  fi
  git archive "$tree" | tar -x -C "$dir"
}
