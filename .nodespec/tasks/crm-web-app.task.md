# Task: CRM Web App

## Component Purpose

**Role:** Frontend Application
**Technology:** React
**Description:** Client-side web application or SPA
**Rationale:** React single-page application serving the ENTIRE user-facing interface. Implements CRUD screens (create/view/edit/delete with confirmation and email validation) for all five modules: B2B leads (REQ-004) with configurable status pipeline UI and follow-up/reminder surfacing (REQ-005) plus search/filter/sort and CSV export of the filtered view (REQ-006); B2G opportunities (REQ-007) with filter/sort and visual due-date/past-due flagging against a configurable threshold (REQ-008); events in both list and calendar views (REQ-009); submissions (REQ-010) with an admin-managed category picker (REQ-011); publicity contacts (REQ-012). Provides the unified home dashboard aggregating upcoming events, approaching submission deadlines, leads due for follow-up, B2G opportunities nearing due date, and publicity-contact counts by format (REQ-013). Handles OIDC login redirect against the pluggable IdP (REQ-001) and role-aware UI that hides admin-only functions for Members (REQ-002). Served as static assets from an OCI container behind the reverse proxy (REQ-014).

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Requirements

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

### REQ-004: B2B Lead Record Management
Category: functional | Status: in-progress
Users must be able to create, view, edit, and delete B2B lead records. Each record must capture: auto-generated ID, Company Name, Industry/Vertical, Primary POC, Title/Role, Contact Email, Lead Source, Status, Pain Point/Use Case, Initial Contact Date, Next Follow-up Date, Reminder Date, and Notes.

**Acceptance Criteria:**
- [ ] A user can create a new B2B lead record with all defined fields; the system auto-generates a unique ID and timestamps the creation.
- [ ] All fields are editable after creation; changes are persisted immediately and reflected in the list view.
- [ ] Deleting a record requires a confirmation step and permanently removes it from the system.
- [ ] Contact Email is validated as a properly formatted email address before the record can be saved.

### REQ-005: B2B Lead Status & Follow-up Workflow
Category: functional | Status: in-progress
The system must support a configurable lead status pipeline (e.g., New, Contacted, Qualified, Proposal, Closed-Won, Closed-Lost) and surface follow-up reminders based on the Next Follow-up Date and Reminder Date fields so users are prompted to act on time-sensitive leads.

**Acceptance Criteria:**
- [ ] A user can transition a lead through status stages using a dropdown; the available statuses are configurable by an Admin.
- [ ] The dashboard surfaces all B2B leads whose Reminder Date is today or in the past and whose status is not closed, displayed in a dedicated 'Due for Follow-up' view.
- [ ] A user can update the Next Follow-up Date and Reminder Date inline from the list view without opening the full record.

### REQ-012: Publicity Contact Record Management
Category: functional | Status: in-progress
Users must be able to create, view, edit, and delete publicity contact records. Each record must capture: Organization, Format (e.g., podcast, print, blog, TV), Contact Name, Email, and Notes.

**Acceptance Criteria:**
- [ ] A user can create a publicity record with Organization, Format, Contact, Email, and Notes; Organization and Email are required.
- [ ] Email is validated as a properly formatted email address before the record can be saved.
- [ ] The Format field is a configurable dropdown (e.g., Podcast, Print, Blog, TV, Online) manageable by an Admin.
- [ ] Records are searchable by Organization, Contact name, and Format from the list view.

### REQ-016: API-First Backend Design
Category: technical | Status: in-progress
The backend must expose a versioned RESTful API (e.g., /api/v1/...) that serves all five CRM modules. The API must be documented via OpenAPI 3.x so future integrations, mobile clients, or automation tools can consume it without reverse-engineering the frontend.

