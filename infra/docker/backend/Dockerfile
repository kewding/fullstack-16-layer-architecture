# Deterministic Go runtime
FROM golang@sha256:bc2596742c7a01aa8c520a075515c7fee21024b05bfaa18bd674fe82c100a05d

# Create working directory
WORKDIR /app

# Explicit environment
ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# No source code yet
CMD ["go", "env"]