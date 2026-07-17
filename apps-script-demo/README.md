# CRM Platform — Google Sheets demo (Apps Script)

A **self-contained demo** copy of the CRM frontend that runs as a Google Apps
Script **web app**, with a **Google Sheet as the backend**. It reuses the *exact*
frontend from `services/web/src` — every page, style, and component — and swaps
only the two server-coupled modules so the same UI talks to a Sheet instead of
the real API.

> This folder does **not** change the core product. It builds *against*
> `services/web/src` (read-only) and lives entirely under `apps-script-demo/`.

## What's different from the real app (and why)

| Area | Real app | Sheets demo |
|---|---|---|
| Login page | OIDC via Keycloak (`auth/AuthContext.tsx`) | **Removed** — runs as a static Admin "Demo User" (`web/src/gasAuth.tsx`) |
| Data layer | `fetch('/api/v1/...')` (`api/client.ts`) | `google.script.run.apiCall(...)` → the Sheet (`web/src/gasClient.ts`) |
| Routing | `BrowserRouter` | `HashRouter` (Apps Script serves the app from an opaque iframe URL) |
| Server email invites | `POST /events/:id/invite` via email gateway | **Deprecated** — returns `delivered:false` ("disabled in the Sheets demo"). The client-side **Outlook/Google/.ics** actions still work in the browser. |
| Live social feeds | egress gateway + platform APIs | **Deprecated** — returns "disabled"; saved profile links still render |
| Audit log / RBAC enforcement | DB + middleware | Not enforced (demo is single trusted user) |

Everything else — Pipeline (B2B/B2G), Company 360, Contacts, the deal views,
dashboard, calendar, admin drawers — is the real UI, backed by sheet tabs.

## Layout

```
apps-script-demo/
  web/                     # Vite single-file build of the real frontend
    src/gasClient.ts       #   → replaces services/web/src/api/client.ts
    src/gasAuth.tsx        #   → replaces services/web/src/auth/AuthContext.tsx
    src/gasMain.tsx        #   HashRouter entry, imports App from services/web/src
    vite.config.ts         #   resolveId plugin does the two swaps; vite-plugin-singlefile inlines JS+CSS
  appsscript/
    Code.gs                # sheet-backed generic CRUD + /meta + /dashboard + setup()
    Index.html             # the built single-file app (generated; committed for convenience)
    appsscript.json        # manifest (V8, web app)
  scripts/build.mjs        # copies web/dist/index.html -> appsscript/Index.html
```

## Build the frontend bundle

```bash
cd apps-script-demo/web
npm install
npm run build          # emits dist/index.html and copies it to ../appsscript/Index.html
```

(The committed `appsscript/Index.html` is already built, so you can skip this if
you don't need to change the UI.)

## Deploy — option A: manual (no tooling)

1. Create a new **Google Sheet**. Open **Extensions → Apps Script**.
2. In the script editor:
   - Replace `Code.gs` with the contents of `appsscript/Code.gs`.
   - **File → New → HTML file**, name it `Index` (exactly), and paste the
     contents of `appsscript/Index.html`.
   - Enable the manifest (**Project Settings → “Show appsscript.json”**), then
     paste `appsscript/appsscript.json`.
3. Run the `setup` function once (choose `setup` in the toolbar and click Run).
   Approve the permission prompt. This creates the tabs and seeds demo data.
4. **Deploy → New deployment → Web app.** Execute as *me*, access *Anyone*.
   Open the web-app URL — the CRM loads, backed by your sheet.

## Deploy — option B: clasp (CLI)

```bash
npm i -g @google/clasp && clasp login
cd apps-script-demo/appsscript
clasp create --type sheets --title "CRM Sheets Demo"   # or: clasp clone <scriptId>
clasp push
# then in the editor: run setup(), and Deploy > New deployment > Web app
```

`clasp` pushes `Code.gs`, `Index.html`, and `appsscript.json` as-is.

## How the backend works

`apiCall({method, path, params, body})` (in `Code.gs`) is the Sheets analogue of
the real API's `makeCrudRouter`: it maps each resource to a tab (see the
`RESOURCES` table), and does generic list/get/create/update/delete over its rows,
with JSON columns (`meddic`, `social_links`, …) stored as JSON text. `/meta` and
`/dashboard` are computed from the tabs; `social-feed` and `invite` return honest
"disabled in the demo" responses. Re-run `setup()` any time to (re)create tabs;
it only seeds data into empty config tabs.

## Notes / limitations

- The Apps Script sandbox iframe may restrict clipboard writes and file
  downloads; the Outlook/Google **deeplinks** (which open a new tab) are the most
  reliable invite path in the demo.
- This is a demo backend — no concurrency control, no server-side validation
  beyond the frontend's, and no auth. Don't put real data in it.
