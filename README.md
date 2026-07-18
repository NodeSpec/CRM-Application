# Company CRM Template
This was designed as a use-case showing the ability to utilize NodeSpec for a relatively small complexity build of a company internal CRM. This was built in the span of a few hours with requirements ("REQs" in certain sections of our readme and app), Architecture, tasks.md files and source code/configuration/schema.
<img width="2880" height="2612" alt="image" src="https://github.com/user-attachments/assets/c18d7128-a2a6-410e-9ef6-69dd9a24d8ee" />
<img width="2880" height="2612" alt="image" src="https://github.com/user-attachments/assets/6a32a6ce-a4e6-4410-bacd-b593bffdf007" />
<img width="2880" height="2612" alt="image" src="https://github.com/user-attachments/assets/6e109620-b8c4-479c-b333-869e5a9dd361" />

Included:
The purpose of the design was a build that includes modular functionality that a user with developer tools or just plain Claude Desktop, Cursor, Codex, etc could iterate without having to change any of the supporting infrastructure or even major backend services. Any feature/frontend changes would effect the react application, api, and database tables and columns.
This is a template application that still requires tweaking to customer workflows, etc.
Also included is an initial MVP for use on a google sheet backend. Note: Google sheets is not highly performant for a tool with this type of read/write logic in an App Script extension and has a noticeable lag upon record changes.

#Google Sheet Version
- Navigate to the repository's /appscript folder. 
- Create a blank google sheet
- Go to Extensions -> App script
- Copy/paste the Code.gs file and the Index.html (case sensitive) in the left Add Files "+" pane. Two total files.
- Deploy -> Web App -> Copy Url/click -> Run

Handoff changes: If you change google sheet script separately from the core deployable app version detailed below, you will have to rectify the drift/difference as two different products/apps.

#Main CRM App
# Setting up your CRM For Non-Developers

This guide explains, in everyday language, what needs to happen to get your CRM running. It's written for someone who isn't a developer. Wherever a step needs technical hands, that's called out clearly so you know when to loop in someone who is good enough with AI tools, an actual developer, or an IT professional. This app was purpose built for a workflow where you can use almost any of the frontier AI models, or a decent local model, to write code, with a human checking frontend feature execution. This whole app was built and troubleshot over about 4 total hours and still requires company-specific workflows, changes, and placeholders to be removed. Changes like this are quick and simple with the use of your favorite model and very little to zero code writing on your own.

Overall, this was a build vs. buy decision. The Company has to decide if purchasing an enterprise license from a major CRM provider, or any other major operations function for that matter, is worth the time savings and setup. Those providers come with their own support personnel to either deploy locally or log you into their managed systems. Sometimes it's better to buy. As a comparison, the app you see took a total of 4 work hours to build, with human code checks only on the backend and deployment. The frontend and database were easily configured with a low-level AI model.

A fully usable, past-MVP CRM would take very little additional time to implement based on this architecture.

Overall: This was a build vs. buy decision. The Company has to decide if purchasing an enterprise license from a major CRM provider, or any other major operations function for that matter, is worth the time savings and setup. These providers come with their own support personnel to either deploy locally or log you into their managed systems. Sometimes it is better to buy. As a comparison, the app you see is a total of 4 work hours to build with human code checks only in the backend and deployment. The frontend and database were easily configurable with a low level AI model.

Included in this git repository are two apps:
- A fully containerized, hostable CRM using a tool called Docker, either on your personal machine or on a cloud server. For multiple people to access it, the best answer is a cloud server.
- A Google Sheets backed app variant.

## The five pieces of the deployable app

To deploy anything locally, and not as a managed service, especially as a company's internal processes grow, the frontend functionality becomes secondary to backend and infrastructure. This includes networking (traffic in and out), identity (how your login credentials are handled), and resources.

