# Task: Docker Compose Stack

## Component Purpose

**Role:** Docker Compose (Deployment Topology / Infrastructure Container)
**Technology:** Docker (OCI)
**Description:** OCI/Docker Compose deployment topology packaging the entire CRM stack for single-host deployment, with Helm chart / Kubernetes manifests provided for orchestrated deployments.
**Rationale:** OCI/Docker deployment topology packaging the entire stack (React frontend, Node/Express API, PostgreSQL, IdP, Nginx reverse proxy, Redis session store) as container images with a Docker Compose file for single-host deployments; Helm chart / K8s manifests are provided alongside for orchestrated deployments, with no hard dependency on any cloud provider's managed service (REQ-014). All environment-specific settings — DB connection strings, IdP credentials, session secrets, feature flags, and alert thresholds (e.g., B2G due-date threshold) — are injected via environment variables or mounted config files so the same images run in any environment without rebuilding (REQ-015).

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Requirements

### REQ-014: Container-Based Deployment
Category: technical | Status: in-progress
The entire application stack (frontend, backend API, and database) must be packaged as OCI-compliant container images with a provided Docker Compose file for single-host deployments and Helm chart or Kubernetes manifests for orchestrated deployments. No component should have a hard dependency on a specific cloud provider's managed service.

**Acceptance Criteria:**
- [ ] Running 'docker compose up' from the repository root starts a fully functional application with no additional manual configuration beyond supplying a .env file.
- [ ] All container images are published to a registry and tagged with semantic version numbers; no image references a 'latest' tag in production manifests.
- [ ] The application runs identically on a local developer machine, a bare-metal server, and a managed Kubernetes cluster without code changes — only environment variable differences.

### REQ-015: Environment-Based Configuration
Category: technical | Status: in-progress
All environment-specific settings (database connection strings, IdP credentials, session secrets, feature flags, and alert thresholds) must be injectable via environment variables or mounted config files so the same image runs in any environment without rebuilding.

**Acceptance Criteria:**
- [ ] A documented .env.example file lists every supported environment variable with descriptions and safe default values.
- [ ] The application fails fast at startup with a descriptive error message if a required environment variable is missing.
- [ ] No secrets, credentials, or environment-specific values are hardcoded in source code or baked into container images.

## Interface Contracts

This node is an infrastructure container (deployment topology), not a runtime service. It has no application-level request/response contracts. Its "contract" is the deployment interface: the set of container images, the Compose service graph, the shared network, named volumes, and the environment-variable surface consumed by the child services.

**Hosted services (children of the CRM Platform module + this stack):**
- Reverse Proxy (nginx) — single external entry point; ports 80/443 exposed to the host.
- CRM Web App (react) — static bundle served behind the proxy.
- CRM API (nodejs) — internal service on the compose network; not exposed directly to the host.
- Identity Provider (keycloak) — internal service, reachable via the proxy at /auth.
- CRM Database (postgresql) — internal service; data on a named volume; never exposed to the host in production.
- Session Store (redis) — internal service; not exposed to the host.

## Implementation Tasks

### 1. Author the root docker-compose.yml (REQ-014 AC0)
- [ ] Define one service per node: `reverse-proxy`, `web`, `api`, `idp`, `db`, `session-store`.
- [ ] Place all services on a single user-defined bridge network so they resolve each other by service name.
- [ ] Expose ONLY the reverse proxy to the host (80/443). Keep api, db, idp, redis on the internal network with no host port publishing.
- [ ] Add named volumes for PostgreSQL data (`pgdata`) and Keycloak/realm export persistence.
- [ ] Add `depends_on` with healthcheck conditions so `api` waits for `db` and `session-store` to be healthy before starting.
- [ ] Define healthchecks for `db` (pg_isready), `session-store` (redis-cli ping), `api` (GET /healthz), and `idp`.
- [ ] Pin every image to an explicit semantic-version tag; no `:latest` in the committed compose/production manifests (REQ-014 AC1).

### 2. Author per-service Dockerfiles / build context (REQ-014 AC0, AC2)
- [ ] Multi-stage Dockerfile for CRM API (build → slim runtime), non-root user.
- [ ] Multi-stage Dockerfile for CRM Web App (build static bundle → served by nginx or emitted for the reverse proxy).
- [ ] Reverse Proxy image based on official nginx with the project nginx.conf baked/mounted.
- [ ] Reference official postgres, redis, and keycloak images (pinned versions) — no forks or cloud-managed-service dependency (REQ-014 AC2).

