# Test Plan: REQ-001 - Pluggable Identity Provider Authentication

## Testing Objectives

**Requirement:** Pluggable Identity Provider Authentication
**Category:** technical
**Description:** The system must support authentication via multiple, configurable identity providers using open standards (OAuth 2.0 / OIDC and SAML 2.0) so the hosting organization can connect their existing IdP without code changes. Supported providers should include but not be limited to Okta, Azure AD, Google Workspace, and self-hosted solutions such as Keycloak.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] An administrator can configure an OIDC provider by supplying issuer URL, client ID, and client secret via environment variables or a config file — no code changes required.
2. [PENDING] An administrator can configure a SAML 2.0 provider by supplying the IdP metadata URL or XML — no code changes required.
3. [PENDING] A user authenticated via any configured IdP receives a valid session and can access the application without being prompted to create a separate local password.
4. [PENDING] Switching between identity providers requires only a configuration change and a container restart, not a redeployment.

## Criterion Assessment

1 of 4 criteria have potential quality issues:

**Criterion 4:** "Switching between identity providers requires only a configuration change and a container restart, not a redeployment."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form


## Recommended Test Types

### Acceptance / BDD
- **Scope:** Requirement-level behavior validation
- **Rationale:** 4 acceptance criteria defined

### Integration
- **Scope:** Cross-component communication and data flow
- **Rationale:** 2 architectural components mapped to this requirement

## Suggested Framework

**Framework:** Vitest
**Reason:** Modern Node.js test runner

## Architecture Components Under Test

| Component | Role | Technology |
|-----------|------|------------|
| CRM API | backend-service | nodejs |
| Identity Provider | auth-provider | keycloak |

## Interfaces & Contracts to Verify

- **CRM API** -> **Identity Provider** via `rest` ("OIDC/SAML Token Verification")
- **Reverse Proxy** -> **CRM API** via `rest` ("Proxy to API (/api/v1)")
- **Reverse Proxy** -> **Identity Provider** via `rest` ("Proxy to IdP (/auth)")
- **CRM Web App** -> **Identity Provider** via `rest` ("OIDC Login Redirect")
- **CRM API** -> **Session Store** via `sql` ("Session & Revocation Store")
- **CRM API** -> **CRM Database** via `sql` ("CRM Persistence")

## Test Strategy

<!-- Edit this section to refine the testing approach -->

### Setup & Fixtures

- [ ] Define test data fixtures
- [ ] Set up mock services for external dependencies
- [ ] Configure test environment variables

### Test Scenarios

#### Scenario 1: An administrator can configure an OIDC provider by supplying issuer URL, client ID, and client secret via environment variables or a config file — no code changes required.
**Validates:** AC-REQ-001-1

**Integration context:**
- Mock/verify: CRM Web App -> Identity Provider via "OIDC Login Redirect" (rest)

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: An administrator can configure a SAML 2.0 provider by supplying the IdP metadata URL or XML — no code changes required.
**Validates:** AC-REQ-001-2

**Integration context:**
- Mock/verify: Reverse Proxy -> Identity Provider via "Proxy to IdP (/auth)" (rest)

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: A user authenticated via any configured IdP receives a valid session and can access the application without being prompted to create a separate local password.
**Validates:** AC-REQ-001-3

**Integration context:**
- Mock/verify: Reverse Proxy -> Identity Provider via "Proxy to IdP (/auth)" (rest)
- Mock/verify: CRM API -> Session Store via "Session & Revocation Store" (sql)

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 4: Switching between identity providers requires only a configuration change and a container restart, not a redeployment.
**Validates:** AC-REQ-001-4

**Integration context:**
- Mock/verify: CRM API -> Identity Provider via "OIDC/SAML Token Verification" (rest)
- Mock/verify: Reverse Proxy -> Identity Provider via "Proxy to IdP (/auth)" (rest)
- Mock/verify: CRM Web App -> Identity Provider via "OIDC Login Redirect" (rest)

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

### Contract Validation Tests

Auto-generated test descriptions verifying each contract schema is respected.

#### OIDC/SAML Token Verification (outbound: Identity Provider)
- [ ] should verify OIDC/SAML Token Verification contract between CRM API and Identity Provider
- [ ] should handle Identity Provider unavailability gracefully

#### Proxy to API (/api/v1) (outbound: CRM API)
- [ ] should verify Proxy to API (/api/v1) contract between Reverse Proxy and CRM API
- [ ] should handle CRM API unavailability gracefully

#### Proxy to IdP (/auth) (outbound: Identity Provider)
- [ ] should verify Proxy to IdP (/auth) contract between Reverse Proxy and Identity Provider
- [ ] should handle Identity Provider unavailability gracefully

#### OIDC Login Redirect (outbound: Identity Provider)
- [ ] should verify OIDC Login Redirect contract between CRM Web App and Identity Provider
- [ ] should handle Identity Provider unavailability gracefully

#### Session & Revocation Store (outbound: Session Store)
- [ ] should verify Session & Revocation Store contract between CRM API and Session Store
- [ ] should handle Session Store unavailability gracefully

#### CRM Persistence (outbound: CRM Database)
- [ ] should verify CRM Persistence contract between CRM API and CRM Database
- [ ] should handle CRM Database unavailability gracefully

### Edge Cases

- [ ] Error handling paths
- [ ] Boundary conditions
- [ ] Concurrent access (if applicable)
