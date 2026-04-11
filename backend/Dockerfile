# Multi-stage Dockerfile for Go backend
# Syntax: docker/dockerfile:1

########################
# Base modules cache   #
########################
FROM golang:1.25-alpine AS base
WORKDIR /app
RUN apk add --no-cache bash curl git ca-certificates
COPY go.mod go.sum ./
RUN go mod download

FROM base AS dev
RUN apk add --no-cache postgresql-client
RUN go install github.com/pressly/goose/v3/cmd/goose@latest
COPY . .
EXPOSE 8080
CMD ["bash", "./start.sh"]

FROM base AS builder
COPY . .
ENV CGO_ENABLED=0
RUN go build -o /out/server ./server

FROM gcr.io/distroless/static-debian12 AS prod
WORKDIR /app
COPY --from=builder /out/server ./server
EXPOSE 8080
ENV DB_STRING="postgres://user:password@db:5432/matcha?sslmode=disable"
USER 65532:65532
ENTRYPOINT ["/app/server"]
