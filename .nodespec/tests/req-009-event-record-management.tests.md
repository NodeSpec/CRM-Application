# Test Plan: REQ-009 - Event Record Management

## Testing Objectives

**Requirement:** Event Record Management
**Category:** functional
**Description:** Users must be able to create, view, edit, and delete event records. Each record must capture: Event Name, Date, Location, and Website URL. Events should be displayable in both list and calendar views.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] A user can create an event record with Event Name, Date, Location, and Website; all fields except Website are required.
2. [PENDING] The Website field renders as a clickable hyperlink in both list and detail views.
3. [PENDING] Events are displayed in a sortable list view (default: ascending by Date) and optionally in a monthly calendar view.
4. [PENDING] Past events remain visible in the list but are visually distinguished (e.g., greyed out or grouped under a 'Past Events' section).

## Criterion Assessment

3 of 4 criteria have potential quality issues:

**Criterion 2:** "The Website field renders as a clickable hyperlink in both list and detail views."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form

**Criterion 3:** "Events are displayed in a sortable list view (default: ascending by Date) and optionally in a monthly calendar view."
- Warning: Uncertain language -- criteria should be definitive
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form

**Criterion 4:** "Past events remain visible in the list but are visually distinguished (e.g., greyed out or grouped under a 'Past Events' section)."
- Warning: Time/size constraint without a numeric value
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Add a specific threshold (e.g., 'within 200ms', 'under 5MB')


## Recommended Test Types

### Acceptance / BDD
- **Scope:** Requirement-level behavior validation
- **Rationale:** 4 acceptance criteria defined

### Integration
- **Scope:** Cross-component communication and data flow
- **Rationale:** 2 architectural components mapped to this requirement

## Suggested Framework

**Framework:** Vitest + React Testing Library
**Reason:** React ecosystem standard

## Architecture Components Under Test

| Component | Role | Technology |
|-----------|------|------------|
| CRM API | backend-service | nodejs |
| CRM Web App | frontend-app | react |

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

#### Scenario 1: A user can create an event record with Event Name, Date, Location, and Website; all fields except Website are required.
**Validates:** AC-REQ-009-1

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: The Website field renders as a clickable hyperlink in both list and detail views.
**Validates:** AC-REQ-009-2

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: Events are displayed in a sortable list view (default: ascending by Date) and optionally in a monthly calendar view.
**Validates:** AC-REQ-009-3

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 4: Past events remain visible in the list but are visually distinguished (e.g., greyed out or grouped under a 'Past Events' section).
**Validates:** AC-REQ-009-4

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
