/**
 * CRM Platform — Google Sheets demo backend (Apps Script).
 *
 * Serves the exact frontend (see Index.html) as a web app and answers its data
 * calls from a Google Sheet. The frontend's `api.*` methods call `apiCall(req)`
 * over google.script.run; this file maps that to generic CRUD over one sheet tab
 * per resource — the Sheets analogue of the real API's makeCrudRouter engine.
 *
 * SETUP: run `setup()` once (creates tabs + demo data), then Deploy > New
 * deployment > Web app.  Features that need real infrastructure (server email
 * invites, live social feeds) are deprecated here and return honest "disabled in
 * the demo" responses — no core-repo behaviour is changed.
 */

// Bumped on every change shipped to this file. Shown by ping() (and therefore
// on the ?page=diag page) so you can verify which server code a deployment is
// actually running — Apps Script deployments serve a frozen snapshot until you
// publish a new version.
var APP_VERSION = 'gs-9';

// ---- Resource → sheet schema (columns the frontend reads/writes) -----------
var RESOURCES = {
  'companies': { sheet: 'companies',
    columns: ['name', 'website', 'domain', 'industry', 'segment', 'owner_id', 'about', 'social_links'],
    json: ['social_links'] },
  'contacts': { sheet: 'contacts',
    columns: ['full_name', 'title', 'email', 'phone', 'company_id', 'owner_id', 'lifecycle_stage', 'notes'],
    json: [] },
  'b2b-leads': { sheet: 'b2b_leads',
    columns: ['company_name', 'industry_vertical', 'primary_poc', 'title_role', 'contact_email', 'lead_source',
      'status', 'pain_point_use_case', 'next_follow_up_date', 'reminder_date', 'notes', 'amount', 'close_date',
      'owner_id', 'company_id', 'contact_id', 'meddic', 'probability'],
    json: ['meddic'] },
  'b2g-opportunities': { sheet: 'b2g_opportunities',
    columns: ['notice_id', 'agency_department', 'opportunity_link', 'focus_area_rr_role', 'fit_score_numeric',
      'due_date', 'status', 'action_officer', 'naics', 'set_aside', 'incumbent', 'solicitation_number',
      'clearance_level', 'capture_stage', 'meddic', 'notes'],
    json: ['meddic'] },
  'company-competitors': { sheet: 'company_competitors',
    columns: ['company_id', 'name', 'note', 'disposition'], json: [] },
  'b2g-teaming-partners': { sheet: 'b2g_teaming_partners',
    columns: ['opportunity_id', 'company_name', 'role', 'poc', 'email'], json: [] },
  'b2g-stakeholders': { sheet: 'b2g_stakeholders',
    columns: ['opportunity_id', 'name', 'agency_role', 'influence', 'disposition'], json: [] },
  'b2g-compliance-gates': { sheet: 'b2g_compliance_gates',
    columns: ['opportunity_id', 'label', 'status', 'met', 'notes'], json: [] },
  'events': { sheet: 'events',
    columns: ['event_name', 'event_date', 'location', 'website_url'], json: [] },
  'submissions': { sheet: 'submissions',
    columns: ['name', 'category_id', 'deadline', 'submission_date', 'website_url'], json: [] },
  'submission-categories': { sheet: 'submission_categories',
    columns: ['label', 'is_active'], json: [] },
  'publicity-contacts': { sheet: 'publicity_contacts',
    columns: ['organization', 'format', 'contact_name', 'email', 'notes'], json: [] },
  'activities': { sheet: 'activities',
    columns: ['type', 'subject', 'body', 'module', 'record_id', 'actor', 'occurred_at'], json: [] },
  'tasks': { sheet: 'tasks',
    columns: ['title', 'due_date', 'assignee_id', 'status', 'module', 'record_id'], json: [] },
  'contact-lifecycle-stages': { sheet: 'contact_lifecycle_stages',
    columns: ['label', 'sort_order', 'is_active'], json: [] },
  'lead-statuses': { sheet: 'lead_statuses',
    columns: ['label', 'sort_order', 'is_closed', 'is_active'], json: [] },
  'b2g-capture-stages': { sheet: 'b2g_capture_stages',
    columns: ['label', 'sort_order', 'is_active'], json: [] },
  'custom-field-defs': { sheet: 'custom_field_defs',
    columns: ['module', 'key', 'label', 'type', 'options', 'is_active', 'sort_order'], json: ['options'] },
  'users': { sheet: 'users', columns: ['display_name', 'email', 'role', 'is_active'], json: [] }
};