- A fully containerized and hostable CRM using a tool called Docker, run either on your personal machine or on a cloud server. To be collaborative, the best answer is a cloud server so multiple users can access it. This guide covers both.
- A Google Sheets backed demo variant (see `apps-script-demo/README.md`).

## The six pieces of the deployable app

To build or deploy anything locally rather than buying a managed service, especially as a company's internal processes grow, the frontend functionality becomes secondary to backend and infrastructure. This includes networking (traffic in and out), identity (how login credentials are handled), and resources.

| Piece | What it actually is | What it is for |
|---|---|---|
| **Traffic** | A web server (nginx) | The single entry point. Every request from a browser passes through here first, and it sends each request to the right place inside. |
| **The website** | A React app | What your team actually sees and clicks on: the screens for leads, opportunities, events, submissions, and contacts. |
| **The brain** | A Node.js API | Does the actual work behind the scenes: saving records, checking permissions, running searches. |
| **The filing cabinet** | A PostgreSQL database | Where every record permanently lives: leads, contacts, events, everything. As internal users grow, Postgres comes with identity filtering and row level security. All data can be handled via SQL. |
| **Caching and logins** | A Redis cache | Keeps track of who is currently logged in, so the system can log someone out instantly if needed. |
| **The ID checker** | A Keycloak identity server | Handles logins. It lets you plug in your company's existing sign-in system (Okta, Microsoft, Google, or its own built-in one) instead of building a new password system from scratch. Your developer or IT person will need to review the Keycloak files in `infra/keycloak/` to connect it to your company's setup. |

None of these are tied to a specific cloud provider. They are portable containers that can run on a laptop, an office server, or any cloud host you choose. When you start the app, all six pieces start together with one command.

You do not install these six pieces one at a time. Docker reads the recipe file in this repository (`docker-compose.yml`) and builds and starts all of them for you.

## Two ways to run it

- **Path A: your own computer.** Good for a test drive. Only you can use it.
- **Path B: a cloud server on AWS.** The whole team can use it from a shared web address. This is the full step-by-step below.

---

## Path A: Run it on your own computer

1. Install **Docker Desktop** from <https://www.docker.com/products/docker-desktop/> (Mac or Windows). Open it once so it is running (whale icon in your menu bar or system tray).
2. Get this repository onto your computer. If someone sent you a zip, unzip it. If you use GitHub, click the green **Code** button and choose **Download ZIP**.
3. Open a terminal (Mac: Terminal app; Windows: PowerShell) and go into the folder. For example: `cd Downloads/CRM-Application`
4. Copy the settings file: `cp .env.example .env` (Windows PowerShell: `copy .env.example .env`). The defaults work for local testing.
5. Start everything: `docker compose up -d --build`. The first run takes 5 to 10 minutes while it downloads and builds.
6. Open <http://localhost> in your browser. Click **Log in** and use the demo account: username `admin`, password `admin`.

To stop it later: `docker compose down`. Your data is kept and comes back the next time you start it.

---

## Path B: Step-by-step on AWS

This walks you from logging into AWS to a working CRM your team can reach in a browser. Budget 45 to 60 minutes the first time. Expect roughly 35 to 70 US dollars per month depending on the server size you pick (exact prices vary by region; AWS shows them during setup).

You will do six things:

1. Log into AWS and create a server.
2. Give the server a permanent address.
3. Open the server's terminal in your browser and install Docker.
4. Put the app on the server and fill in its settings.
5. Start the containers.
6. Tell Keycloak (the login system) about your new address, then log in.

### Step 1: Log into AWS and create a server

