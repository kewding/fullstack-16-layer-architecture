# # Deterministic Node runtime
# FROM node@sha256:931d7d57f8c1fd0e2179dbff7cc7da4c9dd100998bc2b32afc85142d8efbc213

# WORKDIR /app

# # Explicit runtime environment
# ENV NODE_ENV=development

# CMD ["node", "--version"]

#ci-cd failing due to unavailable files within ./frontend, temprarily using old runtime

# Stage 1: Build
FROM node@sha256:931d7d57f8c1fd0e2179dbff7cc7da4c9dd100998bc2b32afc85142d8efbc213 AS builder

# Set working directory
WORKDIR /app

# Install pnpm globally
RUN corepack enable
RUN corepack prepare pnpm@latest --activate

# Copy only package files first for better caching
COPY package.json pnpm-lock.yaml ./
# COPY frontend/package.json frontend/pnpm-lock.yaml ./


# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile 

# Copy the rest of the application source code
COPY . .

# Run tests
# RUN pnpm test

# Build production static files (Vite default output: dist/)
RUN pnpm build

# Stage 2: Production runtime
FROM nginx:1.27.1-alpine AS runtime

# Remove default nginx static content (optional but safer)
RUN rm -rf /usr/share/nginx/html/*

# Copy build output from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
