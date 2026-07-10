# Test Plan: REQ-018 - Audit Logging

## Testing Objectives

**Requirement:** Audit Logging
**Category:** non-functional
**Description:** The system must maintain an audit log recording who created, modified, or deleted any record across all five modules, along with a timestamp and a before/after snapshot of changed fields. Logs must be queryable by administrators.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] Every create, update, and delete action on a CRM record generates an audit log entry containing: actor (user ID + display name), action type, record module, record ID, timestamp, and changed field values.
2. [PENDING] An Admin can view and filter the audit log by module, actor, action type, and date range from the admin panel.
3. [PENDING] Audit log entries are immutable — no user role can edit or delete them through the application interface.

## Criterion Assessment

All criteria appear specific and testable.

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

#### Scenario 1: Every create, update, and delete action on a CRM record generates an audit log entry containing: actor (user ID + display name), action type, record module, record ID, timestamp, and changed field values.
**Validates:** AC-REQ-018-1

**Integration context:**
- Mock/verify: CRM API -> CRM Database via "CRM Persistence" (sql)

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: An Admin can view and filter the audit log by module, actor, action type, and date range from the admin panel.
**Validates:** AC-REQ-018-2

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: Audit log entries are immutable — no user role can edit or delete them through the application interface.
**Validates:** AC-REQ-018-3

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
