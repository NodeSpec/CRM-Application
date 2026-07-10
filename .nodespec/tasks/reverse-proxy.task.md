# Task: Reverse Proxy

## Component Purpose

**Role:** Load Balancer
**Technology:** NGINX
**Description:** Traffic distribution across service instances
**Rationale:** Nginx reverse proxy acting as the single container entry point: terminates TLS, serves the React SPA static assets, and routes /api/v1 to the CRM API and /auth to the Identity Provider. Runs as a plain OCI container with no cloud-provider dependency, supporting the container-based deployment model (REQ-014).

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Requirements

### REQ-016: API-First Backend Design
Category: technical | Status: in-progress
The backend must expose a versioned RESTful API (e.g., /api/v1/...) that serves all five CRM modules. The API must be documented via OpenAPI 3.x so future integrations, mobile clients, or automation tools can consume it without reverse-engineering the frontend.

**Acceptance Criteria:**
- [ ] Every CRM module (B2B, B2G, Events, Submissions, Publicity) has corresponding CRUD endpoints under a versioned API path (e.g., /api/v1/b2b-leads).
- [ ] An OpenAPI 3.x specification file is auto-generated and served at /api/docs, accessible to authenticated users.
- [ ] Adding a new API version (e.g., /api/v2/) does not break existing /api/v1/ consumers.

## Interface Contracts

### SENDS TO: CRM API (backend-service)
- **Contract:** Proxy to API (/api/v1)
- **Protocol:** rest
- **Interaction:** request_response
- **Transport:** http
- **Spec Format:** openapi
- **Their Technology:** nodejs

**Inferred Payload (no schema defined -- implement based on this pattern):**
```
Expected REST endpoints for "Proxy to API (/api/v1)":
  GET    /proxy to(//v1)       - List resources
  GET    /proxy to(//v1)/:id   - Get single resource
  POST   /proxy to(//v1)       - Create resource
  PUT    /proxy to(//v1)/:id   - Update resource
  DELETE /proxy to(//v1)/:id   - Delete resource
```

### SENDS TO: Identity Provider (auth-provider)
- **Contract:** Proxy to IdP (/auth)
- **Protocol:** rest
- **Interaction:** request_response
- **Transport:** http
- **Spec Format:** openapi
- **Their Technology:** keycloak

**Inferred Payload (no schema defined -- implement based on this pattern):**
```
Expected REST endpoints for "Proxy to IdP (/auth)":
  GET    /proxy to idp (/auth)       - List resources
  GET    /proxy to idp (/auth)/:id   - Get single resource
  POST   /proxy to idp (/auth)       - Create resource
  PUT    /proxy to idp (/auth)/:id   - Update resource
  DELETE /proxy to idp (/auth)/:id   - Delete resource
```

### RECEIVES FROM: CRM Web App (frontend-app)
- **Contract:** Browser HTTPS
- **Protocol:** rest
- **Interaction:** request_response
- **Transport:** http
- **Spec Format:** openapi
- **Their Technology:** react

**Inferred Payload (no schema defined -- implement based on this pattern):**
```
Expected REST endpoints for "Browser HTTPS":
  GET    /browser https       - List resources
  GET    /browser https/:id   - Get single resource
  POST   /browser https       - Create resource
  PUT    /browser https/:id   - Update resource
  DELETE /browser https/:id   - Delete resource
```

## Technology Guidance

**Purpose:** High-performance web server, reverse proxy, and load balancer. NGINX is not a CDN itself, but can be deployed at edge locations as a building block for custom CDN infrastructure when paired with caching and distribution layers.

**SDK Initialization:**
```
# /etc/nginx/nginx.conf\nworker_processes auto;\nevents { worker_connections 1024; }\nhttp {\n  include mime.types;\n  sendfile on;\n  server {\n    listen 80;\n    server_name example.com;\n    location / { root /var/www/html; index index.html; }\n  }\n}
```

**Common API Patterns:**

#### Reverse Proxy
Load-balanced reverse proxy with proper header forwarding
```
upstream backend {\n  server app1:3000;\n  server app2:3000;\n}\nserver {\n  listen 80;\n  location /api/ {\n    proxy_pass http://backend;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n  }\n}
```

#### TLS Termination
HTTPS with modern TLS configuration and HSTS
```
server {\n  listen 443 ssl http2;\n  server_name example.com;\n  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;\n  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;\n  ssl_protocols TLSv1.2 TLSv1.3;\n  ssl_ciphers HIGH:!aNULL:!MD5;\n  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;\n}
```

#### Rate Limiting
Per-IP rate limiting with burst allowance
```
http {\n  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\n  server {\n    location /api/ {\n      limit_req zone=api burst=20 nodelay;\n      proxy_pass http://backend;\n    }\n  }\n}
```

**Configuration Template:**
```
# /etc/nginx/conf.d/default.conf\nserver {\n  listen 80;\n  server_name _;\n  return 301 https://$host$request_uri;\n}\nserver {\n  listen 443 ssl http2;\n  server_name example.com;\n  ssl_certificate /etc/ssl/certs/cert.pem;\n  ssl_certificate_key /etc/ssl/private/key.pem;\n\n  location / {\n    root /var/www/html;\n    try_files $uri $uri/ /index.html;\n  }\n  location /api/ {\n    proxy_pass http://backend:3000/;\n    proxy_http_version 1.1;\n    proxy_set_header Upgrade $http_upgrade;\n    proxy_set_header Connection "upgrade";\n  }\n}
```

