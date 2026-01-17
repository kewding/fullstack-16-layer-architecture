# Deterministic Go runtime
FROM golang:1.25.6-alpine

# Create working directory
WORKDIR /app

# Explicit environment
ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# No source code yet
CMD ["go", "env"]