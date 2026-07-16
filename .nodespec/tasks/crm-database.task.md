# Task: CRM Database

## Component Purpose

**Role:** Database
**Technology:** PostgreSQL
**Description:** Persistent data storage (relational or document)
**Rationale:** Single PostgreSQL instance persisting ALL application state. Owns the relational schema for every CRM module and cross-cutting concern: B2B leads (REQ-004/005/006), B2G opportunities (REQ-007/008), events (REQ-009), submissions + submission_categories (REQ-010/011), publicity_contacts (REQ-012), and an append-only audit_log with before/after JSONB snapshots queryable by admins (REQ-018). Provides the persistence backing for concerns enforced by the CRM API: users/roles/role_assignments tables that store the RBAC model (REQ-002 storage; enforcement lives in CRM API) and the sessions table that stores server-side session records with expiry/revocation (REQ-003 storage; lifecycle managed by CRM API). Schema changes are applied via versioned migrations executed automatically on container startup (REQ-017). No cloud-managed-service dependency — runs as a plain OCI container (REQ-014).

## Project Context

A containerized, deployment-agnostic CRM platform that manages B2B leads, B2G opportunities, events, submissions, and publicity contacts. Designed to scale with future feature complexity and third-party integrations, with pluggable identity provider support so the hosting organization controls where and how the system runs.

## Requirements

### REQ-018: Audit Logging
Category: non-functional | Status: in-progress
The system must maintain an audit log recording who created, modified, or deleted any record across all five modules, along with a timestamp and a before/after snapshot of changed fields. Logs must be queryable by administrators.

**Acceptance Criteria:**
- [ ] Every create, update, and delete action on a CRM record generates an audit log entry containing: actor (user ID + display name), action type, record module, record ID, timestamp, and changed field values.
- [ ] An Admin can view and filter the audit log by module, actor, action type, and date range from the admin panel.
- [ ] Audit log entries are immutable — no user role can edit or delete them through the application interface.

### REQ-004: B2B Lead Record Management
Category: functional | Status: in-progress
Users must be able to create, view, edit, and delete B2B lead records. Each record must capture: auto-generated ID, Company Name, Industry/Vertical, Primary POC, Title/Role, Contact Email, Lead Source, Status, Pain Point/Use Case, Initial Contact Date, Next Follow-up Date, Reminder Date, and Notes.

**Acceptance Criteria:**
- [ ] A user can create a new B2B lead record with all defined fields; the system auto-generates a unique ID and timestamps the creation.
- [ ] All fields are editable after creation; changes are persisted immediately and reflected in the list view.
- [ ] Deleting a record requires a confirmation step and permanently removes it from the system.
- [ ] Contact Email is validated as a properly formatted email address before the record can be saved.

### REQ-017: Data Persistence & Schema Migrations
Category: technical | Status: in-progress
The system must use a relational database (PostgreSQL) for all persistent data. Database schema changes must be managed via versioned migrations that run automatically on container startup, ensuring the schema is always in sync with the application version.

**Acceptance Criteria:**
- [ ] All schema changes are expressed as numbered migration files tracked in version control; no ad-hoc DDL is applied manually.
- [ ] On container startup, pending migrations are applied automatically before the application begins accepting requests.
- [ ] Rolling back to a previous application version applies the corresponding down-migration without data loss for non-destructive changes.

### REQ-011: Submission Category Management
Category: functional | Status: in-progress
Administrators must be able to define and manage the list of submission categories (e.g., Award, Grant, RFP, Speaking) so the category field remains consistent and filterable across records.

**Acceptance Criteria:**
- [ ] An Admin can add, rename, or deactivate submission categories from the admin settings panel.
- [ ] The Category field on a submission record is a dropdown populated from the managed category list.
- [ ] Deactivating a category does not alter existing records that use it but prevents it from being selected on new records.

### REQ-007: B2G Opportunity Record Management
Category: functional | Status: in-progress
Users must be able to create, view, edit, and delete B2G opportunity records. Each record must capture: Notice ID, Agency/Department, Opportunity Link (URL), Due Date, Focus Area / RR Role, Fit Score (numeric or tiered), Possible Partner Company, Partner POC, Contact Email, Status, Action Officer, and Notes.

**Acceptance Criteria:**
- [ ] A user can create a B2G record with all defined fields; Notice ID must be unique and the system rejects duplicates with a clear error message.
- [ ] The Opportunity Link field renders as a clickable hyperlink in both the list and detail views, opening in a new tab.
- [ ] Fit Score accepts a numeric value between 1–10 or a configurable tier label (e.g., High/Medium/Low) and is validated on save.
- [ ] All fields are editable and changes are persisted immediately.

## Interface Contracts