var LEAD_STATUSES = [
  { label: 'New', is_closed: false }, { label: 'Contacted', is_closed: false },
  { label: 'Qualified', is_closed: false }, { label: 'Proposal', is_closed: false },
  { label: 'Negotiation', is_closed: false }, { label: 'Closed-Won', is_closed: true },
  { label: 'Closed-Lost', is_closed: true }
];
var PUBLICITY_FORMATS = ['Podcast', 'Newsletter', 'Blog', 'Print', 'TV'];
var THRESHOLDS = { b2g_due_date_threshold_days: 14, submission_deadline_threshold_days: 14 };

// ---- Web app entry ---------------------------------------------------------
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) || '';
  var file = page === 'diag' ? 'Diag' : 'Index';
  return HtmlService.createHtmlOutputFromFile(file)
    .setTitle('CRM Platform — Sheets demo')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Minimal round-trip probe for the diagnostic page — proves google.script.run
// reaches the server and the spreadsheet is bound.
function ping() {
  var s = ss_();
  return {
    ok: true,
    version: APP_VERSION,
    time: new Date().toISOString(),
    bound: Boolean(SpreadsheetApp.getActiveSpreadsheet()),
    spreadsheet: s ? s.getName() : null,
    url: s ? s.getUrl() : null,
    tabs: s ? s.getSheets().map(function (sh) { return sh.getName(); }) : []
  };
}

// ---- API dispatcher (called from the frontend via google.script.run) -------
function apiCall(req) {
  try {
    // The client sends the request as a JSON string (google.script.run object
    // parameters are fragile); accept both forms.
    if (typeof req === 'string') req = JSON.parse(req);
    var method = req.method;
    var p = String(req.path || '').replace(/^\/+|\/+$/g, '');
    var params = req.params || {};
    var body = req.body || {};
    var parts = p.split('/');
    var resource = parts[0];

    if (resource === 'meta') return buildMeta();
    if (resource === 'dashboard') return buildDashboard();
    if (parts.length === 3 && parts[2] === 'social-feed') return socialFeed(parts[1]);
    if (parts.length === 3 && parts[2] === 'invite') {
      return { delivered: false, reason: 'Email delivery is disabled in the Sheets demo',
        recipients: (body.emails || []).length };
    }

    var cfg = RESOURCES[resource];
    if (!cfg) return (method === 'GET' && parts.length === 1) ? [] : err(404, 'Unknown resource: ' + resource);

    if (method === 'GET' && parts.length === 1) return listRows(cfg, params);
    if (method === 'GET' && parts.length === 2) return getRow(cfg, parts[1]) || err(404, 'Not found');
    if (method === 'POST') return createRow(cfg, body);
    if ((method === 'PUT' || method === 'PATCH') && parts.length === 2) return updateRow(cfg, parts[1], body);
    if (method === 'DELETE' && parts.length === 2) { deleteRow(cfg, parts[1]); return null; }
    return err(400, 'Unsupported: ' + method + ' ' + p);
  } catch (e) {
    return err(500, e && e.message ? e.message : String(e));
  }
}

function err(status, message) { return { __error: { status: status, message: message } }; }

// ---- Sheet helpers ---------------------------------------------------------
/**
 * Resolve the backing spreadsheet. Container-bound scripts (created via
 * Extensions > Apps Script inside a Sheet) get it from getActiveSpreadsheet().
 * Standalone scripts get null there — so fall back to a spreadsheet id stored
 * in Script Properties, creating "CRM Sheets Demo Data" on first use.
 */
