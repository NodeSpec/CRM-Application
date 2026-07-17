# Task: CRM API

## Component Purpose

**Role:** Backend Service
**Technology:** Node.js
**Description:** Server-side application or microservice
**Rationale:** Single backend handling ALL business logic and API routes (REQ-016 API-first, OpenAPI 3.x documented). AUTHORITATIVE OWNER of RBAC and session security:
- REQ-002 (RBAC): Enforces role-based authorization on every /api/v1 route via middleware — Admin (full read/write/delete + user management) vs Member (read/write within assigned modules, no user management). Maps IdP claims/groups to CRM roles on login, and exposes an Admin-only role-assignment API that takes effect on the user's next request.
- REQ-003 (Session Management): Owns the secure session lifecycle — creates server-side sessions, issues HTTP-only/Secure/SameSite=Strict cookies, enforces configurable idle expiry (default 30 min), and invalidates sessions on logout or administrative action so tokens cannot be reused.
Also responsible for: CRUD + validation for all modules (REQ-004/007/009/010/012), configurable lead status pipeline & follow-up reminders (REQ-005), search/filter/sort + CSV export (REQ-006), due-date alert thresholds (REQ-008), submission category management (REQ-011), dashboard aggregation queries (REQ-013), OIDC/SAML token verification against the pluggable IdP (REQ-001), audit logging of all mutations (REQ-018), env-based configuration (REQ-015), and running versioned DB migrations on startup (REQ-017). Layered/modular so new CRM modules can be added incrementally.

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Requirements

### REQ-004: B2B Lead Record Management
Category: functional | Status: in-progress
Users must be able to create, view, edit, and delete B2B lead records. Each record must capture: auto-generated ID, Company Name, Industry/Vertical, Primary POC, Title/Role, Contact Email, Lead Source, Status, Pain Point/Use Case, Initial Contact Date, Next Follow-up Date, Reminder Date, and Notes.

**Acceptance Criteria:**
- [ ] A user can create a new B2B lead record with all defined fields; the system auto-generates a unique ID and timestamps the creation.
- [ ] All fields are editable after creation; changes are persisted immediately and reflected in the list view.
- [ ] Deleting a record requires a confirmation step and permanently removes it from the system.
- [ ] Contact Email is validated as a properly formatted email address before the record can be saved.

### REQ-008: B2G Opportunity Filtering & Due Date Alerts
Category: functional | Status: in-progress
Users must be able to filter and sort B2G opportunities by Status, Agency, Focus Area, Fit Score, and Due Date. The system must visually flag opportunities whose Due Date is within a configurable threshold (default 14 days) and those that are past due.

**Acceptance Criteria:**
- [ ] Opportunities with a Due Date within the configured warning threshold are highlighted with a visual indicator (e.g., amber badge) in the list view.
- [ ] Opportunities with a Due Date in the past and a non-closed status are highlighted with a distinct visual indicator (e.g., red badge).
- [ ] Filter controls allow narrowing by Status, Agency/Department, Focus Area, and Fit Score range; filters can be combined.

### REQ-014: Container-Based Deployment
Category: technical | Status: in-progress
The entire application stack (frontend, backend API, and database) must be packaged as OCI-compliant container images with a provided Docker Compose file for single-host deployments and Helm chart or Kubernetes manifests for orchestrated deployments. No component should have a hard dependency on a specific cloud provider's managed service.

**Acceptance Criteria:**
- [ ] Running 'docker compose up' from the repository root starts a fully functional application with no additional manual configuration beyond supplying a .env file.
- [ ] All container images are published to a registry and tagged with semantic version numbers; no image references a 'latest' tag in production manifests.
- [ ] The application runs identically on a local developer machine, a bare-metal server, and a managed Kubernetes cluster without code changes — only environment variable differences.

### REQ-006: B2B Lead Filtering, Search & Export
Category: functional | Status: in-progress
Users must be able to search, filter, and sort the B2B lead list by any field, and export the current filtered view to CSV for offline use or reporting.

**Acceptance Criteria:**
- [ ] A full-text search bar filters the lead list in real time across Company Name, Primary POC, and Notes fields.
- [ ] Filter controls allow narrowing by Status, Industry/Vertical, Lead Source, and date ranges for Initial Contact Date and Next Follow-up Date.
- [ ] Clicking 'Export CSV' downloads a file containing all columns for the currently filtered result set, with column headers matching field names.

### REQ-010: Submission Record Management
Category: functional | Status: in-progress
Users must be able to create, view, edit, and delete submission records. Each record must capture: Name, Category, Deadline, Submission Date (actual date submitted), and Website URL.

