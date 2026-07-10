# Test Plan: REQ-014 - Container-Based Deployment

## Testing Objectives

**Requirement:** Container-Based Deployment
**Category:** technical
**Description:** The entire application stack (frontend, backend API, and database) must be packaged as OCI-compliant container images with a provided Docker Compose file for single-host deployments and Helm chart or Kubernetes manifests for orchestrated deployments. No component should have a hard dependency on a specific cloud provider's managed service.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] Running 'docker compose up' from the repository root starts a fully functional application with no additional manual configuration beyond supplying a .env file.
2. [PENDING] All container images are published to a registry and tagged with semantic version numbers; no image references a 'latest' tag in production manifests.
3. [PENDING] The application runs identically on a local developer machine, a bare-metal server, and a managed Kubernetes cluster without code changes — only environment variable differences.

## Criterion Assessment

2 of 3 criteria have potential quality issues:

**Criterion 1:** "Running 'docker compose up' from the repository root starts a fully functional application with no additional manual configuration beyond supplying a .env file."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form

**Criterion 2:** "All container images are published to a registry and tagged with semantic version numbers; no image references a 'latest' tag in production manifests."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form


## Recommended Test Types

### Acceptance / BDD
- **Scope:** Requirement-level behavior validation
- **Rationale:** 3 acceptance criteria defined

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
| Docker Compose Stack | docker-compose | docker |

## Interfaces & Contracts to Verify

- **CRM API** -> **Identity Provider** via `rest` ("OIDC/SAML Token Verification")
- **Reverse Proxy** -> **CRM API** via `rest` ("Proxy to API (/api/v1)")
- **CRM API** -> **Session Store** via `sql` ("Session & Revocation Store")
- **CRM API** -> **CRM Database** via `sql` ("CRM Persistence")

## Test Strategy

<!-- Edit this section to refine the testing approach -->

### Setup & Fixtures

- [ ] Define test data fixtures
- [ ] Set up mock services for external dependencies
- [ ] Configure test environment variables

### Test Scenarios

#### Scenario 1: Running 'docker compose up' from the repository root starts a fully functional application with no additional manual configuration beyond supplying a .env file.
**Validates:** AC-REQ-014-1

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: All container images are published to a registry and tagged with semantic version numbers; no image references a 'latest' tag in production manifests.
**Validates:** AC-REQ-014-2

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: The application runs identically on a local developer machine, a bare-metal server, and a managed Kubernetes cluster without code changes — only environment variable differences.
**Validates:** AC-REQ-014-3

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
