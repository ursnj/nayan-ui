#!/usr/bin/env bash
# Builds and publishes the website's Docker image (ursnj/nayanui) from this machine: the same image
# as the "Publish website docker images" workflow. Run from the repository root:
#
#   bun run docker:publish                      # build, check and push ursnj/nayanui:latest
#   bun run docker:publish --dry-run            # build and check the image, push nothing
#   bun run docker:publish --allow-dirty        # build with uncommitted changes (not recommended)
#   bun run docker:publish --fresh              # build every image layer anew (no Docker cache)
#   bun run docker:publish --playtura <dir>     # the playtura checkout (default: ../playtura)
#   bun run docker:publish --yes                # push without asking
#
# Everything comes from the latest committed code: this repository's and playtura's HEAD must have
# every commit on GitHub's main. @nayan-ui/games is built from playtura's HEAD (exported with
# `git archive`, so the playtura checkout itself is never touched and its uncommitted changes are
# left out) against the published @nayan-ui/engine build of the version playtura declares, then
# packed into the website as packages/website/scripts/nayan-ui-games.tgz with bun.lock refreshed for
# it. The image's build context is this repository exported from git (`git archive HEAD`); with
# --allow-dirty, the working tree's tracked and untracked files instead (ignored files never). The
# working tree itself is not modified, and the base image is pulled.
#
# The image is built for linux/amd64 (the server), loaded locally and checked before anything is
# pushed: an image holding an environment file (.env, .env.local, ...) is never pushed. Needs Docker
# running, Bun, Node.js and npm, and `docker login` as ursnj.
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
ROOT="$(cd "$(dirname "$SCRIPT")/.." && pwd)"
cd "$ROOT"

DRY_RUN=false
ALLOW_DIRTY=false
FRESH=false
YES=false
PLAYTURA="${PLAYTURA_DIR:-$ROOT/../playtura}"
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --allow-dirty) ALLOW_DIRTY=true ;;
    --fresh) FRESH=true ;;
    -y | --yes) YES=true ;;
    --playtura)
      PLAYTURA="${2:-}"
      shift
      ;;
    --playtura=*) PLAYTURA="${1#--playtura=}" ;;
    -h | --help)
      awk 'NR > 1 && /^#/ { sub(/^# ?/, ""); print; next } NR > 1 { exit }' "$SCRIPT"
      exit 0
      ;;
    *)
      echo "Unknown option: $1 (see --help)" >&2
      exit 1
      ;;
  esac
  shift
done

IMAGE=ursnj/nayanui:latest
PLATFORM=linux/amd64
STRICT="$([ "$DRY_RUN" = false ] && echo true || echo false)"

# shellcheck source=publish-checks.sh
. "$(dirname "$SCRIPT")/publish-checks.sh"

# ── Preflight ──────────────────────────────────────────────────────────────────────────────

command -v docker >/dev/null 2>&1 || fail 'Docker is required'
docker info >/dev/null 2>&1 || fail 'Docker is not running: start Docker Desktop'
docker buildx version >/dev/null 2>&1 || fail 'docker buildx is required'
command -v bun >/dev/null 2>&1 || fail 'Bun is required'
command -v node >/dev/null 2>&1 || fail 'Node.js is required'
command -v npm >/dev/null 2>&1 || fail 'npm is required'
[ -n "$PLAYTURA" ] && git -C "$PLAYTURA" rev-parse --git-dir >/dev/null 2>&1 ||
  fail "no playtura checkout at '$PLAYTURA': clone ursnj/playtura there or pass --playtura <dir>"
PLAYTURA="$(cd "$PLAYTURA" && pwd)"

take_publish_lock docker-publish
WORK="$(mktemp -d "${TMPDIR:-/tmp}/nayan-ui-docker.XXXXXX")"
trap 'rm -rf "$PUBLISH_LOCK" "$WORK"' EXIT

require_latest_code "$ALLOW_DIRTY" "$STRICT"
# Games come from playtura's HEAD whatever its working tree holds: say so rather than refuse
(cd "$PLAYTURA" && require_latest_code true "$STRICT")
[ -z "$(git -C "$PLAYTURA" status --porcelain)" ] ||
  warn "playtura has uncommitted changes: they are not in this build (games come from its HEAD)"

# The games are built against the published engine of the version playtura declares: publish it first
ENGINE_VERSION="$(git -C "$PLAYTURA" show HEAD:packages/engine/package.json | node -p "JSON.parse(require('fs').readFileSync(0)).version")"
npm view "@nayan-ui/engine@$ENGINE_VERSION" version 2>/dev/null | grep -q . ||
  fail "@nayan-ui/engine@$ENGINE_VERSION (playtura HEAD) is not on npm: publish it first (in playtura: bun run engine:publish)"

