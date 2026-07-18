# Setting up your CRM For Non-Developers

This guide explains, in everyday language, what needs to happen to get your CRM running. It's written for someone who isn't a developer. Wherever a step needs technical hands, that's called out clearly so you know when to loop in someone who is good enough with AI tools, an actual developer or IT professional. This app was purpose built for the use-case and structure where you can almost completely use any of the Frontier models or a decent local model to write code with a human checking frontend feature execution. This whole app was built and troubleshooted over the course of about 4 total hours and still requires company-specific workflows, changes, and placeholders to be removed. All combined, this was architected to where changes like this are quick and simple with the use of your favorite model and very little to zero code writing on your own.

Overall: This was a build vs. buy decision. The Company has to decide if purchasing an enterprise license from a major CRM provider, or any other major Operations function for that matter, is worth time savings and setup. This providers come with their native support personnel to either deploy locally or log you into their managed systems. Sometimes it's better to buy. As a comparison, the app you see is a total of 4 work hours to build with human code checks only in the backend and deployment. The frontend and database was easily configurable with a low level AI model.

A fully usable, past-MVP CRM would take very little time to implement based on this architecture. 

> **Important:** As of this writing, the CRM's architecture has been designed but no code has been written yet. This guide covers the pieces you (or whoever manages your servers) need to have ready *before* the developers install the actual application. Think of it as preparing the building lots before construction starts.

Included in this git are two apps:
-  Fully containerized and hostable CRM using a tool called Docker either on your personal machine or via a cloud server. In order to be collaborative, the best answer is on a cloud container for multiple users to access. 
-  Google-sheet backed app variant
## The five pieces of the deployable app:

To build or deploy anything locally and not as a managed service, especially as a Company's internal processes grow, the frontend functionality becomes secondary to backend and infrastructure. This includes networking (ingress and egress traffic), identity (how your login credentials are handled), and resources.

| Piece | What it actually is | What it's for |
|---|---|---|
| **Traffic** | A web server (nginx) | The single entry point. Every request from a browser passes through here first, which then sends it to the right place inside. |
| **The website** | A React app | What your team actually sees and clicks on: the screens for leads, opportunities, events, submissions, and contacts. |
| **The brain** | A Node.js API | Does all the actual work behind the scenes saving records, checking permissions, running searches. |
| **The filing cabinet** | A PostgreSQL database | Where every record permanently lives leads, contacts, events, everything. As users internally grow, Postgres comes with an identity filtering and row level security capability. All data can be handled via SQL.|
| **Caching and Logs* | A Redis cache | Keeps track of who's currently logged in, so the system can log someone out instantly if needed. |
| **The ID checker** | A Keycloak identity server | Handles logins. It's what lets you plug in your company's existing sign-in system (Okta, Microsoft, Google, or its own built-in one) instead of building a new password system from scratch. Your developer or IT persona will need to review the Keycloak source files and do a configuration to your company setup.|

None of these run on a specific cloud provider — they're portable containers, so they can run on a laptop, an office server, or any cloud host you choose.

## Before you start: what you'll need

A few things need to be provisioned (set up and made available) before the CRM can be installed. These are infrastructure tasks — the kind of thing a developer, IT admin, or hosting provider handles. None of them involve writing code; they're closer to "installing the plumbing" than "building the house."

### 1. A place to store data (the filing cabinet)

- **What to do:** Get a PostgreSQL database running. For a quick local test, this is a single command; for real use, most teams use a managed database service (examples: Supabase, Amazon RDS, Google Cloud SQL, Neon) so it's backed up automatically.
- **What you'll be given back:** A connection address (it looks like `postgresql://user:password@host:5432/dbname`) — save this somewhere safe, the CRM's brain needs it to connect.
- **Who does this:** IT admin or hosting provider.

### 2. A place to remember who's logged in (the notepad)

- **What to do:** Get a Redis instance running — again, either locally for testing or through a managed provider (Redis Cloud, AWS ElastiCache, Upstash).
- **What you'll be given back:** A connection address like `redis://localhost:6379`.
- **Who does this:** IT admin or hosting provider.

### 3. A login system (the ID checker)

This is the step with the most manual clicking, because it involves setting preferences in an admin dashboard rather than just running a command.

- **Deploy the Keycloak server itself** (requires a Java 17+ environment if self-hosting).
- **Create a "realm" and a "client"** inside Keycloak's admin console — think of a realm as your company's private space, and a client as the registration for the CRM app itself. This tells Keycloak "yes, this app is allowed to ask me who's logging in."
- **Note down three values** the developers will need: the Keycloak web address, the realm name, and the client ID.
- *(Optional, can be done later)* Set up specific user roles/permissions inside Keycloak if you want group-based access (e.g., "everyone in the Sales group is automatically a Member").
- **Who does this:** IT admin, ideally with the developer present the first time, since redirect URLs need to match exactly what the app expects.

