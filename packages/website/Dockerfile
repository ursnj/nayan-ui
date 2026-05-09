# Install dependencies only when needed
FROM node:20.19-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy monorepo root files for workspace resolution
COPY package.json yarn.lock .yarnrc.yml ./

# Enable corepack so it picks up packageManager from package.json (yarn@4.11.0)
RUN corepack enable && corepack prepare

# Copy all workspace package.json files (Yarn 4 requires all to be present)
COPY packages/cli/package.json ./packages/cli/package.json
COPY packages/react/package.json ./packages/react/package.json
COPY packages/native/package.json ./packages/native/package.json
COPY packages/native/example/package.json ./packages/native/example/package.json
COPY packages/website/package.json ./packages/website/package.json
RUN yarn install --immutable

# Rebuild the source code only when needed
FROM node:20.19-alpine AS builder
RUN corepack enable && corepack prepare yarn@4.11.0
WORKDIR /app
COPY --from=deps /app ./
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build React package first (required for website build)
RUN yarn workspace @nayan-ui/react build

# Build website (Next.js)
RUN yarn workspace @nayan-ui/website build

# Production image, copy all the files and run next
FROM node:20.19-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/packages/website/public ./packages/website/public

# Set the correct permission for prerender cache
RUN mkdir -p packages/website/.next
RUN chown nextjs:nodejs packages/website/.next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/packages/website/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/packages/website/.next/static ./packages/website/.next/static

USER nextjs

EXPOSE 7100

ENV PORT=7100
ENV HOSTNAME="0.0.0.0"

CMD ["node", "packages/website/server.js"]