**Acceptance Criteria:**
- [ ] Every CRM module (B2B, B2G, Events, Submissions, Publicity) has corresponding CRUD endpoints under a versioned API path (e.g., /api/v1/b2b-leads).
- [ ] An OpenAPI 3.x specification file is auto-generated and served at /api/docs, accessible to authenticated users.
- [ ] Adding a new API version (e.g., /api/v2/) does not break existing /api/v1/ consumers.

### REQ-008: B2G Opportunity Filtering & Due Date Alerts
Category: functional | Status: in-progress
Users must be able to filter and sort B2G opportunities by Status, Agency, Focus Area, Fit Score, and Due Date. The system must visually flag opportunities whose Due Date is within a configurable threshold (default 14 days) and those that are past due.

**Acceptance Criteria:**
- [ ] Opportunities with a Due Date within the configured warning threshold are highlighted with a visual indicator (e.g., amber badge) in the list view.
- [ ] Opportunities with a Due Date in the past and a non-closed status are highlighted with a distinct visual indicator (e.g., red badge).
- [ ] Filter controls allow narrowing by Status, Agency/Department, Focus Area, and Fit Score range; filters can be combined.

### REQ-013: Unified Dashboard & Cross-Module Summary
Category: functional | Status: in-progress
The application must provide a home dashboard that surfaces actionable summaries across all five modules: upcoming events, approaching submission deadlines, B2B leads due for follow-up, B2G opportunities nearing their due date, and a count of publicity contacts by format.

**Acceptance Criteria:**
- [ ] The dashboard loads within 2 seconds and displays summary widgets for all five modules without requiring navigation away from the home screen.
- [ ] Each summary widget links directly to the filtered list view for that module (e.g., clicking 'Leads Due for Follow-up' opens the B2B list pre-filtered to overdue leads).
- [ ] The dashboard reflects real-time data — refreshing the page shows the current state without a separate sync action.

### REQ-009: Event Record Management
Category: functional | Status: in-progress
Users must be able to create, view, edit, and delete event records. Each record must capture: Event Name, Date, Location, and Website URL. Events should be displayable in both list and calendar views.

**Acceptance Criteria:**
- [ ] A user can create an event record with Event Name, Date, Location, and Website; all fields except Website are required.
- [ ] The Website field renders as a clickable hyperlink in both list and detail views.
- [ ] Events are displayed in a sortable list view (default: ascending by Date) and optionally in a monthly calendar view.
- [ ] Past events remain visible in the list but are visually distinguished (e.g., greyed out or grouped under a 'Past Events' section).

## Interface Contracts

### SENDS TO: Identity Provider (auth-provider)
- **Contract:** OIDC Login Redirect
- **Protocol:** rest
- **Interaction:** auth
- **Transport:** http
- **Spec Format:** oauth_oidc
- **Their Technology:** keycloak

### SENDS TO: Reverse Proxy (load-balancer)
- **Contract:** Browser HTTPS
- **Protocol:** rest
- **Interaction:** request_response
- **Transport:** http
- **Spec Format:** openapi
- **Their Technology:** nginx

**Inferred Payload (no schema defined -- implement based on this pattern):**
```
Expected REST endpoints for "Browser HTTPS":
  GET    /browser https       - List resources
  GET    /browser https/:id   - Get single resource
  POST   /browser https       - Create resource
  PUT    /browser https/:id   - Update resource
  DELETE /browser https/:id   - Delete resource
```

## Technology Guidance

**Purpose:** Component-based UI library for building interactive single-page applications

**SDK Initialization:**
```
npm create vite@latest my-app -- --template react-ts && cd my-app && npm install\n// src/App.tsx\nexport default function App() {\n  return <div>Hello React</div>;\n}
```

**Common API Patterns:**

#### Component with State
Functional component with useState hook
```
function Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <button onClick={() => setCount(c => c + 1)}>\n      Count: {count}\n    </button>\n  );\n}
```

