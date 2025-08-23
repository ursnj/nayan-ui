FROM node:20.19-alpine AS base

WORKDIR /app

# Copy the entire monorepo (all packages and configs)
COPY . .

# Install dependencies with proper workspace linking
RUN yarn install --frozen-lockfile --non-interactive

FROM base AS builder

# Build React package first (required for website build)
RUN yarn workspace @nayan-ui/react build

# Build website after React package is built
RUN yarn workspace @nayan-ui/website build

FROM node:20.19-alpine AS runner

WORKDIR /app

# Copy root package.json and yarn.lock
COPY package.json yarn.lock ./
COPY packages/react/package.json ./packages/react/package.json
COPY packages/website/package.json ./packages/website/package.json

# Install production dependencies
RUN yarn install --frozen-lockfile --production --non-interactive

# Copy built React package from builder stage (entire package for proper workspace resolution)
COPY --from=builder /app/packages/react ./packages/react

# Copy built website from builder stage
COPY --from=builder /app/packages/website/dist ./packages/website/dist
COPY --from=builder /app/packages/website/public ./packages/website/public
COPY --from=builder /app/packages/website/server.js ./packages/website/
COPY --from=builder /app/packages/website/index.html ./packages/website/

ENV NODE_ENV=production
WORKDIR /app/packages/website
EXPOSE 7100

# Start the application
CMD ["yarn", "preview"]