**Acceptance Criteria:**
- [ ] A user can create a submission record with all defined fields; Name, Category, and Deadline are required.
- [ ] The system visually flags submissions whose Deadline is within 14 days and have no Submission Date recorded.
- [ ] Submissions with a recorded Submission Date are marked as 'Submitted' and sorted separately from pending submissions.
- [ ] The Website field renders as a clickable hyperlink in both list and detail views.

### REQ-001: Pluggable Identity Provider Authentication
Category: technical | Status: in-progress
The system must support authentication via multiple, configurable identity providers using open standards (OAuth 2.0 / OIDC and SAML 2.0) so the hosting organization can connect their existing IdP without code changes. Supported providers should include but not be limited to Okta, Azure AD, Google Workspace, and self-hosted solutions such as Keycloak.

**Acceptance Criteria:**
- [ ] An administrator can configure an OIDC provider by supplying issuer URL, client ID, and client secret via environment variables or a config file — no code changes required.
- [ ] An administrator can configure a SAML 2.0 provider by supplying the IdP metadata URL or XML — no code changes required.
- [ ] A user authenticated via any configured IdP receives a valid session and can access the application without being prompted to create a separate local password.
- [ ] Switching between identity providers requires only a configuration change and a container restart, not a redeployment.

### REQ-003: Session Management & Security
Category: non-functional | Status: in-progress
The system must manage authenticated sessions securely, including configurable session expiry, secure cookie handling, and the ability to invalidate sessions on logout or administrative action.

**Acceptance Criteria:**
- [ ] Sessions expire after a configurable idle timeout (default 30 minutes) and the user is redirected to the login page.
- [ ] Session tokens are stored in HTTP-only, Secure, SameSite=Strict cookies and are not accessible via JavaScript.
- [ ] Logging out immediately invalidates the server-side session so the token cannot be reused.

### REQ-007: B2G Opportunity Record Management
Category: functional | Status: in-progress
Users must be able to create, view, edit, and delete B2G opportunity records. Each record must capture: Notice ID, Agency/Department, Opportunity Link (URL), Due Date, Focus Area / RR Role, Fit Score (numeric or tiered), Possible Partner Company, Partner POC, Contact Email, Status, Action Officer, and Notes.

**Acceptance Criteria:**
- [ ] A user can create a B2G record with all defined fields; Notice ID must be unique and the system rejects duplicates with a clear error message.
- [ ] The Opportunity Link field renders as a clickable hyperlink in both the list and detail views, opening in a new tab.
- [ ] Fit Score accepts a numeric value between 1–10 or a configurable tier label (e.g., High/Medium/Low) and is validated on save.
- [ ] All fields are editable and changes are persisted immediately.

### REQ-009: Event Record Management
Category: functional | Status: in-progress
Users must be able to create, view, edit, and delete event records. Each record must capture: Event Name, Date, Location, and Website URL. Events should be displayable in both list and calendar views.

**Acceptance Criteria:**
- [ ] A user can create an event record with Event Name, Date, Location, and Website; all fields except Website are required.
- [ ] The Website field renders as a clickable hyperlink in both list and detail views.
- [ ] Events are displayed in a sortable list view (default: ascending by Date) and optionally in a monthly calendar view.
- [ ] Past events remain visible in the list but are visually distinguished (e.g., greyed out or grouped under a 'Past Events' section).

### REQ-011: Submission Category Management
Category: functional | Status: in-progress
Administrators must be able to define and manage the list of submission categories (e.g., Award, Grant, RFP, Speaking) so the category field remains consistent and filterable across records.

**Acceptance Criteria:**
- [ ] An Admin can add, rename, or deactivate submission categories from the admin settings panel.
- [ ] The Category field on a submission record is a dropdown populated from the managed category list.
- [ ] Deactivating a category does not alter existing records that use it but prevents it from being selected on new records.

### REQ-012: Publicity Contact Record Management
Category: functional | Status: in-progress
Users must be able to create, view, edit, and delete publicity contact records. Each record must capture: Organization, Format (e.g., podcast, print, blog, TV), Contact Name, Email, and Notes.

**Acceptance Criteria:**
- [ ] A user can create a publicity record with Organization, Format, Contact, Email, and Notes; Organization and Email are required.
- [ ] Email is validated as a properly formatted email address before the record can be saved.
- [ ] The Format field is a configurable dropdown (e.g., Podcast, Print, Blog, TV, Online) manageable by an Admin.
- [ ] Records are searchable by Organization, Contact name, and Format from the list view.

