# Test Plan: REQ-008 - B2G Opportunity Filtering & Due Date Alerts

## Testing Objectives

**Requirement:** B2G Opportunity Filtering & Due Date Alerts
**Category:** functional
**Description:** Users must be able to filter and sort B2G opportunities by Status, Agency, Focus Area, Fit Score, and Due Date. The system must visually flag opportunities whose Due Date is within a configurable threshold (default 14 days) and those that are past due.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] Opportunities with a Due Date within the configured warning threshold are highlighted with a visual indicator (e.g., amber badge) in the list view.
2. [PENDING] Opportunities with a Due Date in the past and a non-closed status are highlighted with a distinct visual indicator (e.g., red badge).
3. [PENDING] Filter controls allow narrowing by Status, Agency/Department, Focus Area, and Fit Score range; filters can be combined.

## Criterion Assessment

2 of 3 criteria have potential quality issues:

**Criterion 1:** "Opportunities with a Due Date within the configured warning threshold are highlighted with a visual indicator (e.g., amber badge) in the list view."
- Warning: Time/size constraint without a numeric value
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Add a specific threshold (e.g., 'within 200ms', 'under 5MB')

**Criterion 2:** "Opportunities with a Due Date in the past and a non-closed status are highlighted with a distinct visual indicator (e.g., red badge)."
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

#### Scenario 1: Opportunities with a Due Date within the configured warning threshold are highlighted with a visual indicator (e.g., amber badge) in the list view.
**Validates:** AC-REQ-008-1

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: Opportunities with a Due Date in the past and a non-closed status are highlighted with a distinct visual indicator (e.g., red badge).
**Validates:** AC-REQ-008-2

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: Filter controls allow narrowing by Status, Agency/Department, Focus Area, and Fit Score range; filters can be combined.
**Validates:** AC-REQ-008-3

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
