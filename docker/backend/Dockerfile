# Stage 1: Build
FROM golang@sha256:bc2596742c7a01aa8c520a075515c7fee21024b05bfaa18bd674fe82c100a05d AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server .

# Stage 2: Production runtime
FROM alpine:3.19 AS runtime
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
CMD ["./server"]
