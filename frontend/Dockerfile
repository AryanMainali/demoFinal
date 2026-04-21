FROM node:20 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_API_URL
ARG NEXT_PUBLIC_APP_NAME=Kriterion
ARG BUILD_ID=unknown

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_API_URL=${NEXT_PUBLIC_WS_API_URL}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_TELEMETRY_DISABLED 1

RUN echo "=== Starting Build ===" && \
    echo "BUILD_ID: $BUILD_ID" && \
    echo "API_URL: $NEXT_PUBLIC_API_URL" && \
    echo "WS_URL: $NEXT_PUBLIC_WS_API_URL" && \
    echo "Config file:" && \
    cat next.config.js && \
    npm run build && \
    echo "=== Build Complete ===" && \
    echo "=== Contents of /app/.next/ ===" && \
    ls -la /app/.next/ && \
    echo "=== Contents of /app/.next/standalone/ ===" && \
    ls -la /app/.next/standalone/ || echo "ERROR: /app/.next/standalone not found"

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public
COPY --from=builder /app/public ./public 2>/dev/null || true

# Create and set permissions for .next
RUN mkdir -p .next && chown -R nextjs:nodejs .next

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
