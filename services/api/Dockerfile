# syntax=docker/dockerfile:1

# --- Build stage: compile TypeScript to JS -------------------------------
FROM node:20.18-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json* ./
# Install all deps (incl. dev) for the build.
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# --- Runtime stage: slim image with production deps only -----------------
FROM node:20.18-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies.
COPY package.json package-lock.json* ./
RUN npm install --omit=dev && npm cache clean --force

# Copy compiled output and the static OpenAPI spec.
COPY --from=build /app/dist ./dist
COPY src/openapi.yaml ./dist/openapi.yaml

# Run as the built-in non-root `node` user.
USER node

EXPOSE 3000
CMD ["node", "dist/index.js"]
