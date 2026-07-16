import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useMeta } from "../lib/useMeta";
import { Star, DataLegend } from "../components/NeedsData";

/**
 * Contacts (REQ-019) — reproduces design option 2A: rich avatar table with an
 * admin "Customize" drawer (lifecycle stages + custom-field toggles), wired to
 * our real data. Replaces the generic ResourcePage for /contacts.
 */
interface Contact {
  id: string;
  full_name: string;
  title?: string;
  email?: string;
  company_id?: string | null;
  owner_id?: string | null;
  lifecycle_stage?: string | null;
}
interface Company {
  id: string;
  name: string;
}
interface FieldDef {
  id: string;
  module: string;
  key: string;
  label: string;
  type: string;
  options: string[];
  is_active: boolean;
}

const AV = ["#6d5ef0", "#0ea5a3", "#e0682f", "#2563eb", "#12a150", "#a855f7"];
const STAGE_DOT = ["var(--text-3)", "var(--info)", "var(--accent)", "var(--warn)", "var(--pos)", "#a855f7", "#0ea5a3"];
const initials = (s: string) =>
  (s.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("") || "?").toUpperCase();
const avatarColor = (s: string) => AV[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];

export function ContactsPage() {
  const { isAdmin } = useAuth();
  const meta = useMeta();
  const [rows, setRows] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Record<string, string>>({});
  const [defs, setDefs] = useState<FieldDef[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
    api.list<Contact>("contacts", params).then(setRows).catch((e) => setError((e as Error).message));
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    api.list<Company>("companies").then((cs) => {
      const m: Record<string, string> = {};
      cs.forEach((c) => (m[c.id] = c.name));
      setCompanies(m);
    }).catch(() => {});
    api.list<FieldDef>("custom-field-defs").then((d) => setDefs(d.filter((x) => x.module === "contacts"))).catch(() => {});
  }, []);

  const ownerName = (id?: string | null) => meta?.owners.find((o) => o.id === id)?.display_name ?? "";
  const stageColor = (label?: string | null) => {
    const i = meta?.contact_lifecycle_stages.indexOf(label ?? "") ?? -1;
    return STAGE_DOT[(i < 0 ? 0 : i) % STAGE_DOT.length];
  };
  const setF = (k: string, v: string) =>
    setFilters((f) => {
      const n = { ...f };
      if (v) n[k] = v;
      else delete n[k];
      return n;
    });

  async function createContact(e: FormEvent) {
    e.preventDefault();
    if (!form.full_name?.trim()) return;
    try {
      const body: Record<string, unknown> = {};
      ["full_name", "title", "email", "company_id", "owner_id", "lifecycle_stage"].forEach((k) => {
        if (form[k]) body[k] = form[k];
      });
      await api.create("contacts", body);
      setForm({});
      setShowForm(false);
      load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function toggleField(d: FieldDef) {
    try {
      await api.update("custom-field-defs", d.id, {
        module: d.module,
        key: d.key,
        label: d.label,
        type: d.type,
        options: d.options,
        is_active: !d.is_active,
      });
      setDefs((ds) => ds.map((x) => (x.id === d.id ? { ...x, is_active: !x.is_active } : x)));
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="with-drawer">
      <div className="grow">
        {/* Header */}
        <div className="page-head" style={{ marginBottom: 12 }}>
          <span className="topbar-title" style={{ fontSize: 18 }}>
            Contacts
          </span>
          <span className="muted tnum" style={{ fontSize: 13 }}>
            {rows.length} shown
          </span>
          <DataLegend />
          <span className="spacer" />
          {isAdmin && (
            <button
              className="btn"
              style={{ color: "var(--accent-strong)", borderColor: "var(--accent)" }}
              onClick={() => setShowDrawer((v) => !v)}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 17, verticalAlign: "-3px", marginRight: 4 }}>tune</span>
              Customize
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            <span className="material-symbols-rounded" style={{ fontSize: 17, verticalAlign: "-3px", marginRight: 4 }}>add</span>
            New contact
          </button>
        </div>

        {/* Filters */}
        <div className="filter-bar" style={{ marginBottom: 12 }}>
          <label className="filter-field">
            <span>Search</span>
            <input className="filter-search" type="search" placeholder="Search…" value={filters.q ?? ""} onChange={(e) => setF("q", e.target.value)} />
          </label>
          <label className="filter-field">
            <span>Stage</span>
            <select value={filters.lifecycle_stage ?? ""} onChange={(e) => setF("lifecycle_stage", e.target.value)}>
              <option value="">All</option>
              {(meta?.contact_lifecycle_stages ?? []).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="filter-field">
            <span>Owner</span>
            <select value={filters.owner_id ?? ""} onChange={(e) => setF("owner_id", e.target.value)}>
              <option value="">All</option>
              {(meta?.owners ?? []).map((o) => (
                <option key={o.id} value={o.id}>{o.display_name || o.email}</option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="error">{error}</p>}

        {showForm && (
          <form className="create-form" onSubmit={createContact} style={{ marginBottom: 12 }}>
            <h3>New contact</h3>
            <div className="form-grid">
              <label><span>Full Name *</span><input value={form.full_name ?? ""} required onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></label>
              <label><span>Title</span><input value={form.title ?? ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
              <label><span>Email</span><input type="email" value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label><span>Company</span>
                <select value={form.company_id ?? ""} onChange={(e) => setForm({ ...form, company_id: e.target.value })}>
                  <option value="">—</option>
                  {Object.entries(companies).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
                </select>
              </label>
              <label><span>Lifecycle</span>
                <select value={form.lifecycle_stage ?? ""} onChange={(e) => setForm({ ...form, lifecycle_stage: e.target.value })}>
                  <option value="">—</option>
                  {(meta?.contact_lifecycle_stages ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label><span>Owner</span>
                <select value={form.owner_id ?? ""} onChange={(e) => setForm({ ...form, owner_id: e.target.value })}>
                  <option value="">—</option>
                  {(meta?.owners ?? []).map((o) => <option key={o.id} value={o.id}>{o.display_name || o.email}</option>)}
                </select>
              </label>
            </div>
            <button className="btn btn-primary" type="submit">Create</button>
          </form>
        )}

        {/* Rich table */}
        <div className="table-wrap">
          <div className="cg-head">
            <span>Name</span>
            <span>Account</span>
            <span className="cg-col-type">Type<Star note="Contacts aren't classified B2B/B2G in our model yet" /></span>
            <span>Stage</span>
            <span className="cg-col-owner">Owner</span>
            <span className="cg-num cg-col-value">Deal value<Star note="No per-contact deal rollup captured yet" /></span>
            <span className="cg-num cg-col-touch">Last touch<Star note="No last-activity timestamp per contact yet" /></span>
          </div>
          {rows.length === 0 ? (
            <div className="cg-row"><span className="muted">No contacts match.</span></div>
          ) : (
            rows.map((c) => (
              <div className="cg-row" key={c.id}>
                <div className="cg-name">
                  <span className="avatar-36" style={{ background: avatarColor(c.full_name) }}>{initials(c.full_name)}</span>
                  <div style={{ minWidth: 0 }}>
                    <Link to={`/contacts/${c.id}`} className="ell" style={{ display: "block", fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{c.full_name}</Link>
                    <div className="ell muted" style={{ fontSize: 12.5 }}>{c.email}</div>
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="ell" style={{ fontSize: 13.5, fontWeight: 500 }}>{c.company_id ? companies[c.company_id] ?? "—" : "—"}</div>
                  <div className="ell muted" style={{ fontSize: 12 }}>{c.title}</div>
                </div>
                <div className="cg-col-type">
                  <span className="muted" title="Not captured yet">—</span>
                </div>
                <div>
                  {c.lifecycle_stage ? (
                    <span className="stage-chip" style={{ background: "var(--surface-3)", color: "var(--text-2)" }}>
                      <span className="dot" style={{ background: stageColor(c.lifecycle_stage) }} />
                      {c.lifecycle_stage}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </div>
                <div className="owner-mini cg-col-owner">
                  {c.owner_id ? (
                    <>
                      <span className="owner-badge">{initials(ownerName(c.owner_id) || "?")}</span>
                      <span className="ell muted" style={{ fontSize: 13 }}>{ownerName(c.owner_id)}</span>
                    </>
                  ) : (
                    <span className="muted">Unassigned</span>
                  )}
                </div>
                <div className="cg-num cg-col-value">
                  <span className="muted" title="Not captured yet">—</span>
                </div>
                <div className="cg-num cg-col-touch">
                  <span className="muted" title="Not captured yet">—</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mobile FAB (design 2B) — quick "New contact" */}
      <button
        className="mobile-fab"
        aria-label="New contact"
        onClick={() => setShowForm((v) => !v)}
      >
        <span className="material-symbols-rounded">add</span>
      </button>

      {/* Admin customize drawer */}
      {isAdmin && showDrawer && (
        <aside className="drawer">
          <div className="drawer-head">
            <span className="entity-ic" style={{ width: 32, height: 32 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 19 }}>tune</span>
            </span>
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>Customize contacts</div>
              <div className="muted" style={{ fontSize: 12 }}>Admin only</div>
            </div>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: "var(--text-3)", marginLeft: "auto", cursor: "pointer" }} onClick={() => setShowDrawer(false)}>close</span>
          </div>
          <div className="drawer-body">
            <div>
              <div className="drawer-label">Lifecycle stages</div>
              {(meta?.contact_lifecycle_stages ?? []).map((s, i) => (
                <div className="stage-item" key={s}>
                  <span className="dot" style={{ background: STAGE_DOT[i % STAGE_DOT.length] }} />
                  <span style={{ fontSize: 13.5, fontWeight: 500, flex: 1 }}>{s}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="drawer-label">Custom fields</div>
              {defs.length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>No custom fields for contacts yet.</p>}
              {defs.map((d) => (
                <div className="stage-item" key={d.id}>
                  <span className="material-symbols-rounded" style={{ fontSize: 17, color: "var(--text-3)" }}>badge</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{d.label}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{d.type}</div>
                  </div>
                  <button className={"switch " + (d.is_active ? "on" : "off")} onClick={() => toggleField(d)} aria-label="toggle">
                    <span className="knob" />
                  </button>
                </div>
              ))}
              <Link to="/admin/custom-fields" className="dashed-btn" style={{ marginTop: 7 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 17 }}>add</span>
                New field
              </Link>
            </div>
            <div className="sync-note">
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--accent-strong)" }}>database</span>
              <span>Changes sync to the table and database. Existing records keep their values — nothing breaks.</span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