### REQ-015: Environment-Based Configuration
Category: technical | Status: in-progress
All environment-specific settings (database connection strings, IdP credentials, session secrets, feature flags, and alert thresholds) must be injectable via environment variables or mounted config files so the same image runs in any environment without rebuilding.

**Acceptance Criteria:**
- [ ] A documented .env.example file lists every supported environment variable with descriptions and safe default values.
- [ ] The application fails fast at startup with a descriptive error message if a required environment variable is missing.
- [ ] No secrets, credentials, or environment-specific values are hardcoded in source code or baked into container images.

### REQ-017: Data Persistence & Schema Migrations
Category: technical | Status: in-progress
The system must use a relational database (PostgreSQL) for all persistent data. Database schema changes must be managed via versioned migrations that run automatically on container startup, ensuring the schema is always in sync with the application version.

**Acceptance Criteria:**
- [ ] All schema changes are expressed as numbered migration files tracked in version control; no ad-hoc DDL is applied manually.
- [ ] On container startup, pending migrations are applied automatically before the application begins accepting requests.
- [ ] Rolling back to a previous application version applies the corresponding down-migration without data loss for non-destructive changes.

### REQ-002: Role-Based Access Control
Category: functional | Status: in-progress
The system must enforce role-based access control (RBAC) with at minimum two roles: Admin (full read/write/delete across all modules and user management) and Member (read/write within assigned modules, no user management). Roles must be assignable by an Admin and mappable from IdP claims or groups.

**Acceptance Criteria:**
- [ ] A user with the Member role cannot access user management screens or delete records created by other users.
- [ ] An Admin can assign or change a user's role from the admin panel, and the change takes effect on the user's next request.
- [ ] IdP group claims can be mapped to application roles via configuration so that role assignment is automatic on login.

### REQ-013: Unified Dashboard & Cross-Module Summary
Category: functional | Status: in-progress
The application must provide a home dashboard that surfaces actionable summaries across all five modules: upcoming events, approaching submission deadlines, B2B leads due for follow-up, B2G opportunities nearing their due date, and a count of publicity contacts by format.

**Acceptance Criteria:**
- [ ] The dashboard loads within 2 seconds and displays summary widgets for all five modules without requiring navigation away from the home screen.
- [ ] Each summary widget links directly to the filtered list view for that module (e.g., clicking 'Leads Due for Follow-up' opens the B2B list pre-filtered to overdue leads).
- [ ] The dashboard reflects real-time data — refreshing the page shows the current state without a separate sync action.

### REQ-016: API-First Backend Design
Category: technical | Status: in-progress
The backend must expose a versioned RESTful API (e.g., /api/v1/...) that serves all five CRM modules. The API must be documented via OpenAPI 3.x so future integrations, mobile clients, or automation tools can consume it without reverse-engineering the frontend.

**Acceptance Criteria:**
- [ ] Every CRM module (B2B, B2G, Events, Submissions, Publicity) has corresponding CRUD endpoints under a versioned API path (e.g., /api/v1/b2b-leads).
- [ ] An OpenAPI 3.x specification file is auto-generated and served at /api/docs, accessible to authenticated users.
- [ ] Adding a new API version (e.g., /api/v2/) does not break existing /api/v1/ consumers.

### REQ-018: Audit Logging
Category: non-functional | Status: in-progress
The system must maintain an audit log recording who created, modified, or deleted any record across all five modules, along with a timestamp and a before/after snapshot of changed fields. Logs must be queryable by administrators.

**Acceptance Criteria:**
- [ ] Every create, update, and delete action on a CRM record generates an audit log entry containing: actor (user ID + display name), action type, record module, record ID, timestamp, and changed field values.
- [ ] An Admin can view and filter the audit log by module, actor, action type, and date range from the admin panel.
- [ ] Audit log entries are immutable — no user role can edit or delete them through the application interface.

### REQ-005: B2B Lead Status & Follow-up Workflow
Category: functional | Status: in-progress
The system must support a configurable lead status pipeline (e.g., New, Contacted, Qualified, Proposal, Closed-Won, Closed-Lost) and surface follow-up reminders based on the Next Follow-up Date and Reminder Date fields so users are prompted to act on time-sensitive leads.

**Acceptance Criteria:**
- [ ] A user can transition a lead through status stages using a dropdown; the available statuses are configurable by an Admin.
- [ ] The dashboard surfaces all B2B leads whose Reminder Date is today or in the past and whose status is not closed, displayed in a dedicated 'Due for Follow-up' view.
- [ ] A user can update the Next Follow-up Date and Reminder Date inline from the list view without opening the full record.

## Interface Contracts

