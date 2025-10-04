# Multi-stage Dockerfile for Next.js frontend
# syntax=docker/dockerfile:1

########################
# Base deps layer      #
########################
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=development
# Install OS deps if needed
RUN apk add --no-cache libc6-compat
# Copy package manifest & possible lock files individually if they exist
COPY package.json ./
COPY package-lock.json* ./
COPY pnpm-lock.yaml* ./
COPY yarn.lock* ./
COPY .npmrc* ./
RUN npm install --legacy-peer-deps || npm install --no-package-lock --legacy-peer-deps

########################
# Development stage    #
########################
FROM base AS dev
# Copy rest of the source (will be overridden by bind mount in dev)
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

########################
# Build stage          #
########################
FROM base AS builder
ENV NODE_ENV=production
COPY . .
RUN npm run build && npm prune --production

########################
# Production runtime   #
########################
FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
# Copy only needed artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["npm", "run", "start"]