echo "Building $IMAGE ($PLATFORM) from nayan-ui $(git rev-parse --short HEAD), playtura $(git -C "$PLAYTURA" rev-parse --short HEAD)"

# ── @nayan-ui/games ────────────────────────────────────────────────────────────────────────

step 'Exporting playtura'
(cd "$PLAYTURA" && export_repo "$WORK/playtura" false)

step 'Installing playtura dependencies as locked'
(cd "$WORK/playtura" && bun install --frozen-lockfile)

step 'Using the published @nayan-ui/engine build'
# The games build only needs the engine's built JS and type declarations (the engine stays an
# external peer), so the published build of the same version stands in for compiling the Rust core
mkdir -p "$WORK/engine"
npm pack "@nayan-ui/engine@$ENGINE_VERSION" --pack-destination "$WORK/engine" >/dev/null ||
  fail "couldn't download @nayan-ui/engine@$ENGINE_VERSION"
tar -xzf "$WORK/engine/nayan-ui-engine-$ENGINE_VERSION.tgz" -C "$WORK/engine"
rm -rf "$WORK/playtura/packages/engine/lib"
cp -R "$WORK/engine/package/lib" "$WORK/playtura/packages/engine/lib"
echo "@nayan-ui/engine@$ENGINE_VERSION"

step 'Building @nayan-ui/games'
(cd "$WORK/playtura/packages/games" && bun run build)

step 'Packing @nayan-ui/games'
GAMES_TGZ="$WORK/playtura/packages/games/$(cd "$WORK/playtura/packages/games" && npm pack --silent | tail -n 1)"
[ -f "$GAMES_TGZ" ] || fail "npm pack didn't produce the @nayan-ui/games tarball"
echo "$(basename "$GAMES_TGZ") ($(du -h "$GAMES_TGZ" | cut -f1 | tr -d ' '))"

# ── Build context ──────────────────────────────────────────────────────────────────────────

step 'Preparing the build context'
CONTEXT="$WORK/context"
export_repo "$CONTEXT" "$ALLOW_DIRTY"
cp "$GAMES_TGZ" "$CONTEXT/packages/website/scripts/nayan-ui-games.tgz"
# A fresh tarball has a new integrity hash: refresh its bun.lock entry so the image's
# `bun install --frozen-lockfile` accepts it
grep -v '^    "@nayan-ui/games": \[' "$CONTEXT/bun.lock" >"$WORK/bun.lock"
mv "$WORK/bun.lock" "$CONTEXT/bun.lock"
(cd "$CONTEXT" && bun install --lockfile-only)
grep -q '^    "@nayan-ui/games": \[' "$CONTEXT/bun.lock" ||
  fail 'bun.lock has no @nayan-ui/games entry after refreshing it'

# ── Build and check ────────────────────────────────────────────────────────────────────────

step "Building $IMAGE"
fresh=()
[ "$FRESH" = true ] && fresh=(--no-cache)
# --pull: the current base image (oven/bun), not one cached here
docker buildx build --pull ${fresh[@]+"${fresh[@]}"} --platform "$PLATFORM" \
  --file "$CONTEXT/packages/website/Dockerfile" --tag "$IMAGE" --load "$CONTEXT"

step "Checking $IMAGE"
# As root: the image runs as `nextjs`, which can't read every directory, and the check must see
# every file. Credentials must never be baked into an image.
found="$(docker run --rm --platform "$PLATFORM" --user 0 --entrypoint sh "$IMAGE" -c \
  "find / -xdev \( -path /proc -o -path /sys -o -path /usr -o -path '*/node_modules' \) -prune -o -type f -name '.env*' ! -name '*.example' -print 2>/dev/null")" ||
  fail "couldn't inspect $IMAGE"
[ -z "$found" ] || fail "$IMAGE contains environment files, not pushing it:
$found"
echo "No environment files in $IMAGE"

# ── Push ───────────────────────────────────────────────────────────────────────────────────

if [ "$DRY_RUN" = true ]; then
  step "Dry run complete: $IMAGE built and checked, not pushed"
  exit 0
fi
if [ "$YES" = false ]; then
  printf '\nPush %s to Docker Hub? [y/N] ' "$IMAGE"
  read -r answer
  case "$answer" in
    y | Y | yes | YES) ;;
    *)
      echo 'Not pushed.'
      exit 1
      ;;
  esac
fi
step "Pushing $IMAGE"
docker push "$IMAGE" || fail "couldn't push $IMAGE: run \`docker login\` as ursnj"
step "Published $IMAGE"