### SENDS TO: Identity Provider (auth-provider)
- **Contract:** OIDC/SAML Token Verification
- **Protocol:** rest
- **Interaction:** auth
- **Transport:** http
- **Spec Format:** oauth_oidc
- **Their Technology:** keycloak

### RECEIVES FROM: Reverse Proxy (load-balancer)
- **Contract:** Proxy to API (/api/v1)
- **Protocol:** rest
- **Interaction:** request_response
- **Transport:** http
- **Spec Format:** openapi
- **Their Technology:** nginx

**Inferred Payload (no schema defined -- implement based on this pattern):**
```
Expected REST endpoints for "Proxy to API (/api/v1)":
  GET    /proxy to(//v1)       - List resources
  GET    /proxy to(//v1)/:id   - Get single resource
  POST   /proxy to(//v1)       - Create resource
  PUT    /proxy to(//v1)/:id   - Update resource
  DELETE /proxy to(//v1)/:id   - Delete resource
```

### SENDS TO: Session Store (cache)
- **Contract:** Session & Revocation Store
- **Protocol:** sql
- **Interaction:** data_write
- **Transport:** redis
- **Spec Format:** sql_ddl
- **Their Technology:** redis

**Inferred Payload (no schema defined -- implement based on this pattern):**
```
Data access pattern for "Session & Revocation Store" (redis):
  Query/mutation against Session Store using redis client SDK
```

### SENDS TO: CRM Database (database)
- **Contract:** CRM Persistence
- **Protocol:** sql
- **Interaction:** data_write
- **Transport:** sql
- **Spec Format:** sql_ddl
- **Their Technology:** postgresql

**Inferred Payload (no schema defined -- implement based on this pattern):**
```
Data access pattern for "CRM Persistence" (postgresql):
  Query/mutation against CRM Database using postgresql client SDK
```

## Technology Guidance

**Purpose:** JavaScript runtime for server-side applications with an event-driven, non-blocking I/O model

**SDK Initialization:**
```
npm init -y && npm install express typescript @types/express tsx && npx tsc --init\n// src/server.ts\nimport express from "express";\nconst app = express();\napp.use(express.json());\napp.listen(3000);
```

**Common API Patterns:**

#### REST Endpoint
Express route handler with async DB query and error handling
```
app.get("/api/users/:id", async (req, res) => {\n  const user = await db.users.findById(req.params.id);\n  if (!user) return res.status(404).json({ error: "Not found" });\n  res.json(user);\n});
```

#### Middleware
Authentication middleware pattern
```
function authenticate(req, res, next) {\n  const token = req.headers.authorization?.split(" ")[1];\n  if (!token) return res.status(401).json({ error: "Unauthorized" });\n  try { req.user = verifyToken(token); next(); }\n  catch { res.status(401).json({ error: "Invalid token" }); }\n}
```

#### Error Handler
Global error handling middleware
```
app.use((err, req, res, _next) => {\n  console.error(err.stack);\n  res.status(err.status || 500).json({ error: err.message || "Internal server error" });\n});
```

**Configuration Template:**
```
// tsconfig.json\n{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "NodeNext",\n    "moduleResolution": "NodeNext",\n    "outDir": "./dist",\n    "rootDir": "./src",\n    "strict": true,\n    "esModuleInterop": true,\n    "skipLibCheck": true\n  },\n  "include": ["src/**/*"]\n}
```

**Best Practices:**
- Use async/await for asynchronous operations
- Implement proper error handling middleware
- Use environment variables for configuration
- Add request validation (Zod, Joi)
- Implement rate limiting
- Use TypeScript for type safety
- Use connection pooling for databases
- Implement graceful shutdown handlers

**Anti-Patterns to Avoid:**
- Callback hell instead of async/await for asynchronous operations
- Not handling promise rejections causing silent failures
- Blocking the event loop with synchronous CPU-intensive operations
- Using console.log instead of structured logging in production
- Importing entire lodash instead of individual functions

**Security:** Use helmet middleware for secure HTTP headers. Validate all input with a schema library (zod, joi). Use parameterized queries to prevent SQL injection. Set rate limiting on public endpoints. Never expose stack traces in production error responses. Use environment variables for secrets, never hardcode. Enable CORS with explicit origin allowlists.

**Integration Patterns:**
- Express or Fastify for HTTP server framework
- Prisma, Drizzle, or Knex for type-safe database access
- Bull/BullMQ for background job processing with Redis
- Pino or Winston for structured logging
- Jest or Vitest for testing with supertest for HTTP assertions

