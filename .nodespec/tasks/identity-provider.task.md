# Task: Identity Provider

## Component Purpose

**Role:** Auth Provider
**Technology:** Keycloak
**Description:** Authentication and identity management service
**Rationale:** Pluggable identity provider (Keycloak shown as the reference self-hosted option) supporting open standards OAuth 2.0/OIDC and SAML 2.0 so the hosting organization can connect their existing IdP (Okta, Azure AD, Google Workspace, or self-hosted Keycloak) without code changes (REQ-001). Authentication concern only: authenticates users and issues tokens carrying the claims/groups that the CRM API maps to Admin/Member roles (RBAC enforcement itself lives in the CRM API — REQ-002). It does not own application session state; the CRM API owns the secure server-side session lifecycle (REQ-003). Deployed as a swappable OCI container behind the reverse proxy.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Requirements

### REQ-001: Pluggable Identity Provider Authentication
Category: technical | Status: in-progress
The system must support authentication via multiple, configurable identity providers using open standards (OAuth 2.0 / OIDC and SAML 2.0) so the hosting organization can connect their existing IdP without code changes. Supported providers should include but not be limited to Okta, Azure AD, Google Workspace, and self-hosted solutions such as Keycloak.

**Acceptance Criteria:**
- [ ] An administrator can configure an OIDC provider by supplying issuer URL, client ID, and client secret via environment variables or a config file — no code changes required.
- [ ] An administrator can configure a SAML 2.0 provider by supplying the IdP metadata URL or XML — no code changes required.
- [ ] A user authenticated via any configured IdP receives a valid session and can access the application without being prompted to create a separate local password.
- [ ] Switching between identity providers requires only a configuration change and a container restart, not a redeployment.

### REQ-002: Role-Based Access Control
Category: functional | Status: in-progress
The system must enforce role-based access control (RBAC) with at minimum two roles: Admin (full read/write/delete across all modules and user management) and Member (read/write within assigned modules, no user management). Roles must be assignable by an Admin and mappable from IdP claims or groups.

**Acceptance Criteria:**
- [ ] A user with the Member role cannot access user management screens or delete records created by other users.
- [ ] An Admin can assign or change a user's role from the admin panel, and the change takes effect on the user's next request.
- [ ] IdP group claims can be mapped to application roles via configuration so that role assignment is automatic on login.

## Interface Contracts

### RECEIVES FROM: CRM API (backend-service)
- **Contract:** OIDC/SAML Token Verification
- **Protocol:** rest
- **Interaction:** auth
- **Transport:** http
- **Spec Format:** oauth_oidc
- **Their Technology:** nodejs

### RECEIVES FROM: Reverse Proxy (load-balancer)
- **Contract:** Proxy to IdP (/auth)
- **Protocol:** rest
- **Interaction:** request_response
- **Transport:** http
- **Spec Format:** openapi
- **Their Technology:** nginx

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
- **Contract:** OIDC Login Redirect
- **Protocol:** rest
- **Interaction:** auth
- **Transport:** http
- **Spec Format:** oauth_oidc
- **Their Technology:** react

## Technology Guidance

**Purpose:** Open-source identity and access management solution providing SSO, LDAP/AD federation, OIDC/SAML/OAuth 2.0 support, custom themes, user federation, and fine-grained authorization with self-hosted or cloud deployment

**Best Practices:**
- Use realms for tenant isolation in multi-tenant applications
- Implement OIDC for modern applications (preferred over SAML)
- Configure proper session timeouts and token lifetimes
- Use client scopes to control token claims
- Implement custom themes for brand-consistent login experience
- Export realm configuration as JSON for version control and environment promotion
- Use Docker Compose for local development, Helm for Kubernetes production
- Configure user federation (LDAP/AD) for enterprise deployments
- Use Keycloak Admin REST API for automated user management
- Enable brute-force detection and account lockout policies

**Anti-Patterns to Avoid:**
- Running Keycloak without HTTPS in production
- Not configuring proper session limits
- Using SAML when OIDC is available and simpler
- Not implementing proper backup strategy for the database
- Exposing admin console publicly without IP restrictions
- Not testing realm exports before promoting to production
- Using embedded H2 database in production (use PostgreSQL)

