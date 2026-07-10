# Test Plan: REQ-003 - Session Management & Security

## Testing Objectives

**Requirement:** Session Management & Security
**Category:** non-functional
**Description:** The system must manage authenticated sessions securely, including configurable session expiry, secure cookie handling, and the ability to invalidate sessions on logout or administrative action.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] Sessions expire after a configurable idle timeout (default 30 minutes) and the user is redirected to the login page.
2. [PENDING] Session tokens are stored in HTTP-only, Secure, SameSite=Strict cookies and are not accessible via JavaScript.
3. [PENDING] Logging out immediately invalidates the server-side session so the token cannot be reused.

## Criterion Assessment

2 of 3 criteria have potential quality issues:

**Criterion 2:** "Session tokens are stored in HTTP-only, Secure, SameSite=Strict cookies and are not accessible via JavaScript."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form

**Criterion 3:** "Logging out immediately invalidates the server-side session so the token cannot be reused."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form


## Recommended Test Types

### Acceptance / BDD
- **Scope:** Requirement-level behavior validation
- **Rationale:** 3 acceptance criteria defined

### Integration
- **Scope:** Cross-component communication and data flow
- **Rationale:** 2 architectural components mapped to this requirement

### Performance / Load
- **Scope:** Response time, throughput, resource usage
- **Rationale:** Non-functional requirement - likely needs performance validation

## Suggested Framework

**Framework:** Vitest
**Reason:** Modern Node.js test runner

## Architecture Components Under Test

| Component | Role | Technology |
|-----------|------|------------|
| CRM API | backend-service | nodejs |
| Session Store | cache | redis |

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

#### Scenario 1: Sessions expire after a configurable idle timeout (default 30 minutes) and the user is redirected to the login page.
**Validates:** AC-REQ-003-1

**Integration context:**
- Mock/verify: CRM API -> Session Store via "Session & Revocation Store" (sql)

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: Session tokens are stored in HTTP-only, Secure, SameSite=Strict cookies and are not accessible via JavaScript.
**Validates:** AC-REQ-003-2

**Integration context:**
- Mock/verify: CRM API -> Identity Provider via "OIDC/SAML Token Verification" (rest)
- Mock/verify: CRM API -> Session Store via "Session & Revocation Store" (sql)

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: Logging out immediately invalidates the server-side session so the token cannot be reused.
**Validates:** AC-REQ-003-3

**Integration context:**
- Mock/verify: CRM API -> Identity Provider via "OIDC/SAML Token Verification" (rest)
- Mock/verify: CRM API -> Session Store via "Session & Revocation Store" (sql)

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