### 4. The front door (reverse proxy)

- **Install nginx** on whatever server will host the CRM.
- **Point it at the right places** — this is a configuration step where nginx is told "send website traffic here, send login traffic there, send API traffic over there." Your developer will typically hand you (or write directly) this configuration file.
- *(Optional but strongly recommended for anything beyond internal testing)* **Get a TLS certificate** so the site loads securely over `https://`. The easiest free option is Certbot / Let's Encrypt — it can often set this up automatically.
- **Who does this:** IT admin or developer.

### What you will *not* need to manually set up

The website (React app) and the brain (Node.js API) don't require any provisioning — they're pure application code that gets built and packaged into containers once development starts. There's nothing to "install" for these ahead of time.

## Suggested order of operations

1. Set up the database and the notepad (Redis) first — nothing else can start without them.
2. Set up Keycloak and create the realm/client, and hand the connection details to your developer.
3. Once the developers have built and packaged the website and the API as containers, set up the front door (nginx) to tie everything together.
4. Get a TLS certificate if this is going live for real users.

## After setup

Once all of the above is in place and the developers have built the application containers, running the whole system should come down to a single command (`docker compose up`) that starts everything together, using the connection details you gathered above.

## Questions or stuck partway through?

Any step above that mentions an admin console, a certificate, or "your developer" is a good moment to loop in whoever manages your technical infrastructure — these aren't steps an AI assistant can complete on your behalf, since they involve decisions specific to your organization (domain names, company logins, security certificates, etc).

---

# Developer quick start

> This section is for developers. The application is generated from the
> component specs in `.nodespec/` and `ARCHITECTURE.md`. It is **functional**:
> deploy it, log in via Keycloak, and use it. Implemented: backend-for-frontend
> OIDC login, server-side sessions, RBAC, database migrations, DB-backed CRUD
> for all modules, a redesigned dashboard with light/dark theme, advanced
> per-module filtering + CSV export, due-date badges, an events calendar view,
> and admin panels (submission categories, user roles, audit log, custom fields).
>
> **Design-expansion modules (REQ-019–025):** Companies + Account 360, Contacts
> (with detail views), a Deal Pipeline **Kanban** with revenue rollups, **B2G
> Federal Capture** (MEDDIC, teaming, stakeholders, compliance gates, capture
> stepper), Activities & Tasks, admin-defined **custom fields** per module, and
> a **responsive/mobile** layout. No fabricated metrics — revenue is computed
> from real deal amounts; MRR is intentionally omitted.

## Run the whole stack

```bash
cp .env.example .env      # defaults work out-of-the-box for local; change secrets for anything public
docker compose up --build
```

Then open <http://localhost>. Only the reverse proxy is exposed on the host
(ports 80/443); the API, database, Redis and Keycloak stay on the internal
compose network. The API runs database migrations automatically on startup
before it accepts traffic (including sample demo data so the views are
populated on first run).

## Log in and try it

Click **Log in** — you'll be redirected to Keycloak. Two demo users are seeded
by the realm import:

| User | Username | Password | Role |
|---|---|---|---|
| Admin | `admin` | `admin` | Admin (sees the Admin nav item) |
| Member | `member` | `member` | Member |

After logging in you land on the **Dashboard** (live cross-module counts). Open
any module (e.g. **B2B Leads**) to see seeded records, and use the **Add new**
form to create one and watch it appear. These are development credentials —
change them (and the `crm-api` client secret in the realm export) before any
real deployment.

Useful endpoints (through the proxy):

| URL | What |
|---|---|
| `http://localhost/` | React SPA |
| `http://localhost/api/v1/...` | Versioned REST API (module CRUD) |
| `http://localhost/api/docs` | OpenAPI 3.x docs (Swagger UI) |
| `http://localhost/healthz` | API health probe |
| `http://localhost/auth/realms/crm/...` | Keycloak (Identity Provider) |

## Layout

```
docker-compose.yml       # single-host deployment topology (all six services)
.env.example             # every supported variable, documented
db/migrations/           # numbered up/down SQL, applied by the API on startup
db/init/                 # first-boot Postgres init (Keycloak database)
services/api/            # CRM API — Node/Express/TypeScript
services/web/            # CRM Web App — React/Vite/TypeScript
services/proxy/          # Reverse proxy — nginx.conf + Dockerfile
infra/redis/redis.conf   # Session store config
infra/keycloak/          # Keycloak realm export (realm, clients, roles)
```

## Configuration

Everything environment-specific is injected via `.env` (or mounted config
files) — no secrets are baked into images. The API validates required
variables at startup and **fails fast** with a descriptive error if any are
missing. See `.env.example` for the full list.

## Outbound internet & egress configuration (REQ-026)