**Suggested File Structure:**
- `keycloak/realm-export.json` (config)
- `keycloak/docker-compose.yml` (config)
- `keycloak/themes/custom/login/theme.properties` (config)
- `keycloak/themes/custom/login/login.ftl` (doc)
- `src/auth/keycloak-config.ts` (config)
- `src/auth/keycloak-provider.tsx` (source)
- `src/middleware/keycloak-verify.ts` (source)
- `infra/keycloak/helm-values.yaml` (config)

## Manual Setup Checklist

> The following steps require manual action by a human. AI cannot complete these steps automatically.

**Quick checklist:**
- [ ] Deploy Keycloak Server *(required)*
- [ ] Create Realm and Client *(required)*
- [ ] Set Environment Variables *(required)*
- [ ] Configure Roles and Permissions *(optional)*

### Required Steps

#### [manual_workflow] Deploy Keycloak Server

Deploy Keycloak on your infrastructure (Docker, Kubernetes, or bare metal). Requires Java 17+ runtime.

```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

**Reference:** https://www.keycloak.org/getting-started

#### [dashboard_config] Create Realm and Client

Create a new realm in the Keycloak admin console, then create a client with the appropriate access type (public or confidential) and valid redirect URIs.

#### [environment_variable] Set Environment Variables

Configure Keycloak connection details in your application environment.

```bash
export KEYCLOAK_URL=https://your-keycloak-host/auth
export KEYCLOAK_REALM=your-realm
export KEYCLOAK_CLIENT_ID=your-client-id
```

### Optional Steps

#### [dashboard_config] Configure Roles and Permissions

Define realm roles and client roles in the Keycloak admin console. Assign roles to users or groups as needed for your authorization model.

## Connected Components

**Upstream (provides data to this component):**
- CRM API [nodejs] via rest ("OIDC/SAML Token Verification")
- Reverse Proxy [nginx] via rest ("Proxy to IdP (/auth)")
- CRM Web App [react] via rest ("OIDC Login Redirect")

## Acceptance Criteria Implementation Map

### REQ-001: Pluggable Identity Provider Authentication
- An administrator can configure an OIDC provider by supplying issuer URL, client ID, and client secret via environment variables or a config file — no code changes required.
  - **Satisfied by:** Contract "OIDC Login Redirect" (rest) from CRM Web App [CROSS-NODE: requires CRM Web App]
- An administrator can configure a SAML 2.0 provider by supplying the IdP metadata URL or XML — no code changes required.
  - **Satisfied by:** Contract "Proxy to IdP (/auth)" (rest) from Reverse Proxy [CROSS-NODE: requires Reverse Proxy]
- A user authenticated via any configured IdP receives a valid session and can access the application without being prompted to create a separate local password.
  - **Satisfied by:** Contract "Proxy to IdP (/auth)" (rest) from Reverse Proxy [CROSS-NODE: requires Reverse Proxy]
- Switching between identity providers requires only a configuration change and a container restart, not a redeployment.
  - **Satisfied by:** Internal logic of this component

### REQ-002: Role-Based Access Control
- A user with the Member role cannot access user management screens or delete records created by other users.
  - **Satisfied by:** Internal logic of this component
- An Admin can assign or change a user's role from the admin panel, and the change takes effect on the user's next request.
  - **Satisfied by:** Internal logic of this component
- IdP group claims can be mapped to application roles via configuration so that role assignment is automatic on login.
  - **Satisfied by:** Contract "Proxy to IdP (/auth)" (rest) from Reverse Proxy [CROSS-NODE: requires Reverse Proxy]

## Dependency Chain

Startup/initialization order based on edge directions and interaction patterns.

**Must be available BEFORE this node starts:**
- CRM API (provides data via OIDC/SAML Token Verification (auth))
- Reverse Proxy (provides data via Proxy to IdP (/auth) (request_response))
- CRM Web App (provides data via OIDC Login Redirect (auth))

## Error Handling Contracts

**Errors this node MUST emit to consumers:**
- HTTP error responses to Reverse Proxy ("Proxy to IdP (/auth)"): return proper 4xx for validation errors, 401/403 for auth failures, 5xx for internal errors with correlation IDs

**Parent Container:** CRM Platform (application-module)

## Existing Implementation

| File | Kind | Language | Status |
|------|------|----------|--------|
| `.nodespec/tests/req-001-pluggable-identity-provider-authentication.tests.md` - Test plan for requirement: Pluggable Identity Provider Authentication | test-plan | markdown | draft |
