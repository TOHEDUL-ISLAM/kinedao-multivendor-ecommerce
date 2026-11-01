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

# Runtime stage
FROM base AS release
ENV NODE_ENV=production

# The server runs TypeScript with Bun and resolves workspace packages from
# their source directories, so both the workspace files and dependencies are
# required at runtime.
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun install --frozen-lockfile

# Expose port (Render sets PORT env var)
EXPOSE $PORT

# Start the server using Bun
CMD ["bun", "run", "apps/server/src/index.ts"]
