# Test Plan: REQ-017 - Data Persistence & Schema Migrations

## Testing Objectives

**Requirement:** Data Persistence & Schema Migrations
**Category:** technical
**Description:** The system must use a relational database (PostgreSQL) for all persistent data. Database schema changes must be managed via versioned migrations that run automatically on container startup, ensuring the schema is always in sync with the application version.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] All schema changes are expressed as numbered migration files tracked in version control; no ad-hoc DDL is applied manually.
2. [PENDING] On container startup, pending migrations are applied automatically before the application begins accepting requests.
3. [PENDING] Rolling back to a previous application version applies the corresponding down-migration without data loss for non-destructive changes.

## Criterion Assessment

2 of 3 criteria have potential quality issues:

**Criterion 1:** "All schema changes are expressed as numbered migration files tracked in version control; no ad-hoc DDL is applied manually."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form

**Criterion 3:** "Rolling back to a previous application version applies the corresponding down-migration without data loss for non-destructive changes."
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
| CRM Database | database | postgresql |

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

#### Scenario 1: All schema changes are expressed as numbered migration files tracked in version control; no ad-hoc DDL is applied manually.
**Validates:** AC-REQ-017-1

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: On container startup, pending migrations are applied automatically before the application begins accepting requests.
**Validates:** AC-REQ-017-2

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: Rolling back to a previous application version applies the corresponding down-migration without data loss for non-destructive changes.
**Validates:** AC-REQ-017-3

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
