# Test Plan: REQ-002 - Role-Based Access Control

## Testing Objectives

**Requirement:** Role-Based Access Control
**Category:** functional
**Description:** The system must enforce role-based access control (RBAC) with at minimum two roles: Admin (full read/write/delete across all modules and user management) and Member (read/write within assigned modules, no user management). Roles must be assignable by an Admin and mappable from IdP claims or groups.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] A user with the Member role cannot access user management screens or delete records created by other users.
2. [PENDING] An Admin can assign or change a user's role from the admin panel, and the change takes effect on the user's next request.
3. [PENDING] IdP group claims can be mapped to application roles via configuration so that role assignment is automatic on login.

## Criterion Assessment

1 of 3 criteria have potential quality issues:

**Criterion 1:** "A user with the Member role cannot access user management screens or delete records created by other users."
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

#### Scenario 1: A user with the Member role cannot access user management screens or delete records created by other users.
**Validates:** AC-REQ-002-1

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: An Admin can assign or change a user's role from the admin panel, and the change takes effect on the user's next request.
**Validates:** AC-REQ-002-2

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: IdP group claims can be mapped to application roles via configuration so that role assignment is automatic on login.
**Validates:** AC-REQ-002-3

**Integration context:**
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