**Best Practices:**
- Use upstream blocks for load balancing
- Implement proper health checks
- Configure appropriate worker processes
- Use HTTPS with proper TLS configuration
- Implement rate limiting
- Use caching for static content
- Configure proper logging

**Anti-Patterns to Avoid:**
- Using if statements in location blocks (NGINX if is evil for rewrites)
- Not forwarding X-Forwarded-For and X-Real-IP headers to backends
- Leaving default server configuration active in production
- Not setting proxy_read_timeout for long-running API requests
- Serving static files without caching headers or gzip compression

**Security:** Disable server_tokens to hide NGINX version. Use TLS 1.2+ only with strong cipher suites. Set security headers (X-Frame-Options, X-Content-Type-Options, CSP). Limit request body size with client_max_body_size. Use rate limiting to prevent abuse. Restrict access to admin paths with allow/deny directives. Run NGINX worker processes as a non-root user.

**Integration Patterns:**
- Certbot/Let's Encrypt for automated TLS certificate renewal
- Docker or Kubernetes for containerized deployment
- Upstream blocks for load balancing across application servers
- Lua modules (OpenResty) for dynamic request processing
- Prometheus exporter for metrics collection

**Suggested File Structure:**
- `nginx.conf` (config)

## Manual Setup Checklist

> The following steps require manual action by a human. AI cannot complete these steps automatically.

**Quick checklist:**
- [ ] Install NGINX *(required)*
- [ ] Configure Server Blocks *(required)*
- [ ] Configure Reverse Proxy *(required)*
- [ ] Obtain TLS Certificate *(optional)*

### Required Steps

#### [toolchain_install] Install NGINX

Install via system package manager. Use the official NGINX repository for the latest stable version.

```bash
# Debian/Ubuntu:
sudo apt-get install nginx
# macOS:
brew install nginx
# Verify:
nginx -v
```

#### [dashboard_config] Configure Server Blocks

Create a server block (virtual host) configuration in /etc/nginx/sites-available/. Link it to sites-enabled. Configure the server_name, root directory, and location blocks.

```bash
sudo nano /etc/nginx/sites-available/myapp
sudo ln -s /etc/nginx/sites-available/myapp /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

#### [dashboard_config] Configure Reverse Proxy

In the location block, configure proxy_pass to forward requests to your application server. Set proxy headers for proper client IP forwarding.

### Optional Steps

#### [certificate] Obtain TLS Certificate

Use Certbot (Let's Encrypt) to obtain a free TLS certificate. Certbot can automatically configure NGINX for HTTPS.

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d example.com -d www.example.com
```

**Reference:** https://certbot.eff.org/

## Connected Components

**Upstream (provides data to this component):**
- CRM Web App [react] via rest ("Browser HTTPS")

**Downstream (consumes this component's output):**
- CRM API [nodejs] via rest ("Proxy to API (/api/v1)")
- Identity Provider [keycloak] via rest ("Proxy to IdP (/auth)")

## Acceptance Criteria Implementation Map

### REQ-016: API-First Backend Design
- Every CRM module (B2B, B2G, Events, Submissions, Publicity) has corresponding CRUD endpoints under a versioned API path (e.g., /api/v1/b2b-leads).
  - **Satisfied by:** Contract "Proxy to API (/api/v1)" (rest) to CRM API [CROSS-NODE: requires CRM API]
- An OpenAPI 3.x specification file is auto-generated and served at /api/docs, accessible to authenticated users.
  - **Satisfied by:** Contract "Proxy to API (/api/v1)" (rest) to CRM API [CROSS-NODE: requires CRM API]
- Adding a new API version (e.g., /api/v2/) does not break existing /api/v1/ consumers.
  - **Satisfied by:** Contract "Proxy to API (/api/v1)" (rest) to CRM API [CROSS-NODE: requires CRM API]

## Dependency Chain

Startup/initialization order based on edge directions and interaction patterns.

**Must be available BEFORE this node starts:**
- CRM API (synchronous call via Proxy to API (/api/v1))
- Identity Provider (synchronous call via Proxy to IdP (/auth))
- CRM Web App (provides data via Browser HTTPS (request_response))

## Error Handling Contracts

**Errors this node MUST emit to consumers:**
- HTTP error responses to CRM Web App ("Browser HTTPS"): return proper 4xx for validation errors, 401/403 for auth failures, 5xx for internal errors with correlation IDs

**Errors this node MUST handle from dependencies:**
- HTTP errors from CRM API ("Proxy to API (/api/v1)"): handle 4xx (client error), 5xx (server error), timeouts, and connection refused
- HTTP errors from Identity Provider ("Proxy to IdP (/auth)"): handle 4xx (client error), 5xx (server error), timeouts, and connection refused

**Parent Container:** Docker Compose Stack (docker-compose)