#### Data Fetching
Custom hook for data fetching with loading state
```
function useUsers() {\n  const [users, setUsers] = useState<User[]>([]);\n  const [loading, setLoading] = useState(true);\n  useEffect(() => {\n    fetch("/api/users").then(r => r.json()).then(setUsers).finally(() => setLoading(false));\n  }, []);\n  return { users, loading };\n}
```

#### Context Provider
Context API for global state with typed custom hook
```
const AuthContext = createContext<AuthState | null>(null);\nexport function AuthProvider({ children }: { children: ReactNode }) {\n  const [user, setUser] = useState<User | null>(null);\n  return (\n    <AuthContext.Provider value={{ user, setUser }}>\n      {children}\n    </AuthContext.Provider>\n  );\n}\nexport const useAuth = () => useContext(AuthContext)!;
```

**Configuration Template:**
```
// vite.config.ts\nimport { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({\n  plugins: [react()],\n  server: { port: 3000 },\n  build: { sourcemap: true }\n});\n\n// tsconfig.json\n{\n  "compilerOptions": {\n    "target": "ES2020",\n    "module": "ESNext",\n    "jsx": "react-jsx",\n    "strict": true,\n    "moduleResolution": "bundler"\n  }\n}
```

**Best Practices:**
- Use functional components with hooks
- Implement proper state management (lift state up, use context sparingly)
- Memoize expensive computations with useMemo/useCallback
- Use React.lazy for code splitting
- Follow the single responsibility principle per component
- Use TypeScript for type safety
- Implement error boundaries
- Use Suspense for async data loading

**Anti-Patterns to Avoid:**
- Prop drilling through many levels instead of using Context or state management
- Using useEffect for derived state that should be computed during render
- Creating new object/function references in render causing unnecessary re-renders
- Using index as key in lists with dynamic ordering or mutations
- Putting business logic directly in components instead of custom hooks

**Security:** React auto-escapes JSX output preventing most XSS. Never use dangerouslySetInnerHTML with unsanitized input. Validate and sanitize URL-based props (href, src) to prevent javascript: injection. Use Content Security Policy headers. Avoid storing sensitive tokens in localStorage -- use httpOnly cookies. Sanitize user input before passing to third-party libraries that manipulate DOM directly.

**Integration Patterns:**
- React Router for client-side routing with lazy-loaded routes
- TanStack Query (React Query) for server state management and caching
- Zustand or Jotai for lightweight client state management
- Tailwind CSS or CSS Modules for scoped styling
- Vitest + React Testing Library for component testing

**Suggested File Structure:**
- `src/App.tsx` (source)
- `src/main.tsx` (source)
- `vite.config.ts` (config)
- `tsconfig.json` (config)

## Connected Components

