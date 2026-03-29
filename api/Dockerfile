# Stage 1: Build
FROM node:20-alpine AS builder

# Run as root to avoid permission issues
USER root

WORKDIR /app

# Copy package files and install dependencies
COPY api/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code and build
COPY api/ ./
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Create non-root user
USER root
RUN addgroup -S appgroup \
    && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy build output and production dependencies
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Fix permissions for non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose service port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]