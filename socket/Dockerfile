# Stage 1: Build
FROM node:20-alpine AS builder

# Run as root to avoid permission issues
USER root

WORKDIR /app

# Copy package files and install dependencies
COPY socket/package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code and build
COPY socket/ ./
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

# Create non-root user
USER root
RUN addgroup -S appgroup \
    && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Fix permissions for non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 3002

# Start the application
CMD ["npm", "start"]