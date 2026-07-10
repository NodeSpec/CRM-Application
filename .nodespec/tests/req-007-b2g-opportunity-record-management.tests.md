# Test Plan: REQ-007 - B2G Opportunity Record Management

## Testing Objectives

**Requirement:** B2G Opportunity Record Management
**Category:** functional
**Description:** Users must be able to create, view, edit, and delete B2G opportunity records. Each record must capture: Notice ID, Agency/Department, Opportunity Link (URL), Due Date, Focus Area / RR Role, Fit Score (numeric or tiered), Possible Partner Company, Partner POC, Contact Email, Status, Action Officer, and Notes.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] A user can create a B2G record with all defined fields; Notice ID must be unique and the system rejects duplicates with a clear error message.
2. [PENDING] The Opportunity Link field renders as a clickable hyperlink in both the list and detail views, opening in a new tab.
3. [PENDING] Fit Score accepts a numeric value between 1–10 or a configurable tier label (e.g., High/Medium/Low) and is validated on save.
4. [PENDING] All fields are editable and changes are persisted immediately.

## Criterion Assessment

2 of 4 criteria have potential quality issues:

**Criterion 2:** "The Opportunity Link field renders as a clickable hyperlink in both the list and detail views, opening in a new tab."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form

**Criterion 4:** "All fields are editable and changes are persisted immediately."
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

#### Scenario 1: A user can create a B2G record with all defined fields; Notice ID must be unique and the system rejects duplicates with a clear error message.
**Validates:** AC-REQ-007-1

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: The Opportunity Link field renders as a clickable hyperlink in both the list and detail views, opening in a new tab.
**Validates:** AC-REQ-007-2

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: Fit Score accepts a numeric value between 1–10 or a configurable tier label (e.g., High/Medium/Low) and is validated on save.
**Validates:** AC-REQ-007-3

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 4: All fields are editable and changes are persisted immediately.
**Validates:** AC-REQ-007-4

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