Inbound traffic (browser → app) enters through the nginx reverse proxy. This
section is about the **other direction** — letting the API reach the internet so
integrations like the Company 360 social feed (LinkedIn / X / Instagram /
TikTok) can call third-party APIs. In a hardened cloud network, containers have
**no route to the internet by default**, so this is a deliberate step.

**Two layers to configure:**

1. **Network route** — the host/subnet must be able to reach the internet
   (NAT gateway, internet gateway, or Cloud NAT — see per-environment notes).
2. **Application egress** — per REQ-026 the app never calls third-party hosts
   directly. Point it at your egress gateway and supply per-provider credentials
   (all optional; unset means the feature stays inert and reports "not
   connected" — it never fabricates data):

   ```bash
   # in .env (see .env.example)
   SOCIAL_EGRESS_BASE_URL=https://egress.internal   # your allowlisting gateway
   SOCIAL_LINKEDIN_TOKEN=...                          # per-platform API creds
   SOCIAL_X_TOKEN=...
   SOCIAL_INSTAGRAM_TOKEN=...
   SOCIAL_TIKTOK_TOKEN=...
   ```

   Store the tokens in a secrets manager (below), not in the repo. The egress
   gateway owns the host allowlist, credential injection, and rate limiting so
   those concerns don't sprawl into app code.

### Desktop / single host (Docker Compose on a laptop or office server)

- Docker's default bridge network already NATs outbound traffic through the
  host, so containers reach the internet with **no extra setup** — provided the
  host itself has internet access.
- **Behind a corporate proxy?** Add the standard proxy variables to the `api`
  service environment (and the Docker daemon) so outbound calls traverse it:
  ```bash
  HTTP_PROXY=http://proxy.corp:3128
  HTTPS_PROXY=http://proxy.corp:3128
  NO_PROXY=localhost,127.0.0.1,db,redis,keycloak,proxy
  ```
  Keep internal service names in `NO_PROXY` so intra-stack traffic stays local.
- If you don't run an egress gateway, leave `SOCIAL_EGRESS_BASE_URL` empty — the
  social feed shows the honest "connect a platform API" state and makes no
  outbound calls.

### AWS (ECS/EKS/EC2 in a VPC)

- **Private subnets (recommended):** create a **NAT Gateway** in a public subnet
  and add `0.0.0.0/0 → nat-…` to the private subnets' route table. Tasks keep no
  public IP; outbound still works.
- **Public subnets:** attach an **Internet Gateway** and route `0.0.0.0/0 → igw-…`;
  tasks need a public IP (`assignPublicIp: ENABLED` for Fargate).
- **Security groups** are stateful and allow all egress by default; if you've
  restricted it, allow `:443` to the egress gateway / platform endpoints.
- **Locking egress down:** front outbound traffic with **AWS Network Firewall**
  or a Squid forward proxy configured with a domain allowlist for the social
  hosts, then set `SOCIAL_EGRESS_BASE_URL` (or `HTTPS_PROXY`) to it.
- **Secrets:** keep `SOCIAL_*_TOKEN` in **Secrets Manager** or **SSM Parameter
  Store** and inject them as task-definition `secrets` (never plaintext env).

### GCP (GCE/GKE/Cloud Run)

- **Private nodes / no external IP (recommended):** enable **Cloud NAT** on the
  subnet's region so instances and GKE pods get outbound internet without public
  IPs.
- **Instances with an external IP** egress directly, subject to firewall rules.
- **Cloud Run:** reaches the internet by default. If you attach a **Serverless
  VPC connector** with *all egress through the VPC*, add **Cloud NAT** so
  internet-bound traffic still has a path.
- **Firewall:** GCP implicitly allows egress; if you added deny rules, allow
  `tcp:443` to the gateway / platform hosts.
- **Locking egress down:** use **Secure Web Proxy** or a Squid forward proxy with
  an allowlist, then point `SOCIAL_EGRESS_BASE_URL` (or `HTTPS_PROXY`) at it.
- **Secrets:** store `SOCIAL_*_TOKEN` in **Secret Manager** and mount them as
  environment variables.

> **Verifying egress:** from inside the API container, a reachable gateway/host
> returns a normal response; a missing route typically hangs until timeout, and
> a policy denial returns `403`. The social feed degrades to "not connected" in
> every failure case rather than erroring the page.

## Requirement coverage

Each generated artifact maps back to the requirements in the `.nodespec` task
documents (REQ-001 … REQ-018): pluggable OIDC/SAML identity (Keycloak realm +
API verification seam), RBAC (roles/groups + `requireRole` middleware), secure
sessions (Redis + HttpOnly/Secure/SameSite cookies), the five CRM modules,
audit logging (append-only, DB-enforced immutability), API-first design
(`/api/v1` + `/api/docs`), env-based config, versioned migrations, and
container-based deployment.
