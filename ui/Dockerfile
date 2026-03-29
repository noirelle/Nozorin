# Stage 1: Dependencies
FROM node:20-alpine AS deps

WORKDIR /app

# Install deps separately for caching
COPY ui/package*.json ./
USER root
RUN npm ci --legacy-peer-deps


# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Reuse installed deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY ui/ ./

# Build app
USER root
RUN npm run build


# Stage 3: Runner (Production)
FROM node:20-alpine AS runner

# Create non-root user
USER root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
 
# Set permissions
RUN chown -R appuser:appgroup /app

USER appuser

CMD ["npm", "start"]