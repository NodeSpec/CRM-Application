# Test Plan: REQ-006 - B2B Lead Filtering, Search & Export

## Testing Objectives

**Requirement:** B2B Lead Filtering, Search & Export
**Category:** functional
**Description:** Users must be able to search, filter, and sort the B2B lead list by any field, and export the current filtered view to CSV for offline use or reporting.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Acceptance Criteria

1. [PENDING] A full-text search bar filters the lead list in real time across Company Name, Primary POC, and Notes fields.
2. [PENDING] Filter controls allow narrowing by Status, Industry/Vertical, Lead Source, and date ranges for Initial Contact Date and Next Follow-up Date.
3. [PENDING] Clicking 'Export CSV' downloads a file containing all columns for the currently filtered result set, with column headers matching field names.

## Criterion Assessment

3 of 3 criteria have potential quality issues:

**Criterion 1:** "A full-text search bar filters the lead list in real time across Company Name, Primary POC, and Notes fields."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form

**Criterion 2:** "Filter controls allow narrowing by Status, Industry/Vertical, Lead Source, and date ranges for Initial Contact Date and Next Follow-up Date."
- Warning: No clear trigger or action verb -- hard to derive a test case
- Suggestion: Rewrite in 'When [trigger], [system] shall [observable outcome]' form

**Criterion 3:** "Clicking 'Export CSV' downloads a file containing all columns for the currently filtered result set, with column headers matching field names."
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

#### Scenario 1: A full-text search bar filters the lead list in real time across Company Name, Primary POC, and Notes fields.
**Validates:** AC-REQ-006-1

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 2: Filter controls allow narrowing by Status, Industry/Vertical, Lead Source, and date ranges for Initial Contact Date and Next Follow-up Date.
**Validates:** AC-REQ-006-2

- **Given:** [precondition]
- **When:** [action]
- **Then:** [expected result]

#### Scenario 3: Clicking 'Export CSV' downloads a file containing all columns for the currently filtered result set, with column headers matching field names.
**Validates:** AC-REQ-006-3

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