1. Go to <https://console.aws.amazon.com> and sign in. If your company has no AWS account yet, click **Create a new AWS account** and follow the prompts (you will need a credit card).
2. In the top right corner, check the **region** (for example "N. Virginia us-east-1"). Pick the one closest to your team and remember it. Everything you create lives in that region, and if you later "lose" your server, the most common reason is looking in the wrong region.
3. In the search bar at the top, type **EC2** and click the EC2 result. EC2 is AWS's name for rentable servers.
4. Click the orange **Launch instance** button.
5. Fill in the form from top to bottom:
   - **Name:** `crm-server`
   - **Application and OS Images:** click **Ubuntu**, and in the dropdown pick **Ubuntu Server 24.04 LTS**.
   - **Instance type:** pick **t3.large** (comfortable, about 60 USD/month). **t3.medium** (about 30 USD/month) also works but is slower on the first build.
   - **Key pair:** choose **Proceed without a key pair**. You will use AWS's browser terminal instead, so you do not need to manage key files.
   - **Network settings:** tick all three checkboxes: **Allow SSH traffic from** (leave "Anywhere" for now), **Allow HTTPS traffic from the internet**, and **Allow HTTP traffic from the internet**.
   - **Configure storage:** change the size to **30** GiB.
6. Click **Launch instance**, then click the instance id link (starts with `i-`) to watch it. Wait until **Instance state** says **Running** (about a minute).

### Step 2: Give the server a permanent address

By default the server's web address changes every time it is stopped and started. Fix that now so you only configure the app once.

1. In the EC2 left menu, under **Network & Security**, click **Elastic IPs**.
2. Click **Allocate Elastic IP address**, then **Allocate**.
3. Select the new address, click **Actions**, then **Associate Elastic IP address**.
4. Under **Instance**, pick `crm-server`, then click **Associate**.
5. Write down the address (four numbers with dots, for example `3.92.14.203`). In the rest of this guide, wherever you see `YOUR-SERVER-IP`, type this address instead.

### Step 3: Open the server's terminal and install Docker

1. In the EC2 left menu click **Instances**, tick the box next to `crm-server`, and click **Connect** (top of the page).
2. Stay on the **EC2 Instance Connect** tab and click the orange **Connect** button. A black terminal window opens in your browser. This is the server. You type commands at the green prompt and press Enter.
3. Copy and paste the following, then press Enter. It installs Docker (paste tip: right-click inside the terminal, or use Ctrl+Shift+V):

   ```bash
   sudo apt-get update && curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker ubuntu
   ```

   This takes a minute or two and prints a lot of text. That is normal.
4. Close the terminal tab, then repeat steps 1 and 2 to open a fresh one. This makes the permission change take effect.
5. Check it worked by typing `docker --version` and pressing Enter. You should see a version number, not an error.

### Step 4: Put the app on the server and fill in its settings

1. In the terminal, download the app. If the repository is private, ask whoever manages it for the exact command to paste; it will look like this:

   ```bash
   git clone https://github.com/NodeSpec/CRM-Application.git
   cd CRM-Application
   ```

2. Create the settings file from the template:

   ```bash
   cp .env.example .env
   nano .env
   ```

   `nano` is a small text editor that opens right in the terminal. Move with the arrow keys.
3. Change these lines. Everything else can stay as is for now.
   - `POSTGRES_PASSWORD=change-me-postgres` : replace `change-me-postgres` with a password you invent. **Important:** the same text also appears a few lines down inside `DATABASE_URL`. Change it in both places so they match.
   - `REDIS_PASSWORD=change-me-redis` : same idea, and the same text also appears inside `REDIS_URL`. Change both.
   - `SESSION_SECRET=...` : replace with a long random sentence, at least 32 characters.
   - `APP_BASE_URL=http://localhost` : change to `http://YOUR-SERVER-IP`
   - `OIDC_ISSUER_URL=http://localhost/auth/realms/crm` : change only the `localhost` part, so it reads `http://YOUR-SERVER-IP/auth/realms/crm`
   - `KEYCLOAK_ADMIN_PASSWORD=change-me-keycloak-admin` : replace with a strong password you invent. This is the master key to the login system. Save it in your password manager.
4. Save and exit: press **Ctrl+O**, then **Enter**, then **Ctrl+X**.

### Step 5: Start the containers