var SS_PROP = 'CRM_DEMO_SPREADSHEET_ID';
var ssCache_ = null;
function ss_() {
  if (ssCache_) return ssCache_;
  var s = SpreadsheetApp.getActiveSpreadsheet();
  if (!s) {
    var props = PropertiesService.getScriptProperties();
    var id = props.getProperty(SS_PROP);
    if (id) {
      try { s = SpreadsheetApp.openById(id); } catch (e) { s = null; }
    }
    if (!s) {
      s = SpreadsheetApp.create('CRM Sheets Demo Data');
      props.setProperty(SS_PROP, s.getId());
    }
  }
  ssCache_ = s;
  return s;
}
function headerFor_(cfg) { return ['id'].concat(cfg.columns).concat(['created_at']); }

function sheetFor_(cfg) {
  var sh = ss_().getSheetByName(cfg.sheet);
  if (!sh) { sh = ss_().insertSheet(cfg.sheet); sh.appendRow(headerFor_(cfg)); }
  return sh;
}

function cellOut_(cfg, key, v) {
  if (cfg.json.indexOf(key) >= 0) return v ? safeJson_(v) : (key === 'options' ? [] : {});
  if (v instanceof Date) return v.toISOString();
  return (v === '' || v === undefined) ? null : v;
}
function cellIn_(cfg, key, v) {
  if (cfg.json.indexOf(key) >= 0) return v == null ? '' : JSON.stringify(v);
  return v == null ? '' : v;
}
function safeJson_(v) { try { return JSON.parse(v); } catch (e) { return v; } }

function readAll_(cfg) {
  var sh = sheetFor_(cfg);
  var vals = sh.getDataRange().getValues();
  if (vals.length < 2) return [];
  var head = vals[0], out = [];
  for (var i = 1; i < vals.length; i++) {
    if (!vals[i][0]) continue; // skip blank rows (no id)
    var o = {};
    for (var j = 0; j < head.length; j++) o[head[j]] = cellOut_(cfg, head[j], vals[i][j]);
    o.__row = i + 1;
    out.push(o);
  }
  return out;
}

function listRows(cfg, params) {
  var rows = readAll_(cfg);
  var known = ['id'].concat(cfg.columns);
  Object.keys(params || {}).forEach(function (k) {
    if (k === 'q' || k === 'limit' || k === 'offset') return;
    var val = params[k];
    if (val === '' || val == null) return;
    // Range filters (<col>_from / <col>_to) on known columns, like the real API.
    var m = k.match(/^(.*)_(from|to)$/);
    if (m && known.indexOf(m[1]) >= 0) {
      var col = m[1], dir = m[2];
      rows = rows.filter(function (r) {
        var cell = String(r[col] || '').slice(0, 10);
        if (!cell) return false;
        return dir === 'from' ? cell >= String(val).slice(0, 10) : cell <= String(val).slice(0, 10);
      });
      return;
    }
    // Ignore unknown keys (e.g. UI params) instead of filtering everything out —
    // mirrors the real crudRouter, which only matches real columns.
    if (known.indexOf(k) < 0) return;
    rows = rows.filter(function (r) { return String(r[k]) === String(val); });
  });
  if (params && params.q) {
    var q = String(params.q).toLowerCase();
    rows = rows.filter(function (r) {
      return Object.keys(r).some(function (k) { return String(r[k] || '').toLowerCase().indexOf(q) >= 0; });
    });
  }
  rows.sort(function (a, b) { return String(b.created_at || '').localeCompare(String(a.created_at || '')); });
  return rows.map(strip_);
}

function getRow(cfg, id) {
  var found = readAll_(cfg).filter(function (r) { return String(r.id) === String(id); })[0];
  return found ? strip_(found) : null;
}
function strip_(r) { var o = {}; Object.keys(r).forEach(function (k) { if (k !== '__row') o[k] = r[k]; }); return o; }

function createRow(cfg, body) {
  var sh = sheetFor_(cfg);
  var head = headerFor_(cfg);
  var id = Utilities.getUuid();
  var now = new Date().toISOString();
  var row = head.map(function (key) {
    if (key === 'id') return id;
    if (key === 'created_at') return body.created_at || now;
    return cellIn_(cfg, key, body[key]);
  });
  sh.appendRow(row);
  return getRow(cfg, id);
}

