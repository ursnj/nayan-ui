#!/usr/bin/env bash
# Publishes the package in the current directory to npm, skipping a version that's already out.
# Env: NPM_TOKEN, DRY_RUN ("true" to only list what would be published).
set -euo pipefail

name="$(node -p "require('./package.json').name")"
version="$(node -p "require('./package.json').version")"

published=false
if npm view "$name@$version" version >/dev/null 2>&1; then
  published=true
  echo "::warning::$name@$version is already on npm; bump the version to publish it."
fi

if [ "${DRY_RUN:-false}" = "true" ]; then
  echo "Dry run: $name@$version"
  npm pack --dry-run
  exit 0
fi

if [ "$published" = "true" ]; then
  echo "Skipping $name@$version."
  exit 0
fi

echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
npm publish --access public
echo "Published $name@$version"