### 3. Environment configuration surface (REQ-015 all ACs)
- [ ] Create `.env.example` at repo root enumerating EVERY variable with description + safe default: `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `REDIS_URL`, `SESSION_SECRET`, `SESSION_IDLE_TIMEOUT_MIN`, `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `SAML_METADATA_URL`, `IDP_ROLE_CLAIM`, `B2G_DUE_DATE_THRESHOLD_DAYS`, `SUBMISSION_DEADLINE_THRESHOLD_DAYS`, feature flags (REQ-015 AC0).
- [ ] Wire each compose service's `environment:` / `env_file:` to consume from `.env` — never hardcode values in the compose file or images (REQ-015 AC2).
- [ ] Ensure no secrets are committed: `.env` is git-ignored, only `.env.example` is tracked.
- [ ] Support mounted config files (e.g., IdP metadata XML, TLS certs) via `volumes:` bind mounts as an alternative to env vars.

### 4. Orchestrated deployment manifests (REQ-014 AC2)
- [ ] Provide a Helm chart (or plain K8s manifests) under `infra/` mirroring the compose service graph: Deployments for web/api/idp, StatefulSet for db, Deployment/StatefulSet for redis, Ingress replacing the reverse proxy where applicable.
- [ ] Map all configuration to a ConfigMap (non-secret) + Secret (credentials) so the same images run unchanged; only env differs (REQ-014 AC2).
- [ ] Pin image tags via chart `values.yaml`; no `latest`.

### 5. Startup ordering & migrations hook (supports REQ-017)
- [ ] Ensure the API container runs versioned DB migrations on startup before accepting traffic (the API owns migration logic; this stack guarantees ordering via healthcheck-gated `depends_on`).
- [ ] API must fail fast with a descriptive error if a required env var is missing (REQ-015 AC1) — verify this is surfaced through the container logs and a non-zero exit.

### 6. Documentation
- [ ] README section: `docker compose up` quick start requiring only a copied-and-filled `.env` (REQ-014 AC0).
- [ ] Document the same-image-everywhere promise and the env-only differences across local / bare-metal / K8s (REQ-014 AC2).

## Manual Setup Checklist

> The following steps require manual action by a human.

- [ ] Install Docker Engine + Docker Compose v2 on the target host.
- [ ] Copy `.env.example` to `.env` and fill in secrets (DB password, session secret, IdP client secret).
- [ ] For production: provision TLS certificates and mount them into the reverse proxy, or terminate TLS at an upstream ingress.
- [ ] For orchestrated deployments: create the Kubernetes Secret/ConfigMap from your environment values before `helm install`.
- [ ] Choose and configure a container registry; publish semantically-versioned image tags before deploying to production.

## Acceptance Criteria Implementation Map

### REQ-014: Container-Based Deployment
- Running 'docker compose up' ... starts a fully functional application with only a .env file.
  - **Satisfied by:** Root docker-compose.yml service graph (Task 1) + per-service Dockerfiles (Task 2) + .env.example (Task 3).
- All container images ... tagged with semantic version numbers; no 'latest'.
  - **Satisfied by:** Pinned image tags in compose + Helm values (Task 1, Task 4).
- The application runs identically on local / bare-metal / managed K8s ... only env differences.
  - **Satisfied by:** Provider-agnostic official images + Helm/K8s manifests mirroring compose (Task 2, Task 4).

### REQ-015: Environment-Based Configuration
- Documented .env.example lists every supported variable.
  - **Satisfied by:** .env.example authored in Task 3.
- Application fails fast at startup if a required env var is missing.
  - **Satisfied by:** Healthcheck-gated startup + API fail-fast validation surfaced via container exit (Task 5) [CROSS-NODE: validation logic lives in CRM API].
- No secrets or environment-specific values hardcoded in source or images.
  - **Satisfied by:** env_file wiring + git-ignored .env + Secret/ConfigMap split (Task 3, Task 4).

## Connected Components

This container hosts the CRM Platform module and the Reverse Proxy. It does not initiate runtime communication; it defines the deployment/network topology within which the child services communicate.