**Downstream (consumes this component's output):**
- Identity Provider [keycloak] via rest ("OIDC Login Redirect")
- Reverse Proxy [nginx] via rest ("Browser HTTPS")

## Acceptance Criteria Implementation Map

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

### REQ-004: B2B Lead Record Management
- A user can create a new B2B lead record with all defined fields; the system auto-generates a unique ID and timestamps the creation.
  - **Satisfied by:** Internal logic of this component
- All fields are editable after creation; changes are persisted immediately and reflected in the list view.
  - **Satisfied by:** Internal logic of this component
- Deleting a record requires a confirmation step and permanently removes it from the system.
  - **Satisfied by:** Internal logic of this component
- Contact Email is validated as a properly formatted email address before the record can be saved.
  - **Satisfied by:** Internal logic of this component

### REQ-005: B2B Lead Status & Follow-up Workflow
- A user can transition a lead through status stages using a dropdown; the available statuses are configurable by an Admin.
  - **Satisfied by:** Internal logic of this component
- The dashboard surfaces all B2B leads whose Reminder Date is today or in the past and whose status is not closed, displayed in a dedicated 'Due for Follow-up' view.
  - **Satisfied by:** Internal logic of this component
- A user can update the Next Follow-up Date and Reminder Date inline from the list view without opening the full record.
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

### REQ-016: API-First Backend Design
- Every CRM module (B2B, B2G, Events, Submissions, Publicity) has corresponding CRUD endpoints under a versioned API path (e.g., /api/v1/b2b-leads).
  - **Satisfied by:** Internal logic of this component
- An OpenAPI 3.x specification file is auto-generated and served at /api/docs, accessible to authenticated users.
  - **Satisfied by:** Internal logic of this component
- Adding a new API version (e.g., /api/v2/) does not break existing /api/v1/ consumers.
  - **Satisfied by:** Internal logic of this component

### REQ-008: B2G Opportunity Filtering & Due Date Alerts
- Opportunities with a Due Date within the configured warning threshold are highlighted with a visual indicator (e.g., amber badge) in the list view.
  - **Satisfied by:** Internal logic of this component
- Opportunities with a Due Date in the past and a non-closed status are highlighted with a distinct visual indicator (e.g., red badge).
  - **Satisfied by:** Internal logic of this component
- Filter controls allow narrowing by Status, Agency/Department, Focus Area, and Fit Score range; filters can be combined.
  - **Satisfied by:** Internal logic of this component

### REQ-013: Unified Dashboard & Cross-Module Summary
- The dashboard loads within 2 seconds and displays summary widgets for all five modules without requiring navigation away from the home screen.
  - **Satisfied by:** Internal logic of this component
- Each summary widget links directly to the filtered list view for that module (e.g., clicking 'Leads Due for Follow-up' opens the B2B list pre-filtered to overdue leads).
  - **Satisfied by:** Internal logic of this component
- The dashboard reflects real-time data — refreshing the page shows the current state without a separate sync action.
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

## Dependency Chain

Startup/initialization order based on edge directions and interaction patterns.

**Must be available BEFORE this node starts:**
- Reverse Proxy (synchronous call via Browser HTTPS)

**Depends on THIS node being available:**
- Identity Provider (receives from this node via OIDC Login Redirect (auth))

## Error Handling Contracts

**Errors this node MUST handle from dependencies:**
- HTTP errors from Reverse Proxy ("Browser HTTPS"): handle 4xx (client error), 5xx (server error), timeouts, and connection refused

**Parent Container:** CRM Platform (application-module)

## Existing Implementation

| File | Kind | Language | Status |
|------|------|----------|--------|
| `.nodespec/tests/req-016-api-first-backend-design.tests.md` - Test plan for requirement: API-First Backend Design | test-plan | markdown | draft |

## Design Expansion (REQ-019–025) — new screens

Implements the expanded Claude Design (Contacts, B2G Federal Capture, Company 360, Deals/Kanban),
reusing the existing shell (`Sidebar`/`Topbar`/`theme`), `modules.ts`, `ResourcePage`, `FilterBar`,
and `CalendarMonth`:

- **Free modules** (via `modules.ts` + `ResourcePage`): Companies, Contacts, Activities, Tasks —
  list/filter/CSV/create for each (REQ-019/020/024).
- **Bespoke views:**
  - `DealsKanban` — pipeline board, column per stage, card shows deal + amount (REQ-021).
  - `Company360` — company header with integrated Contacts / Deals / Activity (REQ-020).
  - `ContactDetail` — profile + linked company/deals/activity (REQ-019).
  - `B2GCaptureView` + `CaptureStepper` — MEDDIC, teaming, stakeholders, compliance gates, key dates,
    acquisition details (REQ-022; ports the design's `stepper.js` behavior).
  - `ActivityTimeline` + `TasksPanel` (REQ-024).
  - `CustomFieldsAdmin` drawer + a `CustomFields` renderer used by `ResourcePage` forms (REQ-023).
  - **Dashboard** widgets: pipeline value / won revenue (deal amounts), activity feed, tasks due.
- **Responsive/mobile** (REQ-025): sidebar → drawer/bottom-nav under breakpoints; tables → stacked
  cards; Company 360 / capture views reflow. No fabricated data; MRR omitted.
