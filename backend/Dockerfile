# Multi-stage Dockerfile for Go backend
# Syntax: docker/dockerfile:1

########################
# Base modules cache   #
########################
FROM golang:1.24-alpine AS base
WORKDIR /app
# Install build tools if needed later (e.g. goose)
RUN apk add --no-cache bash curl git ca-certificates
COPY go.mod go.sum ./
RUN go mod download

########################
# Development stage    #
########################
FROM base AS dev
# Copy the whole backend context (excluding what is in .dockerignore)
COPY . .
# Expose backend port
EXPOSE 8080
# In dev we prefer running directly `go run` for fast iteration (with bind mount)
# You can switch to a live-reload tool (air/reflex) later if desired.
CMD ["go", "run", "./server"]

########################
# Build stage          #
########################
FROM base AS builder
# Copy source
COPY . .
# Build static binary (CGO disabled for smaller image). Adjust if you need CGO.
ENV CGO_ENABLED=0
RUN go build -o /out/server ./server

########################
# Production stage     #
########################
FROM gcr.io/distroless/static-debian12 AS prod
WORKDIR /app
COPY --from=builder /out/server ./server
# Expose runtime port
EXPOSE 8080
# Environment variable placeholder (override via compose)
ENV DB_STRING="postgres://user:password@db:5432/matcha?sslmode=disable"
USER 65532:65532
ENTRYPOINT ["/app/server"]
