# Test Plan: REQ-016 - API-First Backend Design

## Testing Objectives

**Requirement:** API-First Backend Design
**Category:** technical
**Description:** The backend must expose a versioned RESTful API (e.g., /api/v1/...) that serves all five CRM modules. The API must be documented via OpenAPI 3.x so future integrations, mobile clients, or automation tools can consume it without reverse-engineering the frontend.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] Every CRM module (B2B, B2G, Events, Submissions, Publicity) has corresponding CRUD endpoints under a versioned API path (e.g., /api/v1/b2b-leads).
2. [PENDING] An OpenAPI 3.x specification file is auto-generated and served at /api/docs, accessible to authenticated users.
3. [PENDING] Adding a new API version (e.g., /api/v2/) does not break existing /api/v1/ consumers.

## Criterion Assessment

3 of 3 criteria have potential quality issues:

**Criterion 1:** "Every CRM module (B2B, B2G, Events, Submissions, Publicity) has corresponding CRUD endpoints under a versioned API path (e.g., /api/v1/b2b-leads)."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form

**Criterion 2:** "An OpenAPI 3.x specification file is auto-generated and served at /api/docs, accessible to authenticated users."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form

**Criterion 3:** "Adding a new API version (e.g., /api/v2/) does not break existing /api/v1/ consumers."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form


## Recommended Test Types

### Acceptance / BDD
- **Scope:** Requirement-level behavior validation
- **Rationale:** 3 acceptance criteria defined

### Integration
- **Scope:** Cross-component communication and data flow
- **Rationale:** 3 architectural components mapped to this requirement

## Suggested Framework

**Framework:** Vitest + React Testing Library
**Reason:** React ecosystem standard

## Architecture Components Under Test

| Component | Role | Technology |
|-----------|------|------------|
| CRM API | backend-service | nodejs |
| CRM Web App | frontend-app | react |
| Reverse Proxy | load-balancer | nginx |

## Interfaces & Contracts to Verify

- **CRM API** -> **Identity Provider** via `rest` ("OIDC/SAML Token Verification")
- **Reverse Proxy** -> **CRM API** via `rest` ("Proxy to API (/api/v1)")
- **Reverse Proxy** -> **Identity Provider** via `rest` ("Proxy to IdP (/auth)")
- **CRM Web App** -> **Identity Provider** via `rest` ("OIDC Login Redirect")
- **CRM API** -> **Session Store** via `sql` ("Session & Revocation Store")
- **CRM Web App** -> **Reverse Proxy** via `rest` ("Browser HTTPS")
- **CRM API** -> **CRM Database** via `sql` ("CRM Persistence")

## Test Strategy

<!-- Edit this section to refine the testing approach -->

### Setup & Fixtures

- [ ] Define test data fixtures
- [ ] Set up mock services for external dependencies
- [ ] Configure test environment variables

### Test Scenarios

#### Scenario 1: Every CRM module (B2B, B2G, Events, Submissions, Publicity) has corresponding CRUD endpoints under a versioned API path (e.g., /api/v1/b2b-leads).
**Validates:** AC-REQ-016-1

**Integration context:**
- Mock/verify: Reverse Proxy -> CRM API via "Proxy to API (/api/v1)" (rest)
- Mock/verify: CRM API -> CRM Database via "CRM Persistence" (sql)

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: An OpenAPI 3.x specification file is auto-generated and served at /api/docs, accessible to authenticated users.
**Validates:** AC-REQ-016-2

**Integration context:**
- Mock/verify: Reverse Proxy -> CRM API via "Proxy to API (/api/v1)" (rest)

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: Adding a new API version (e.g., /api/v2/) does not break existing /api/v1/ consumers.
**Validates:** AC-REQ-016-3

**Integration context:**
- Mock/verify: Reverse Proxy -> CRM API via "Proxy to API (/api/v1)" (rest)

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

#### Browser HTTPS (outbound: Reverse Proxy)
- [ ] should verify Browser HTTPS contract between CRM Web App and Reverse Proxy
- [ ] should handle Reverse Proxy unavailability gracefully

#### CRM Persistence (outbound: CRM Database)
- [ ] should verify CRM Persistence contract between CRM API and CRM Database
- [ ] should handle CRM Database unavailability gracefully

### Edge Cases

- [ ] Error handling paths
- [ ] Boundary conditions
- [ ] Concurrent access (if applicable)