**Suggested File Structure:**
- `src/index.ts` (source)
- `src/routes/index.ts` (source)
- `package.json` (config)
- `tsconfig.json` (config)

## Connected Components

**Upstream (provides data to this component):**
- Reverse Proxy [nginx] via rest ("Proxy to API (/api/v1)")

**Downstream (consumes this component's output):**
- Identity Provider [keycloak] via rest ("OIDC/SAML Token Verification")
- Session Store [redis] via sql ("Session & Revocation Store")
- CRM Database [postgresql] via sql ("CRM Persistence")

## Acceptance Criteria Implementation Map

### REQ-004: B2B Lead Record Management
- A user can create a new B2B lead record with all defined fields; the system auto-generates a unique ID and timestamps the creation.
  - **Satisfied by:** Internal logic of this component
- All fields are editable after creation; changes are persisted immediately and reflected in the list view.
  - **Satisfied by:** Internal logic of this component
- Deleting a record requires a confirmation step and permanently removes it from the system.
  - **Satisfied by:** Internal logic of this component
- Contact Email is validated as a properly formatted email address before the record can be saved.
  - **Satisfied by:** Internal logic of this component

### REQ-008: B2G Opportunity Filtering & Due Date Alerts
- Opportunities with a Due Date within the configured warning threshold are highlighted with a visual indicator (e.g., amber badge) in the list view.
  - **Satisfied by:** Internal logic of this component
- Opportunities with a Due Date in the past and a non-closed status are highlighted with a distinct visual indicator (e.g., red badge).
  - **Satisfied by:** Internal logic of this component
- Filter controls allow narrowing by Status, Agency/Department, Focus Area, and Fit Score range; filters can be combined.
  - **Satisfied by:** Internal logic of this component

### REQ-014: Container-Based Deployment
- Running 'docker compose up' from the repository root starts a fully functional application with no additional manual configuration beyond supplying a .env file.
  - **Satisfied by:** Internal logic of this component
- All container images are published to a registry and tagged with semantic version numbers; no image references a 'latest' tag in production manifests.
  - **Satisfied by:** Internal logic of this component
- The application runs identically on a local developer machine, a bare-metal server, and a managed Kubernetes cluster without code changes — only environment variable differences.
  - **Satisfied by:** Internal logic of this component

### REQ-006: B2B Lead Filtering, Search & Export
- A full-text search bar filters the lead list in real time across Company Name, Primary POC, and Notes fields.
  - **Satisfied by:** Internal logic of this component
- Filter controls allow narrowing by Status, Industry/Vertical, Lead Source, and date ranges for Initial Contact Date and Next Follow-up Date.
  - **Satisfied by:** Internal logic of this component
- Clicking 'Export CSV' downloads a file containing all columns for the currently filtered result set, with column headers matching field names.
  - **Satisfied by:** Internal logic of this component

### REQ-010: Submission Record Management
- A user can create a submission record with all defined fields; Name, Category, and Deadline are required.
  - **Satisfied by:** Internal logic of this component
- The system visually flags submissions whose Deadline is within 14 days and have no Submission Date recorded.
  - **Satisfied by:** Internal logic of this component
- Submissions with a recorded Submission Date are marked as 'Submitted' and sorted separately from pending submissions.
  - **Satisfied by:** Internal logic of this component
- The Website field renders as a clickable hyperlink in both list and detail views.
  - **Satisfied by:** Internal logic of this component

### REQ-001: Pluggable Identity Provider Authentication
- An administrator can configure an OIDC provider by supplying issuer URL, client ID, and client secret via environment variables or a config file — no code changes required.
  - **Satisfied by:** Internal logic of this component
- An administrator can configure a SAML 2.0 provider by supplying the IdP metadata URL or XML — no code changes required.
  - **Satisfied by:** Internal logic of this component
- A user authenticated via any configured IdP receives a valid session and can access the application without being prompted to create a separate local password.
  - **Satisfied by:** Contract "Session & Revocation Store" (sql) to Session Store [CROSS-NODE: requires Session Store]
- Switching between identity providers requires only a configuration change and a container restart, not a redeployment.
  - **Satisfied by:** Contract "OIDC/SAML Token Verification" (rest) to Identity Provider [CROSS-NODE: requires Identity Provider]

### REQ-003: Session Management & Security
- Sessions expire after a configurable idle timeout (default 30 minutes) and the user is redirected to the login page.
  - **Satisfied by:** Contract "Session & Revocation Store" (sql) to Session Store [CROSS-NODE: requires Session Store]
- Session tokens are stored in HTTP-only, Secure, SameSite=Strict cookies and are not accessible via JavaScript.
  - **Satisfied by:** Contract "OIDC/SAML Token Verification" (rest) to Identity Provider [CROSS-NODE: requires Identity Provider]
- Logging out immediately invalidates the server-side session so the token cannot be reused.
  - **Satisfied by:** Contract "OIDC/SAML Token Verification" (rest) to Identity Provider [CROSS-NODE: requires Identity Provider]

### REQ-007: B2G Opportunity Record Management
- A user can create a B2G record with all defined fields; Notice ID must be unique and the system rejects duplicates with a clear error message.
  - **Satisfied by:** Internal logic of this component
- The Opportunity Link field renders as a clickable hyperlink in both the list and detail views, opening in a new tab.
  - **Satisfied by:** Internal logic of this component
- Fit Score accepts a numeric value between 1–10 or a configurable tier label (e.g., High/Medium/Low) and is validated on save.
  - **Satisfied by:** Internal logic of this component
- All fields are editable and changes are persisted immediately.
  - **Satisfied by:** Internal logic of this component

### REQ-009: Event Record Management
- A user can create an event record with Event Name, Date, Location, and Website; all fields except Website are required.
  - **Satisfied by:** Internal logic of this component
- The Website field renders as a clickable hyperlink in both list and detail views.
  - **Satisfied by:** Internal logic of this component
- Events are displayed in a sortable list view (default: ascending by Date) and optionally in a monthly calendar view.
  - **Satisfied by:** Internal logic of this component
- Past events remain visible in the list but are visually distinguished (e.g., greyed out or grouped under a 'Past Events' section).
  - **Satisfied by:** Internal logic of this component

### REQ-011: Submission Category Management
- An Admin can add, rename, or deactivate submission categories from the admin settings panel.
  - **Satisfied by:** Internal logic of this component
- The Category field on a submission record is a dropdown populated from the managed category list.
  - **Satisfied by:** Internal logic of this component
- Deactivating a category does not alter existing records that use it but prevents it from being selected on new records.
  - **Satisfied by:** Internal logic of this component

### REQ-012: Publicity Contact Record Management
- A user can create a publicity record with Organization, Format, Contact, Email, and Notes; Organization and Email are required.
  - **Satisfied by:** Internal logic of this component
- Email is validated as a properly formatted email address before the record can be saved.
  - **Satisfied by:** Internal logic of this component
- The Format field is a configurable dropdown (e.g., Podcast, Print, Blog, TV, Online) manageable by an Admin.
  - **Satisfied by:** Internal logic of this component
- Records are searchable by Organization, Contact name, and Format from the list view.
  - **Satisfied by:** Internal logic of this component

### REQ-015: Environment-Based Configuration
- A documented .env.example file lists every supported environment variable with descriptions and safe default values.
  - **Satisfied by:** Internal logic of this component
- The application fails fast at startup with a descriptive error message if a required environment variable is missing.
  - **Satisfied by:** Internal logic of this component
- No secrets, credentials, or environment-specific values are hardcoded in source code or baked into container images.
  - **Satisfied by:** Internal logic of this component

### REQ-017: Data Persistence & Schema Migrations
- All schema changes are expressed as numbered migration files tracked in version control; no ad-hoc DDL is applied manually.
  - **Satisfied by:** Internal logic of this component
- On container startup, pending migrations are applied automatically before the application begins accepting requests.
  - **Satisfied by:** Internal logic of this component
- Rolling back to a previous application version applies the corresponding down-migration without data loss for non-destructive changes.
  - **Satisfied by:** Internal logic of this component

### REQ-002: Role-Based Access Control
- A user with the Member role cannot access user management screens or delete records created by other users.
  - **Satisfied by:** Internal logic of this component
- An Admin can assign or change a user's role from the admin panel, and the change takes effect on the user's next request.
  - **Satisfied by:** Internal logic of this component
- IdP group claims can be mapped to application roles via configuration so that role assignment is automatic on login.
  - **Satisfied by:** Internal logic of this component

### REQ-013: Unified Dashboard & Cross-Module Summary
- The dashboard loads within 2 seconds and displays summary widgets for all five modules without requiring navigation away from the home screen.
  - **Satisfied by:** Internal logic of this component
- Each summary widget links directly to the filtered list view for that module (e.g., clicking 'Leads Due for Follow-up' opens the B2B list pre-filtered to overdue leads).
  - **Satisfied by:** Internal logic of this component
- The dashboard reflects real-time data — refreshing the page shows the current state without a separate sync action.
  - **Satisfied by:** Internal logic of this component

### REQ-016: API-First Backend Design
- Every CRM module (B2B, B2G, Events, Submissions, Publicity) has corresponding CRUD endpoints under a versioned API path (e.g., /api/v1/b2b-leads).
  - **Satisfied by:** Contract "Proxy to API (/api/v1)" (rest) from Reverse Proxy [CROSS-NODE: requires Reverse Proxy]
- An OpenAPI 3.x specification file is auto-generated and served at /api/docs, accessible to authenticated users.
  - **Satisfied by:** Contract "Proxy to API (/api/v1)" (rest) from Reverse Proxy [CROSS-NODE: requires Reverse Proxy]
- Adding a new API version (e.g., /api/v2/) does not break existing /api/v1/ consumers.
  - **Satisfied by:** Contract "Proxy to API (/api/v1)" (rest) from Reverse Proxy [CROSS-NODE: requires Reverse Proxy]

### REQ-018: Audit Logging
- Every create, update, and delete action on a CRM record generates an audit log entry containing: actor (user ID + display name), action type, record module, record ID, timestamp, and changed field values.
  - **Satisfied by:** Contract "CRM Persistence" (sql) to CRM Database [CROSS-NODE: requires CRM Database]
- An Admin can view and filter the audit log by module, actor, action type, and date range from the admin panel.
  - **Satisfied by:** Internal logic of this component
- Audit log entries are immutable — no user role can edit or delete them through the application interface.
  - **Satisfied by:** Internal logic of this component

### REQ-005: B2B Lead Status & Follow-up Workflow
- A user can transition a lead through status stages using a dropdown; the available statuses are configurable by an Admin.
  - **Satisfied by:** Internal logic of this component
- The dashboard surfaces all B2B leads whose Reminder Date is today or in the past and whose status is not closed, displayed in a dedicated 'Due for Follow-up' view.
  - **Satisfied by:** Internal logic of this component
- A user can update the Next Follow-up Date and Reminder Date inline from the list view without opening the full record.
  - **Satisfied by:** Internal logic of this component

## Dependency Chain

Startup/initialization order based on edge directions and interaction patterns.

**Must be available BEFORE this node starts:**
- Reverse Proxy (provides data via Proxy to API (/api/v1) (request_response))
- Session Store (data dependency via Session & Revocation Store)
- CRM Database (data dependency via CRM Persistence)

**Depends on THIS node being available:**
- Identity Provider (receives from this node via OIDC/SAML Token Verification (auth))

## Error Handling Contracts

**Errors this node MUST emit to consumers:**
- HTTP error responses to Reverse Proxy ("Proxy to API (/api/v1)"): return proper 4xx for validation errors, 401/403 for auth failures, 5xx for internal errors with correlation IDs

**Errors this node MUST handle from dependencies:**
- Database errors from Session Store ("Session & Revocation Store"): handle connection pool exhaustion, query timeout, constraint violations, and deadlocks
- Database errors from CRM Database ("CRM Persistence"): handle connection pool exhaustion, query timeout, constraint violations, and deadlocks

**Parent Container:** CRM Platform (application-module)

## Existing Implementation

| File | Kind | Language | Status |
|------|------|----------|--------|
| `.nodespec/tests/req-015-environment-based-configuration.tests.md` - Test plan for requirement: Environment-Based Configuration | test-plan | markdown | draft |
| `.nodespec/tests/req-018-audit-logging.tests.md` - Test plan for requirement: Audit Logging | test-plan | markdown | draft |
| `.nodespec/tests/req-014-container-based-deployment.tests.md` - Test plan for requirement: Container-Based Deployment | test-plan | markdown | draft |
| `.nodespec/tests/req-009-event-record-management.tests.md` - Test plan for requirement: Event Record Management | test-plan | markdown | draft |
| `.nodespec/tests/req-011-submission-category-management.tests.md` - Test plan for requirement: Submission Category Management | test-plan | markdown | draft |
| `.nodespec/tests/req-012-publicity-contact-record-management.tests.md` - Test plan for requirement: Publicity Contact Record Management | test-plan | markdown | draft |
| `.nodespec/tests/req-010-submission-record-management.tests.md` - Test plan for requirement: Submission Record Management | test-plan | markdown | draft |
| `.nodespec/tests/req-003-session-management-security.tests.md` - Test plan for requirement: Session Management & Security | test-plan | markdown | draft |
| `.nodespec/tests/req-007-b2g-opportunity-record-management.tests.md` - Test plan for requirement: B2G Opportunity Record Management | test-plan | markdown | draft |
| `.nodespec/tests/req-006-b2b-lead-filtering-search-export.tests.md` - Test plan for requirement: B2B Lead Filtering, Search & Export | test-plan | markdown | draft |
| `.nodespec/tests/req-004-b2b-lead-record-management.tests.md` - Test plan for requirement: B2B Lead Record Management | test-plan | markdown | draft |
| `.nodespec/tests/req-008-b2g-opportunity-filtering-due-date-alerts.tests.md` - Test plan for requirement: B2G Opportunity Filtering & Due Date Alerts | test-plan | markdown | draft |
| `.nodespec/tests/req-005-b2b-lead-status-follow-up-workflow.tests.md` - Test plan for requirement: B2B Lead Status & Follow-up Workflow | test-plan | markdown | draft |
| `.nodespec/tests/req-013-unified-dashboard-cross-module-summary.tests.md` - Test plan for requirement: Unified Dashboard & Cross-Module Summary | test-plan | markdown | draft |
| `.nodespec/tests/req-002-role-based-access-control.tests.md` - Test plan for requirement: Role-Based Access Control | test-plan | markdown | draft |

## Design Expansion (REQ-019–025) — new endpoints & aggregations

New API surface added under `/api/v1`, reusing the generic `makeCrudRouter` factory where possible:

- **companies** (REQ-020), **contacts** (REQ-019), **activities** + **tasks** (REQ-024): standard
  CRUD via `makeCrudRouter` with per-module `columns`, `searchable`, and (contacts) `tags` array +
  `custom_fields` JSONB passthrough.
- **b2b-leads**: extended columns `amount, close_date, owner_id, company_id, contact_id` (REQ-021).
- **deals aggregation**: `/dashboard` gains open pipeline value + won revenue from real deal amounts;
  a pipeline/Kanban grouping (deals by `lead_statuses` stage) is exposed for the board view.
- **b2g capture** (REQ-022): opportunity gains capture columns + `meddic` JSONB; sub-resources for
  teaming partners, stakeholders, and compliance gates (nested routes or JSONB).
- **custom-field-defs** (REQ-023): admin-only CRUD (`writeRole: 'admin'`); the generic router
  accepts/returns each record's `custom_fields` JSONB.
- **/meta** extended with owners (users), lifecycle stages, and active custom-field definitions so the
  frontend renders dynamic selects/fields.
- RBAC: custom-field-defs and pipeline-stage management are Admin-only; role re-read per request
  already applies (REQ-002).

## Design Expansion (REQ-026) — Social profile integration & egress gateway

Company 360 (design 4A) lets a user store a company's official social profile URLs
(LinkedIn / X / Instagram / TikTok) and surfaces a Social activity feed.

- **Data**: `companies.social_links JSONB` (migration `0019`), keyed by platform.
  Exposed through the companies `makeCrudRouter` (`social_links` in `columns` +
  `jsonColumns`, validated by `socialLinksSchema`).
- **Feed endpoint**: `GET /api/v1/companies/:id/social-feed` (mounted before the
  companies CRUD router so the sub-route resolves first). Returns one `ChannelFeed`
  per platform: `{ connected, url, configured, posts, reason }` plus a top-level
  `live` flag.
- **Provider seam** (`modules/social`): one `SocialProvider` per platform behind a
  `GatewayProvider`. A provider only returns posts when its API credential is
  present **and** the outbound call (to be implemented at the single documented
  seam) succeeds. No credential ⇒ `configured:false`, empty `posts`, honest
  `reason` — the API never fabricates social posts.

### Architecture requirement — API gateway + egress/ingress (avoid tech debt)

Third-party/social integrations MUST NOT call external hosts directly from app
code. To keep this from becoming technical debt as more integrations are added:

- **Egress gateway** (outbound): all calls to social/third-party APIs route through
  a dedicated egress gateway (`SOCIAL_EGRESS_BASE_URL`) that owns the host
  allowlist, per-provider credential injection (`SOCIAL_*_TOKEN`), rate limiting,
  timeouts/retries, and centralized logging. App code holds no third-party secrets
  and hardcodes no third-party hostnames.
- **Ingress** (inbound): any platform webhooks (e.g. post notifications) enter
  through the reverse-proxy ingress with signature verification, not ad-hoc
  listeners.
- **Failure posture**: a missing credential or a gateway/policy denial degrades to
  an honest "not connected" state; it never invents data.

Config: `SOCIAL_EGRESS_BASE_URL`, `SOCIAL_LINKEDIN_TOKEN`, `SOCIAL_X_TOKEN`,
`SOCIAL_INSTAGRAM_TOKEN`, `SOCIAL_TIKTOK_TOKEN` (all optional; see `.env.example`).
