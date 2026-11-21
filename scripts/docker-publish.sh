#!/usr/bin/env bash
# Builds and publishes the website's Docker image (ursnj/nayanui) from this machine: the same image
# as the "Publish website docker images" workflow. Run from the repository root:
#
#   bun run docker:publish                      # build, check and push ursnj/nayanui:latest
#   bun run docker:publish --dry-run            # build and check the image, push nothing
#   bun run docker:publish --allow-dirty        # build with uncommitted changes (not recommended)
#   bun run docker:publish --fresh              # build every image layer anew (no Docker cache)
#   bun run docker:publish --yes                # push without asking
#
# The build context is exported from git. By default it uses HEAD, including the checked-in
# @nayan-ui/games tarball and bun.lock. With --allow-dirty it uses a snapshot of the working
# tree while excluding ignored files.
#
# The image is built for linux/amd64 and inspected before pushing. Requires Docker and, for
# pushing, Docker Hub credentials for ursnj.
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
ROOT="$(cd "$(dirname "$SCRIPT")/.." && pwd)"
cd "$ROOT"

DRY_RUN=false
ALLOW_DIRTY=false
FRESH=false
YES=false
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --allow-dirty) ALLOW_DIRTY=true ;;
    --fresh) FRESH=true ;;
    -y | --yes) YES=true ;;
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
take_publish_lock docker-publish
WORK="$(mktemp -d "${TMPDIR:-/tmp}/nayan-ui-docker.XXXXXX")"
trap 'rm -rf "$PUBLISH_LOCK" "$WORK"' EXIT

require_latest_code "$ALLOW_DIRTY" "$STRICT"
echo "Building $IMAGE ($PLATFORM) from nayan-ui $(git rev-parse --short HEAD)"

step 'Preparing the build context'
CONTEXT="$WORK/context"
export_repo "$CONTEXT" "$ALLOW_DIRTY"
GAMES_TGZ=packages/website/scripts/nayan-ui-games.tgz
[ -s "$CONTEXT/$GAMES_TGZ" ] ||
  fail "Missing $GAMES_TGZ in the build context. Add the games archive to the repository."

# ── Build and check ────────────────────────────────────────────────────────────────────────

step "Building $IMAGE"
fresh=()
[ "$FRESH" = true ] && fresh=(--no-cache)
# --pull: the current base image (oven/bun), not one cached here
docker buildx build --pull ${fresh[@]+"${fresh[@]}"} --platform "$PLATFORM" \
  --build-arg "BUN_VERSION=$(tr -d '[:space:]' < "$CONTEXT/.bun-version")" \
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