function updateRow(cfg, id, body) {
  var all = readAll_(cfg);
  var rec = all.filter(function (r) { return String(r.id) === String(id); })[0];
  if (!rec) return err(404, 'Not found');
  var sh = sheetFor_(cfg);
  var head = headerFor_(cfg);
  var merged = {};
  head.forEach(function (key) { merged[key] = rec[key]; });
  cfg.columns.forEach(function (key) { if (body[key] !== undefined) merged[key] = body[key]; });
  var row = head.map(function (key) {
    if (key === 'id') return id;
    if (key === 'created_at') return rec.created_at;
    return cellIn_(cfg, key, merged[key]);
  });
  sh.getRange(rec.__row, 1, 1, head.length).setValues([row]);
  return getRow(cfg, id);
}

function deleteRow(cfg, id) {
  var rec = readAll_(cfg).filter(function (r) { return String(r.id) === String(id); })[0];
  if (rec) sheetFor_(cfg).deleteRow(rec.__row);
}

// ---- Computed endpoints ----------------------------------------------------
function buildMeta() {
  var cats = readAll_(RESOURCES['submission-categories']).filter(active_);
  var stages = readAll_(RESOURCES['contact-lifecycle-stages']).filter(active_)
    .sort(function (a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
  var owners = readAll_(RESOURCES['users']).filter(active_);
  return {
    lead_statuses: leadStatuses_(),
    capture_stages: captureStages_(),
    submission_categories: cats.map(function (c) { return { id: c.id, label: c.label }; }),
    publicity_formats: PUBLICITY_FORMATS,
    contact_lifecycle_stages: stages.map(function (s) { return s.label; }),
    owners: owners.map(function (u) { return { id: u.id, display_name: u.display_name, email: u.email }; }),
    custom_field_defs: readAll_(RESOURCES['custom-field-defs']).filter(active_).map(strip_),
    thresholds: THRESHOLDS
  };
}
function active_(r) { return r.is_active === true || r.is_active === 'TRUE' || r.is_active == null; }

/** Admin-configurable stages read from tabs, with defaults when unseeded. */
function bySort_(a, b) { return (a.sort_order || 0) - (b.sort_order || 0); }
function leadStatuses_() {
  var rows = readAll_(RESOURCES['lead-statuses']).filter(active_).sort(bySort_);
  return rows.length
    ? rows.map(function (s) { return { label: s.label, is_closed: s.is_closed === true }; })
    : LEAD_STATUSES;
}
function captureStages_() {
  var rows = readAll_(RESOURCES['b2g-capture-stages']).filter(active_).sort(bySort_);
  return rows.length
    ? rows.map(function (s) { return s.label; })
    : ['Identify', 'Qualify', 'Pursue', 'Capture', 'Proposal', 'Submitted', 'Award'];
}

function buildDashboard() {
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var inDays = function (d, n) { var x = new Date(today); x.setDate(x.getDate() + n); return d <= x; };
  var dt = function (v) { return v ? new Date(String(v).slice(0, 10) + 'T00:00:00') : null; };

  var events = readAll_(RESOURCES['events']);
  var subs = readAll_(RESOURCES['submissions']);
  var leads = readAll_(RESOURCES['b2b-leads']);
  var b2g = readAll_(RESOURCES['b2g-opportunities']);
  var pub = readAll_(RESOURCES['publicity-contacts']);
  var acts = readAll_(RESOURCES['activities']);
  var tasks = readAll_(RESOURCES['tasks']);

  var closed = function (s) { return s === 'Closed-Won' || s === 'Closed-Lost'; };
  var num = function (v) { return Number(v) || 0; };

  var byStatus = leadStatuses_().map(function (s) {
    return { status: s.label, n: leads.filter(function (l) { return l.status === s.label; }).length };
  }).filter(function (r) { return r.n > 0; });

  var byFormat = {};
  pub.forEach(function (r) { if (r.format) byFormat[r.format] = (byFormat[r.format] || 0) + 1; });

  return {
    upcoming_events: events.filter(function (e) { var d = dt(e.event_date); return d && d >= today; }).length,
    approaching_submission_deadlines: subs.filter(function (s) { var d = dt(s.deadline); return d && inDays(d, THRESHOLDS.submission_deadline_threshold_days) && !s.submission_date; }).length,
    leads_due_for_follow_up: leads.filter(function (l) { var d = dt(l.reminder_date); return d && d <= today && !closed(l.status); }).length,
    b2g_opportunities_nearing_due_date: b2g.filter(function (o) { var d = dt(o.due_date); return d && inDays(d, THRESHOLDS.b2g_due_date_threshold_days); }).length,
    publicity_contacts_by_format: Object.keys(byFormat).map(function (k) { return { format: k, n: byFormat[k] }; }),
    leads_by_status: byStatus,
    open_pipeline_value: leads.filter(function (l) { return !closed(l.status); }).reduce(function (a, l) { return a + num(l.amount); }, 0),
    won_revenue: leads.filter(function (l) { return l.status === 'Closed-Won'; }).reduce(function (a, l) { return a + num(l.amount); }, 0),
    open_deals: leads.filter(function (l) { return !closed(l.status); }).length,
    recent_activities: acts.sort(function (a, b) { return String(b.occurred_at || b.created_at).localeCompare(String(a.occurred_at || a.created_at)); }).slice(0, 6),
    tasks_due: tasks.filter(function (t) { return t.status !== 'done'; }).slice(0, 6),
    thresholds: THRESHOLDS
  };
}

// Social feeds require a real egress/API gateway — disabled in the demo.
function socialFeed(companyId) {
  var links = {};
  var co = getRow(RESOURCES['companies'], companyId);
  if (co && co.social_links) links = co.social_links;
  var platforms = ['linkedin', 'x', 'instagram', 'tiktok'];
  return {
    channels: platforms.map(function (pf) {
      var url = links[pf];
      return { platform: pf, connected: !!url, url: url || undefined, configured: false, posts: [],
        reason: url ? 'Live feeds are disabled in the Sheets demo' : null };
    }),
    live: false
  };
}

// ---- One-time setup: create tabs + seed demo data --------------------------
function setup() {
  Object.keys(RESOURCES).forEach(function (k) { sheetFor_(RESOURCES[k]); });

  seedIfEmpty_('users', [
    { display_name: 'Jordan Mercer', email: 'jordan@demo.local', role: 'admin', is_active: true },
    { display_name: 'Priya Rao', email: 'priya@demo.local', role: 'member', is_active: true }
  ]);
  seedIfEmpty_('contact-lifecycle-stages', [
    { label: 'Subscriber', sort_order: 1, is_active: true }, { label: 'Lead', sort_order: 2, is_active: true },
    { label: 'MQL', sort_order: 3, is_active: true }, { label: 'SQL', sort_order: 4, is_active: true },
    { label: 'Opportunity', sort_order: 5, is_active: true }, { label: 'Customer', sort_order: 6, is_active: true }
  ]);
  seedIfEmpty_('submission-categories', [
    { label: 'Award', is_active: true }, { label: 'Grant', is_active: true }, { label: 'RFP', is_active: true }
  ]);
  seedIfEmpty_('lead-statuses', [
    { label: 'New', sort_order: 1, is_closed: false, is_active: true },
    { label: 'Contacted', sort_order: 2, is_closed: false, is_active: true },
    { label: 'Qualified', sort_order: 3, is_closed: false, is_active: true },
    { label: 'Proposal', sort_order: 4, is_closed: false, is_active: true },
    { label: 'Negotiation', sort_order: 5, is_closed: false, is_active: true },
    { label: 'Closed-Won', sort_order: 6, is_closed: true, is_active: true },
    { label: 'Closed-Lost', sort_order: 7, is_closed: true, is_active: true }
  ]);
  seedIfEmpty_('b2g-capture-stages', [
    { label: 'Identify', sort_order: 1, is_active: true }, { label: 'Qualify', sort_order: 2, is_active: true },
    { label: 'Pursue', sort_order: 3, is_active: true }, { label: 'Capture', sort_order: 4, is_active: true },
    { label: 'Proposal', sort_order: 5, is_active: true }, { label: 'Submitted', sort_order: 6, is_active: true },
    { label: 'Award', sort_order: 7, is_active: true }
  ]);

  // Demo records only seed into an EMPTY dataset — re-running setup() (or
  // running it against a spreadsheet you've imported your own data into) never
  // duplicates or overwrites existing rows.
  if (readAll_(RESOURCES['companies']).length > 0) {
    Logger.log('Data already present — skipped demo-record seeding.');
    var s0 = ss_();
    try { s0.toast('Tabs verified. Existing data kept.', 'CRM demo', 5); } catch (e) {}
    return;
  }

  var owners = readAll_(RESOURCES['users']);
  var oid = owners[0] ? owners[0].id : '';

  var acme = seedReturn_('companies', { name: 'Acme Robotics', website: 'https://acme.example', industry: 'Manufacturing', segment: 'Mid-Market', owner_id: oid, about: 'Industrial robotics & automation.', social_links: { linkedin: 'https://linkedin.com/company/acme' } });
  var nimbus = seedReturn_('companies', { name: 'Nimbus Analytics', website: 'https://nimbus.example', industry: 'SaaS', segment: 'SMB', owner_id: oid, about: 'Cloud analytics platform.', social_links: {} });
  seedReturn_('companies', { name: 'Harbor Foods', website: 'https://harbor.example', industry: 'Food & Beverage', segment: 'Enterprise', owner_id: oid, about: 'Regional food distributor.', social_links: {} });

  seedReturn_('contacts', { full_name: 'Dana Reyes', title: 'VP Ops', email: 'dana@acme.example', company_id: acme.id, owner_id: oid, lifecycle_stage: 'Opportunity' });
  seedReturn_('contacts', { full_name: 'Sam Cole', title: 'CTO', email: 'sam@nimbus.example', company_id: nimbus.id, owner_id: oid, lifecycle_stage: 'Lead' });

  seedReturn_('b2b-leads', { company_name: 'Acme Robotics', industry_vertical: 'Manufacturing', primary_poc: 'Dana Reyes', lead_source: 'Referral', status: 'Negotiation', amount: 92400, close_date: dplus_(21), owner_id: oid, company_id: acme.id, probability: 70, meddic: { metrics: '-30% QA time target', economic_buyer: 'VP Ops engaged', decision_criteria: 'Defined', pain: 'Manual QA bottleneck', champion: 'Dana Reyes' } });
  seedReturn_('b2b-leads', { company_name: 'Nimbus Analytics', industry_vertical: 'SaaS', primary_poc: 'Sam Cole', lead_source: 'Website', status: 'Qualified', amount: 18500, close_date: dplus_(40), owner_id: oid, company_id: nimbus.id, probability: 40, meddic: {} });

  seedReturn_('company-competitors', { company_id: acme.id, name: 'Rival Automation Co.', note: 'Incumbent at 2 plants, costly', disposition: 'threat' });
  seedReturn_('company-competitors', { company_id: acme.id, name: 'Status quo (manual QA)', note: 'No cross-line visibility', disposition: 'low' });

  var b2g = seedReturn_('b2g-opportunities', { notice_id: 'NOTICE-2026-001', agency_department: 'Dept. of Energy', focus_area_rr_role: 'Prime', fit_score_numeric: 8, due_date: dplus_(7), status: 'Open', action_officer: 'J. Rivera', naics: '541512', set_aside: 'SDVOSB', incumbent: 'Leidos', capture_stage: 'Capture', meddic: { metrics: 'Mission uptime', champion: 'PM engaged' } });
  seedReturn_('b2g-compliance-gates', { opportunity_id: b2g.id, label: 'Facility Clearance (FCL)', status: 'SECRET · on file', met: true });
  seedReturn_('b2g-compliance-gates', { opportunity_id: b2g.id, label: 'CMMC Level', status: 'CMMC 2.0 L2 · due', met: false });
  seedReturn_('b2g-stakeholders', { opportunity_id: b2g.id, name: 'Col. Rachel Case', agency_role: 'Contracting Officer' });

  seedReturn_('events', { event_name: 'GovCon Expo 2026', event_date: dplus_(30), location: 'Washington, DC', website_url: 'https://example.com/expo' });
  seedReturn_('events', { event_name: 'SaaS North', event_date: dplus_(60), location: 'Minneapolis, MN', website_url: '' });

  seedReturn_('tasks', { title: 'Send redlined MSA to Acme', status: 'open', module: 'b2b_leads', record_id: '' });
  seedReturn_('tasks', { title: 'Prep Q3 pipeline review', status: 'open', module: '' });

  seedReturn_('activities', { type: 'call', subject: 'Discovery call', body: 'Discussed QA bottleneck.', module: 'companies', record_id: acme.id, actor: 'Jordan Mercer', occurred_at: new Date().toISOString() });
  seedReturn_('publicity-contacts', { organization: 'TechCrunch', format: 'Blog', contact_name: 'A. Writer', email: 'tips@example.com' });

  var s = ss_();
  try {
    s.toast('Demo data seeded. Deploy as a Web app to use.', 'CRM demo', 5);
  } catch (e) { /* toast is unavailable for standalone scripts */ }
  Logger.log('Demo data seeded into: ' + s.getUrl());
}

// ---- Porting your own data in ---------------------------------------------
/**
 * Point a STANDALONE script at an existing spreadsheet (instead of the
 * auto-created "CRM Sheets Demo Data"). Paste the target spreadsheet's id into
 * the call below, run once, then run setup() to create any missing tabs.
 * Container-bound scripts ignore this (they always use their own Sheet).
 */
function adoptSpreadsheet(spreadsheetId) {
  var id = spreadsheetId || 'PASTE_SPREADSHEET_ID_HERE';
  SpreadsheetApp.openById(id); // throws if not accessible
  PropertiesService.getScriptProperties().setProperty(SS_PROP, id);
  ssCache_ = null;
  Logger.log('Adopted spreadsheet: ' + ss_().getUrl());
}

/**
 * After pasting rows from another sheet under the matching headers, run this
 * once: it assigns an id + created_at to any row missing them (rows without an
 * id are otherwise ignored by the app). Never touches rows that have an id, so
 * it is safe to re-run after every import.
 */
function backfillIds() {
  var fixed = 0;
  Object.keys(RESOURCES).forEach(function (k) {
    var cfg = RESOURCES[k];
    var sh = sheetFor_(cfg);
    var vals = sh.getDataRange().getValues();
    if (vals.length < 2) return;
    var head = vals[0];
    var idCol = head.indexOf('id');
    var createdCol = head.indexOf('created_at');
    if (idCol < 0) return;
    for (var i = 1; i < vals.length; i++) {
      var row = vals[i];
      // Skip fully blank rows; fix rows that have content but no id.
      var hasContent = row.some(function (v, j) { return j !== idCol && v !== '' && v != null; });
      if (!hasContent || row[idCol]) continue;
      sh.getRange(i + 1, idCol + 1).setValue(Utilities.getUuid());
      if (createdCol >= 0 && !row[createdCol]) {
        sh.getRange(i + 1, createdCol + 1).setValue(new Date().toISOString());
      }
      fixed++;
    }
  });
  Logger.log('backfillIds: fixed ' + fixed + ' row(s)');
  try { ss_().toast('Assigned ids to ' + fixed + ' imported row(s).', 'CRM demo', 5); } catch (e) {}
}

function dplus_(n) { var d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
function seedReturn_(resource, obj) { return createRow(RESOURCES[resource], obj); }
function seedIfEmpty_(resource, rows) {
  if (readAll_(RESOURCES[resource]).length > 0) return;
  rows.forEach(function (r) { createRow(RESOURCES[resource], r); });
}