### RECEIVES FROM: CRM API (backend-service)
- **Contract:** CRM Persistence
- **Protocol:** sql
- **Interaction:** data_write
- **Transport:** sql
- **Spec Format:** sql_ddl
- **Their Technology:** nodejs

**Inferred Payload (no schema defined -- implement based on this pattern):**
```
Data access pattern for "CRM Persistence" (nodejs):
  Query/mutation against CRM API using nodejs client SDK
```

## Technology Guidance

**Purpose:** Best general-purpose relational database for most application workloads. Ideal for ACID transactions, complex joins, JSONB semi-structured data, full-text search, geospatial queries (PostGIS), and vector embeddings (pgvector). Use when you need strong consistency guarantees, complex relational modeling, or advanced SQL features like CTEs, window functions, and materialized views. Default choice for Supabase-backed applications. Don't use when your workload is purely key-value lookups at extreme throughput (use Redis), append-only time-series without relational joins (use InfluxDB/TimescaleDB), or when you need automatic global distribution without manual sharding (consider CockroachDB or Spanner). PostgreSQL handles semi-structured data well via JSONB, so don't default to MongoDB just because you have some schema flexibility needs.

**SDK Initialization:**
```
// Node.js with pg\nimport { Pool } from "pg";\nconst pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 20 });\n// [Tailor to project language: Python=psycopg, Go=pgx, Rust=sqlx, .NET=Npgsql]
```

**Common API Patterns:**

#### Parameterized Query
Safe parameterized query preventing SQL injection
```
const { rows } = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [userId]);
```

#### Transaction
Multi-statement transaction with proper rollback and connection release
```
const client = await pool.connect();\ntry {\n  await client.query("BEGIN");\n  await client.query("INSERT INTO orders (user_id, total) VALUES ($1, $2)", [userId, total]);\n  await client.query("UPDATE inventory SET stock = stock - $1 WHERE product_id = $2", [qty, productId]);\n  await client.query("COMMIT");\n} catch (e) {\n  await client.query("ROLLBACK");\n  throw e;\n} finally {\n  client.release();\n}
```

#### Upsert
Insert or update on conflict using ON CONFLICT clause
```
await pool.query(\n  "INSERT INTO users (email, name) VALUES ($1, $2) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()",\n  [email, name]\n);
```

#### Full-Text Search
Full-text search with ranking using tsvector
```
SELECT id, title, ts_rank(search_vector, query) AS rank\nFROM articles, plainto_tsquery('english', $1) query\nWHERE search_vector @@ query\nORDER BY rank DESC LIMIT 20;
```

**Configuration Template:**
```
# postgresql.conf (key tuning)\nshared_buffers = '256MB'            # 25% of RAM\neffective_cache_size = '768MB'      # 75% of RAM\nwork_mem = '4MB'\nmaintenance_work_mem = '64MB'\nmax_connections = 100\nlog_min_duration_statement = 200   # Log slow queries > 200ms\nshared_preload_libraries = 'pg_stat_statements'
```

**Best Practices:**
- Use connection pooling (pgBouncer or Supabase built-in pooler) for high-concurrency apps
- Create B-tree indexes on frequently queried and foreign key columns
- Use JSONB for semi-structured data alongside relational columns
- Implement row-level security (RLS) for multi-tenant applications
- Enable pg_stat_statements for query performance analysis
- Use logical replication or streaming replication for high availability
- Run ANALYZE after bulk data loads to update query planner statistics

**Anti-Patterns to Avoid:**
- Missing indexes on foreign key columns causing slow joins
- Not using connection pooling causing "too many connections" under load
- Storing large binary files directly in the database instead of object storage
- Using SELECT * in queries pulling unnecessary columns across the wire
- Running schema migrations without testing on a staging replica first
- Choosing PostgreSQL when workload is purely key-value or time-series

**Security:** Always use parameterized queries -- never concatenate user input into SQL strings. Enable SSL/TLS for all connections (sslmode=require or verify-full). Use row-level security (RLS) policies for multi-tenant data isolation. Grant least-privilege roles: separate read-only and read-write database users. Rotate database credentials regularly and store them in a secrets manager.

**Integration Patterns:**
- Supabase or Neon for managed PostgreSQL with built-in connection pooling and APIs
- pgBouncer for connection pooling in self-managed deployments
- pgvector for AI/ML vector similarity search alongside relational data
- PostGIS for geospatial queries and location-based features
- Logical replication to read replicas for scaling read-heavy workloads

**Suggested File Structure:**
- `schema.sql` (schema)
- `migrations/` (schema)

## Manual Setup Checklist

> The following steps require manual action by a human. AI cannot complete these steps automatically.

**Quick checklist:**
- [ ] Provision PostgreSQL Instance *(required)*
- [ ] Set Database URL *(required)*

### Required Steps

#### [manual_workflow] Provision PostgreSQL Instance

