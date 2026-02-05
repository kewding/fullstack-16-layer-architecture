# # Deterministic Go runtime
# FROM golang@sha256:bc2596742c7a01aa8c520a075515c7fee21024b05bfaa18bd674fe82c100a05d

# # Create working directory
# WORKDIR /app

# # Explicit environment
# ENV CGO_ENABLED=0 \
#     GOOS=linux \
#     GOARCH=amd64

# # No source code yet
# CMD ["go", "env"]

#ci-cd failing due to unavailable files within ./backend, temprarily using old runtime

# # Stage 1: Build
# FROM golang@sha256:bc2596742c7a01aa8c520a075515c7fee21024b05bfaa18bd674fe82c100a05d AS builder
# WORKDIR /app
# COPY go.mod go.sum ./
# RUN go mod download
# COPY . .
# RUN go build -o server .

# # Stage 2: Production runtime
# FROM alpine:3.19 AS runtime
# WORKDIR /app
# COPY --from=builder /app/server .
# EXPOSE 8080
# CMD ["./server"]

# Stage 1: Build
FROM golang@sha256:bc2596742c7a01aa8c520a075515c7fee21024b05bfaa18bd674fe82c100a05d AS builder
WORKDIR /app

# Copy dependency files first for better caching
COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Build a statically linked binary for Linux
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/api

# Stage 2: Production runtime
FROM alpine:3.19 AS runtime
WORKDIR /app

# Only copy the final executable
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]
