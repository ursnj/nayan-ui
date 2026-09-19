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
COPY packages/website/package.json ./packages/website/package.json
COPY applications/video-editor/package.json ./applications/video-editor/package.json
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build React package first (required for website build)
RUN bun run --filter @nayan-ui/react build

# The video editor is a static bundle that writes into the site's public/
# folder, so it has to exist before Next collects its static output. Shipping
# it this way keeps everything in one image at nayanui.com/editor.
RUN bun run --filter @nayan-ui/video-editor build

# Build website (Next.js)
RUN bun run --filter @nayan-ui/website build

# Production image, copy all the files and run next
FROM oven/bun:1-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 bunjs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/packages/website/public ./packages/website/public

# Set the correct permission for prerender cache
RUN mkdir -p packages/website/.next
RUN chown nextjs:bunjs packages/website/.next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:bunjs /app/packages/website/.next/standalone ./
COPY --from=builder --chown=nextjs:bunjs /app/packages/website/.next/static ./packages/website/.next/static

USER nextjs

EXPOSE 7100

ENV PORT=7100
ENV HOSTNAME="0.0.0.0"

CMD ["bun", "run", "packages/website/server.js"]
