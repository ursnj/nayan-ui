ARG BUN_VERSION=canary

# The website and its game bundle use the workspace engine.
FROM rust:1.99-bookworm AS engine-wasm
WORKDIR /app/packages/engine
RUN apt-get update && apt-get install -y --no-install-recommends clang && rm -rf /var/lib/apt/lists/*
COPY packages/engine/native/core/Cargo.lock /tmp/nayan-engine-Cargo.lock
RUN rustup target add wasm32-unknown-unknown && \
    version="$(awk '/^name = "wasm-bindgen"$/ { getline; print $3; exit }' /tmp/nayan-engine-Cargo.lock | tr -d '"')" && \
    cargo install wasm-bindgen-cli --locked --version "$version"
COPY packages/engine/native ./native
RUN native/core/scripts/build-web.sh

# Install dependencies only when needed
FROM oven/bun:${BUN_VERSION}-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy monorepo root files for workspace resolution
COPY package.json bun.lock bunfig.toml ./

# Copy all workspace package.json files
COPY packages/engine/package.json ./packages/engine/package.json
COPY packages/example/package.json ./packages/example/package.json
COPY packages/example/mobile/package.json ./packages/example/mobile/package.json
COPY packages/example/shared/package.json ./packages/example/shared/package.json
COPY packages/example/web/package.json ./packages/example/web/package.json
COPY packages/website/package.json ./packages/website/package.json
# @nayan-ui/games tarball, built from playtura by the docker-publish workflow
COPY packages/website/scripts/nayan-ui-games.tgz ./packages/website/scripts/nayan-ui-games.tgz
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM oven/bun:${BUN_VERSION}-alpine AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=engine-wasm /app/packages/engine/native/core/build/web ./packages/engine/native/core/build/web
RUN cd packages/engine && bun scripts/build-web.mjs

# Build website (Next.js)
RUN bun run --filter @nayan-ui/website build

# Production image, copy all the files and run next.
# Node, not Bun: Node returns memory after a burst of tool requests (about 200 MiB against Bun
# --smol's 290 MiB in the same test) and is what sharp, @napi-rs/canvas and Next.js support.
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# fontconfig and a font: the image watermark draws its text through SVG, which needs both
# ("Fontconfig error: Cannot load default config file" and no text without them).
RUN apk add --no-cache libc6-compat fontconfig ttf-dejavu && \
    addgroup --system --gid 1001 bunjs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/packages/website/public ./packages/website/public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:bunjs /app/packages/website/.next/standalone ./
COPY --from=builder --chown=nextjs:bunjs /app/packages/website/.next/static ./packages/website/.next/static

# Set prerender cache permissions, remove source maps and wrong-platform sharp binaries
RUN mkdir -p packages/website/.next && chown nextjs:bunjs packages/website/.next && \
    find . -name '*.map' -delete 2>/dev/null; \
    rm -rf node_modules/.bun/@img+sharp-libvips-darwin-* \
           node_modules/.bun/@img+sharp-darwin-* \
           node_modules/.bun/@img+sharp-libvips-linux-arm64* \
           node_modules/.bun/@img+sharp-linux-arm64* 2>/dev/null; \
    true

USER nextjs

EXPOSE 7100

ENV PORT=7100
ENV HOSTNAME="0.0.0.0"

# Swarm replaces a task that stops answering. /api/health does no work, so it answers even while
# every tool slot is busy.
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:7100/api/health || exit 1

# --expose-gc: the tools collect garbage before refusing a job for lack of memory (helpers.ts).
CMD ["node", "--expose-gc", "packages/website/server.js"]
