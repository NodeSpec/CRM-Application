# Test Plan: REQ-004 - B2B Lead Record Management

## Testing Objectives

**Requirement:** B2B Lead Record Management
**Category:** functional
**Description:** Users must be able to create, view, edit, and delete B2B lead records. Each record must capture: auto-generated ID, Company Name, Industry/Vertical, Primary POC, Title/Role, Contact Email, Lead Source, Status, Pain Point/Use Case, Initial Contact Date, Next Follow-up Date, Reminder Date, and Notes.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] A user can create a new B2B lead record with all defined fields; the system auto-generates a unique ID and timestamps the creation.
2. [PENDING] All fields are editable after creation; changes are persisted immediately and reflected in the list view.
3. [PENDING] Deleting a record requires a confirmation step and permanently removes it from the system.
4. [PENDING] Contact Email is validated as a properly formatted email address before the record can be saved.

## Criterion Assessment

1 of 4 criteria have potential quality issues:

**Criterion 3:** "Deleting a record requires a confirmation step and permanently removes it from the system."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form


## Recommended Test Types

### Acceptance / BDD
- **Scope:** Requirement-level behavior validation
- **Rationale:** 4 acceptance criteria defined

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
| CRM Database | database | postgresql |

## Interfaces & Contracts to Verify

- **CRM API** -> **Identity Provider** via `rest` ("OIDC/SAML Token Verification")
- **Reverse Proxy** -> **CRM API** via `rest` ("Proxy to API (/api/v1)")
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

#### Scenario 1: A user can create a new B2B lead record with all defined fields; the system auto-generates a unique ID and timestamps the creation.
**Validates:** AC-REQ-004-1

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: All fields are editable after creation; changes are persisted immediately and reflected in the list view.
**Validates:** AC-REQ-004-2

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: Deleting a record requires a confirmation step and permanently removes it from the system.
**Validates:** AC-REQ-004-3

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 4: Contact Email is validated as a properly formatted email address before the record can be saved.
**Validates:** AC-REQ-004-4

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