Set up PostgreSQL via a managed service (Supabase, RDS, Cloud SQL, Neon) or install locally for development.

```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16
```

#### [environment_variable] Set Database URL

Configure the PostgreSQL connection URL in your environment variables.

```bash
export DATABASE_URL=postgresql://user:password@host:5432/dbname
```

## Connected Components

**Upstream (provides data to this component):**
- CRM API [nodejs] via sql ("CRM Persistence")

## Acceptance Criteria Implementation Map

### REQ-018: Audit Logging
- Every create, update, and delete action on a CRM record generates an audit log entry containing: actor (user ID + display name), action type, record module, record ID, timestamp, and changed field values.
  - **Satisfied by:** Contract "CRM Persistence" (sql) from CRM API [CROSS-NODE: requires CRM API]
- An Admin can view and filter the audit log by module, actor, action type, and date range from the admin panel.
  - **Satisfied by:** Internal logic of this component
- Audit log entries are immutable — no user role can edit or delete them through the application interface.
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

### REQ-017: Data Persistence & Schema Migrations
- All schema changes are expressed as numbered migration files tracked in version control; no ad-hoc DDL is applied manually.
  - **Satisfied by:** Internal logic of this component
- On container startup, pending migrations are applied automatically before the application begins accepting requests.
  - **Satisfied by:** Internal logic of this component
- Rolling back to a previous application version applies the corresponding down-migration without data loss for non-destructive changes.
  - **Satisfied by:** Internal logic of this component

### REQ-011: Submission Category Management
- An Admin can add, rename, or deactivate submission categories from the admin settings panel.
  - **Satisfied by:** Internal logic of this component
- The Category field on a submission record is a dropdown populated from the managed category list.
  - **Satisfied by:** Internal logic of this component
- Deactivating a category does not alter existing records that use it but prevents it from being selected on new records.
  - **Satisfied by:** Internal logic of this component

### REQ-007: B2G Opportunity Record Management
- A user can create a B2G record with all defined fields; Notice ID must be unique and the system rejects duplicates with a clear error message.
  - **Satisfied by:** Internal logic of this component
- The Opportunity Link field renders as a clickable hyperlink in both the list and detail views, opening in a new tab.
  - **Satisfied by:** Internal logic of this component
- Fit Score accepts a numeric value between 1–10 or a configurable tier label (e.g., High/Medium/Low) and is validated on save.
  - **Satisfied by:** Internal logic of this component
- All fields are editable and changes are persisted immediately.
  - **Satisfied by:** Internal logic of this component

## Dependency Chain

Startup/initialization order based on edge directions and interaction patterns.

**Depends on THIS node being available:**
- CRM API (reads from this node via CRM Persistence)

**Parent Container:** CRM Platform (application-module)

## Existing Implementation

| File | Kind | Language | Status |
|------|------|----------|--------|
| `.nodespec/tests/req-017-data-persistence-schema-migrations.tests.md` - Test plan for requirement: Data Persistence & Schema Migrations | test-plan | markdown | draft |

## Design Expansion (REQ-019–025) — new & extended schema

The Claude Design expanded the product beyond the original five modules. The following schema
changes are added as numbered migrations (0012+), all additive/nullable so existing data is
preserved:

- **companies** (REQ-020): `id, name, website, domain, industry, segment, owner_id→users, about,
  custom_fields JSONB, created_by, timestamps`.
- **contacts** (REQ-019): person-level, distinct from `publicity_contacts` — `id, full_name, title,
  email, phone, company_id→companies, owner_id→users, lifecycle_stage, tags TEXT[], notes,
  custom_fields JSONB, created_by, timestamps`.
- **b2b_leads deal fields** (REQ-021): add `amount NUMERIC, close_date DATE, owner_id→users,
  company_id→companies, contact_id→contacts`. The existing `lead_statuses` pipeline doubles as the
  Kanban stages; won = `is_closed` stage `Closed-Won`.
- **b2g_opportunities capture** (REQ-022): add `naics, set_aside, incumbent, solicitation_number,
  clearance_level, capture_stage, meddic JSONB`; child tables `b2g_teaming_partners`,
  `b2g_stakeholders`, `b2g_compliance_gates` (each FK → opportunity).
- **activities** + **tasks** (REQ-024): `activities(id, actor_id, type, subject, body, module,
  record_id, occurred_at)`; `tasks(id, title, due_date, assignee_id, status, module, record_id)`.
- **custom_field_defs** (REQ-023): `id, module, key, label, type, options JSONB, is_active`; values
  live in each record table's `custom_fields JSONB` column (JSONB approach, not EAV).
- Configurable **lifecycle stages** reuse/extend the `lead_statuses` pattern.

No recurring-revenue (MRR) columns are introduced — only one-time deal `amount` (REQ-021).
