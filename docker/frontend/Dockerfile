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

RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    \
    gzip on; \
    gzip_types text/plain text/css application/json application/javascript text/xml; \
    \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    location /api/ { \
        proxy_pass http://backend:8080; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade $http_upgrade; \
        proxy_set_header Connection "upgrade"; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        proxy_read_timeout 90; \
        proxy_connect_timeout 90; \
    } \
    \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
