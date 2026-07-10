# Setting up your CRM — a plain-English guide

This guide explains, in everyday language, what needs to happen to get your CRM running. It's written for someone who isn't a developer. Wherever a step needs technical hands, that's called out clearly so you know when to loop in your developer or IT person.

> **Important:** As of this writing, the CRM's architecture has been designed but no code has been written yet. This guide covers the pieces you (or whoever manages your servers) need to have ready *before* the developers install the actual application. Think of it as preparing the building lots before construction starts.

## The five pieces, in plain terms

Your CRM isn't one single program — it's five smaller pieces working together, all packaged in containers (think of a container like a sealed, self-contained box that runs the same way on any computer). Here's what each one does:

| Piece | What it actually is | What it's for |
|---|---|---|
| **Front door** | A web server (nginx) | The single entry point. Every request from a browser passes through here first, which then sends it to the right place inside. |
| **The website** | A React app | What your team actually sees and clicks on — the screens for leads, opportunities, events, submissions, and contacts. |
| **The brain** | A Node.js API | Does all the actual work behind the scenes — saving records, checking permissions, running searches. |
| **The filing cabinet** | A PostgreSQL database | Where every record permanently lives — leads, contacts, events, everything. |
| **The notepad** | A Redis cache | Keeps track of who's currently logged in, so the system can log someone out instantly if needed. |
| **The ID checker** | A Keycloak identity server | Handles logins. It's what lets you plug in your company's existing sign-in system (Okta, Microsoft, Google, or its own built-in one) instead of building a new password system from scratch. |

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
