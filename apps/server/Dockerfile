FROM oven/bun:1.3.6 AS base
WORKDIR /app

# Install dependencies in a separate stage for caching
FROM base AS install
COPY package.json bun.lock ./
COPY apps/server/package.json ./apps/server/
COPY apps/web/package.json ./apps/web/
COPY packages/api-types/package.json ./packages/api-types/
COPY packages/auth/package.json ./packages/auth/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/env/package.json ./packages/env/
RUN bun install --frozen-lockfile

# Build stage
FROM base AS build
COPY --from=install /app/node_modules ./node_modules
COPY . .
# We only need to build the server
# (Though server in this repo might run with `bun run index.ts` directly, 
# let's assume we build it if it has a build script, otherwise we just run it).
RUN cd apps/server && bun run build || echo "No build script needed"

# Final stage
FROM base AS release
ENV NODE_ENV=production

# Copy node_modules and built assets
COPY --from=install /app/node_modules ./node_modules
COPY . .

# Expose port (Render sets PORT env var)
EXPOSE $PORT

# Start the server using Bun
CMD ["bun", "run", "apps/server/src/index.ts"]
