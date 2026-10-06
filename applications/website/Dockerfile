# Install dependencies only when needed
FROM oven/bun:1-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy monorepo root files for workspace resolution
COPY package.json bun.lock ./

# Copy all workspace package.json files
COPY packages/ai/package.json ./packages/ai/package.json
COPY packages/cli/package.json ./packages/cli/package.json
COPY packages/react/package.json ./packages/react/package.json
COPY packages/native/package.json ./packages/native/package.json
COPY packages/native/example/package.json ./packages/native/example/package.json
COPY applications/website/package.json ./applications/website/package.json
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build React package first (required for website build)
RUN bun run --filter @nayan-ui/react build

# Build website (Next.js)
RUN bun run --filter @nayan-ui/website build

# Production image, copy all the files and run next
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache libc6-compat && \
    addgroup --system --gid 1001 bunjs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/applications/website/public ./applications/website/public

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:bunjs /app/applications/website/.next/standalone ./
COPY --from=builder --chown=nextjs:bunjs /app/applications/website/.next/static ./applications/website/.next/static

# Set prerender cache permissions, remove source maps and wrong-platform sharp binaries
RUN mkdir -p applications/website/.next && chown nextjs:bunjs applications/website/.next && \
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

CMD ["bun", "--smol", "run", "applications/website/server.js"]