1. Type this and press Enter:

   ```bash
   docker compose up -d --build
   ```

   The first run takes 5 to 10 minutes. It downloads and builds all six pieces.
2. When the prompt comes back, check the status:

   ```bash
   docker compose ps
   ```

   You should see six services with **Up** or **Up (healthy)** in the STATUS column: `reverse-proxy`, `web`, `api`, `idp` (that is Keycloak), `db`, and `session-store`. If one says Restarting, wait a minute and run the command again; Keycloak in particular is slow to start.

### Step 6: Tell Keycloak about your address, then log in

The login system ships configured for `localhost` (running on your own machine). One-time fix: tell it your server's real address, or it will refuse logins with an "invalid redirect" message.

1. In your browser, go to `http://YOUR-SERVER-IP/auth`
2. Click **Administration Console** and sign in with username `admin` and the `KEYCLOAK_ADMIN_PASSWORD` you set in Step 4.
3. In the top left there is a dropdown that says **master**. Click it and switch to **crm**. (Keycloak keeps its own admin space, called master, separate from your CRM's space, called crm.)
4. In the left menu click **Clients**, then click **crm-web** in the list:
   - Find **Valid redirect URIs**, click **Add valid redirect URIs**, and type `http://YOUR-SERVER-IP/*`
   - Find **Web origins**, click add, and type `http://YOUR-SERVER-IP`
   - Scroll down and click **Save**.
5. Go back to **Clients** and click **crm-api**:
   - **Valid redirect URIs:** add `http://YOUR-SERVER-IP/api/v1/auth/callback`
   - **Web origins:** add `http://YOUR-SERVER-IP`
   - Click **Save**.
6. Now open `http://YOUR-SERVER-IP` in your browser. You should see the CRM. Click **Log in** and use the demo account: username `admin`, password `admin`. You should land on the dashboard with sample data.

### Step 7: Change the demo passwords and add your team

Do this right away. The demo passwords are public knowledge (they are printed in this file).

1. Go to `http://YOUR-SERVER-IP/auth`, open the **Administration Console**, sign in, and switch **master** to **crm** (same as before).
2. Click **Users** in the left menu. You will see `admin` and `member`.
3. Click **admin**, open the **Credentials** tab, click **Reset password**, type a new password, switch **Temporary** to **Off**, and save. Repeat for `member` (or delete that user if you do not want it).
4. To add a coworker: on the Users page click **Add user**, fill in a username and their email, and click **Create**. Then:
   - **Credentials** tab: **Set password**, switch **Temporary** to **On** so they are asked to change it on first login.
   - **Groups** tab: click **Join Group** and pick **Admins** (full access, sees the Admin menu) or **Members** (regular access).
5. That person can now sign in at `http://YOUR-SERVER-IP`.

### Everyday operations

Open the server terminal the same way as in Step 3 (EC2, tick `crm-server`, Connect), then `cd CRM-Application` first.

| You want to | Type this |
|---|---|
| Check everything is running | `docker compose ps` |
| Restart the app | `docker compose restart` |
| See recent activity or errors | `docker compose logs --tail 100 api` |
| Stop the app (data is kept) | `docker compose down` |
| Start it again | `docker compose up -d` |
| Install an update your developer pushed | `git pull` then `docker compose up -d --build` |

To pause the monthly server bill (for example, over a holiday): in the EC2 console tick `crm-server`, click **Instance state**, then **Stop instance**. Start it again the same way later. Your Elastic IP address and all data are kept. A stopped server still bills a few dollars a month for the disk and the reserved address.

The website (React app) and the brain (Node.js API) don't require any provisioning. They're pure application code that gets built and packaged into containers once development starts. There's nothing to install for these ahead of time.

## Step by step: doing this on AWS

This section walks a non-technical person through the actual clicking, from opening AWS for the first time to a running server with Keycloak's admin panel open. If any step below feels unfamiliar or risky (creating IAM users, opening ports, handling secrets), that's a good moment to hand it to your IT admin or developer instead of pushing through alone.

### Step 1: Log into AWS

1. Go to `https://aws.amazon.com` in your browser and click **Sign In to the Console** in the top right.
2. If the Company already has an AWS account, use the account ID or alias, your IAM username, and your password given to you by whoever manages your AWS account. Do not use the root account for day-to-day work if you can avoid it.
3. If nobody has an AWS account yet, click **Create an AWS Account** and follow the prompts. This requires a credit card and a phone number for verification. Once the account exists, ask an admin to create you an IAM user (a normal login, not the all-powerful root login) instead of using the root credentials going forward.
4. Once you're in, you'll land on the **AWS Management Console**. There's a search bar at the top. This is how you'll get to everything else in this guide, so get comfortable typing a service name in there and pressing Enter.
5. In the top right corner, confirm you're in the AWS region closest to your team (for example `us-east-1` for the eastern US, or `eu-west-1` for western Europe). Everything you create should stay in that same region so it can all talk to each other.

### Step 2: Launch a server to run the containers on

1. In the search bar, type **EC2** and click on it.
2. Click the orange **Launch Instance** button.
3. Give it a name, something like `crm-server`.
4. Under **Application and OS Images**, choose **Ubuntu**, and pick the version marked "LTS" (this means Long Term Support, a stable release).
5. Under **Instance type**, choose `t3.medium` to start. You can resize this later if it turns out to be too small or too big.
6. Under **Key pair**, click **Create new key pair**, give it a name, leave the defaults, and click **Create key pair**. A file will download to your computer. You will not need this file if you use the browser-based connection method in Step 3, but keep it somewhere safe anyway.
7. Under **Network settings**, click **Edit** and make sure these three rules exist, adding any that are missing with **Add security group rule**:
   - SSH, port 22, source "My IP" (so only your current internet connection can use it)
   - HTTP, port 80, source "Anywhere"
   - HTTPS, port 443, source "Anywhere"
8. Under **Configure storage**, 20 GB is a reasonable starting point.
9. Click **Launch Instance**. After a minute or two, its status will change to "Running."

### Step 3: Connect to the server without needing any special software

1. From the EC2 dashboard, click **Instances** on the left, then click the checkbox next to your new server.
2. Click the **Connect** button near the top of the page.
3. Choose the **EC2 Instance Connect** tab and click the orange **Connect** button. This opens a terminal window directly in your browser. No SSH client or key file needed.
4. You now have a command line into your server. Every command in the steps below gets typed here and followed by Enter.

### Step 4: Install Docker on the server

Copy and paste each block below into the browser terminal one at a time, pressing Enter after each and waiting for it to finish before pasting the next.

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER
```

After that last command, type `exit` to close the terminal, then repeat Step 3 to reconnect. This refreshes your permissions so you don't have to type `sudo` before every Docker command.

### Step 5: Get the CRM's files onto the server

Ask your developer for the git repository address, then run:

```bash
git clone <the repository address your developer gave you>
cd <the folder name that git created>
cp .env.example .env
```

If your developer gave you specific values to put in the `.env` file (database address, Redis address, Keycloak settings), open it now with a simple text editor built into the terminal:

```bash
nano .env
```

Make your changes, then press `Ctrl+O` to save, Enter to confirm the filename, and `Ctrl+X` to exit.

### Step 6: Start the containers

```bash
docker compose up --build -d
```

The `-d` runs it in the background so closing the browser terminal won't stop it. This step downloads and builds everything, so it can take several minutes the first time. When it finishes, check that everything is running:

```bash
docker compose ps
```

You should see a list of services (proxy, web, api, db, redis, keycloak) all showing a status of "Up" or "running."

### Step 7: Find your server's address

1. Back in the EC2 console, click on your instance.
2. Look for **Public IPv4 address** in the details panel and copy it.
3. In a browser, go to `http://<that address>`. You should see the CRM's login screen. This confirms the front door (nginx), the website, and the API are all reachable.

A raw IP address like this works fine for testing. For anything your team will use regularly, ask your developer or IT admin to point a real domain name at this address and add the TLS certificate mentioned earlier, so people connect over `https://` instead.

### Step 8: Get into Keycloak's admin portal

1. In the same browser, go to `http://<your server's public address>/auth` (your developer may have configured a different path, for example `/auth/admin`, so double check with them if this doesn't load).
2. Click **Administration Console**.
3. Log in with the initial admin username and password. These come from the `KEYCLOAK_ADMIN` and `KEYCLOAK_ADMIN_PASSWORD` values in your `.env` file. If you didn't change them from the example file, they'll be whatever default value your developer set there, and you should change them immediately after your first login.
4. Once inside, you'll see a dropdown in the top left showing the current realm (it may say "master"). Click it, then **Create Realm**, and give it a name your developer specifies (for example `crm`).
5. Inside your new realm, click **Clients** on the left, then **Create client**. Give it a client ID your developer specifies (for example `crm-api`), set **Client authentication** to on if your developer asked for a confidential client, and set the **Valid redirect URIs** to match your app's address exactly, for example `http://<your server's address>/*`.
6. Save it, then write down three things for your developer: the Keycloak address (`http://<your server's address>/auth`), the realm name, and the client ID.
7. If you want groups like "Sales" or "Support" to map to app roles automatically, that's set up under **Realm roles** and **Groups** in the left menu. This part is optional and can be done later with your developer present.

That's the full loop: a running server, containers started, and Keycloak's admin portal open and configured. From here, handing the three Keycloak values above to your developer is usually the last thing needed before real people can log in.

- **The page will not load at all:** open the terminal and run `docker compose ps`. If services are missing or restarting, run `docker compose restart`, wait two minutes, and try again.
- **Login fails with an "invalid redirect" message:** redo Step 6. The address in Keycloak has to match the address in the browser exactly.
- **Forgot the Keycloak admin password:** it is the `KEYCLOAK_ADMIN_PASSWORD` line in your `.env` file. View it with `grep KEYCLOAK .env` in the terminal.
- **Anything else:** run `docker compose logs --tail 200 api` and send the output to your developer, or paste it into your AI assistant and ask what is wrong.

### When to bring in a developer or IT person

The setup above is fine for an internal tool used over a plain `http://` address. Before you put real customer data in it or open it to the wider internet, have a technical person handle these, in roughly a day:

1. A real web address (`crm.yourcompany.com`) instead of the bare IP, plus an HTTPS certificate so the address bar shows the lock. After that, set `COOKIE_SECURE=true` in `.env`.
2. Connecting Keycloak to your company logins (Okta, Microsoft 365, Google Workspace) so nobody manages a separate CRM password.
3. Moving the database to a managed service with automatic backups (for example Amazon RDS), or at minimum scheduling disk snapshots in EC2.
4. Tightening the firewall so SSH access is limited instead of open to anywhere.
5. Company-specific workflows and removing the sample data and placeholders.

## Questions or stuck partway through?

Any step above that mentions certificates, company logins, or firewalls is a good moment to loop in whoever manages your technical infrastructure. Those involve decisions specific to your organization. For everything else in this guide, the exact button names and commands are written out so you can do it yourself, and pasting an error message into your AI assistant will usually get you unstuck.

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
> a **responsive/mobile** layout. No fabricated metrics: revenue is computed
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

Click **Log in** and you'll be redirected to Keycloak. Two demo users are seeded
by the realm import:

| User | Username | Password | Role |
|---|---|---|---|
| Admin | `admin` | `admin` | Admin (sees the Admin nav item) |
| Member | `member` | `member` | Member |

After logging in you land on the **Dashboard** (live cross-module counts). Open
any module (for example **B2B Leads**) to see seeded records, and use the **Add new**
form to create one and watch it appear. These are development credentials.
Change them (and the `crm-api` client secret in the realm export) before any
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
services/api/            # CRM API, Node/Express/TypeScript
services/web/            # CRM Web App, React/Vite/TypeScript
services/proxy/          # Reverse proxy, nginx.conf + Dockerfile
infra/redis/redis.conf   # Session store config
infra/keycloak/          # Keycloak realm export (realm, clients, roles)
```

## Configuration

Everything environment-specific is injected via `.env` (or mounted config
files); no secrets are baked into images. The API validates required
variables at startup and **fails fast** with a descriptive error if any are
missing. See `.env.example` for the full list.

## Outbound internet & egress configuration (REQ-026)

Inbound traffic (browser to app) enters through the nginx reverse proxy. This
section is about the **other direction**: letting the API reach the internet so
integrations like the Company 360 social feed (LinkedIn, X, Instagram,
TikTok) can call third-party APIs. In a hardened cloud network, containers have
**no route to the internet by default**, so this is a deliberate step.

**Two layers to configure:**

1. **Network route.** The host or subnet must be able to reach the internet
   (NAT gateway, internet gateway, or Cloud NAT, see per-environment notes).
2. **Application egress.** Per REQ-026 the app never calls third-party hosts
   directly. Point it at your egress gateway and supply per-provider credentials
   (all optional; unset means the feature stays inert and reports "not
   connected," it never fabricates data):

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
  host, so containers reach the internet with **no extra setup**, provided the
  host itself has internet access.
- **Behind a corporate proxy?** Add the standard proxy variables to the `api`
  service environment (and the Docker daemon) so outbound calls traverse it:
  ```bash
  HTTP_PROXY=http://proxy.corp:3128
  HTTPS_PROXY=http://proxy.corp:3128
  NO_PROXY=localhost,127.0.0.1,db,redis,keycloak,proxy
  ```
  Keep internal service names in `NO_PROXY` so intra-stack traffic stays local.
- If you don't run an egress gateway, leave `SOCIAL_EGRESS_BASE_URL` empty. The
  social feed shows the honest "connect a platform API" state and makes no
  outbound calls.

### AWS (ECS/EKS/EC2 in a VPC)

- **Private subnets (recommended):** create a **NAT Gateway** in a public subnet
  and add `0.0.0.0/0 -> nat-...` to the private subnets' route table. Tasks keep no
  public IP; outbound still works.
- **Public subnets:** attach an **Internet Gateway** and route `0.0.0.0/0 -> igw-...`;
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
  VPC connector** with all egress through the VPC, add **Cloud NAT** so
  internet-bound traffic still has a path.
- **Firewall:** GCP implicitly allows egress; if you added deny rules, allow
  `tcp:443` to the gateway / platform hosts.
- **Locking egress down:** use **Secure Web Proxy** or a Squid forward proxy with
  an allowlist, then point `SOCIAL_EGRESS_BASE_URL` (or `HTTPS_PROXY`) at it.
- **Secrets:** store `SOCIAL_*_TOKEN` in **Secret Manager** and mount them as
  environment variables.

> **Verifying egress:** from inside the API container, a reachable gateway or host
> returns a normal response; a missing route typically hangs until timeout, and
> a policy denial returns `403`. The social feed degrades to "not connected" in
> every failure case rather than erroring the page.

## Requirement coverage

Each generated artifact maps back to the requirements in the `.nodespec` task
documents (REQ-001 through REQ-018): pluggable OIDC/SAML identity (Keycloak realm +
API verification seam), RBAC (roles/groups + `requireRole` middleware), secure
sessions (Redis + HttpOnly/Secure/SameSite cookies), the five CRM modules,
audit logging (append-only, DB-enforced immutability), API-first design
(`/api/v1` + `/api/docs`), env-based config, versioned migrations, and
container-based deployment.
