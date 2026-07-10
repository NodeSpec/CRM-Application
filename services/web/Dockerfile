# syntax=docker/dockerfile:1

# --- Build stage: produce the static SPA bundle --------------------------
FROM node:20.18-bookworm-slim AS build
WORKDIR /app

# Build-time public config baked into the bundle (Vite inlines VITE_* vars).
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_OIDC_AUTHORITY=/auth/realms/crm
ARG VITE_OIDC_CLIENT_ID=crm-web
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY \
    VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID

COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src
RUN npm run build

# --- Runtime stage: serve static assets with nginx -----------------------
FROM nginx:1.27-alpine AS runtime
# SPA fallback so client-side routes resolve to index.html.
COPY nginx-spa.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
