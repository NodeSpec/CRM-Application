import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { useMeta } from "../lib/useMeta";
import { Star, DataLegend } from "../components/NeedsData";

/**
 * Company / Account 360 (REQ-020) — reproduces design option 4A with our data:
 * header + rollup metrics, integrated Deals + People + About, and (in place of
 * the mockup's social feed) our real activity timeline with a Log-activity action.
 */
interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  segment?: string;
  about?: string;
  owner_id?: string;
}
interface Lead {
  id: string;
  company_name: string;
  status: string;
  amount?: number | null;
  close_date?: string | null;
  owner_id?: string | null;
}
interface Contact {
  id: string;
  full_name: string;
  title?: string;
  email?: string;
  lifecycle_stage?: string;
}
interface Activity {
  id: string;
  type: string;
  subject?: string;
  body?: string;
  actor?: string | null;
  occurred_at: string;
}

const AVATAR_COLORS = ["#6d5ef0", "#0ea5a3", "#e0682f", "#2563eb", "#12a150", "#a855f7"];
const initials = (s: string) =>
  (s.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("") || "?").toUpperCase();
const avatarColor = (s: string) =>
  AVATAR_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];
const money = (n?: number | null) => (n == null ? "—" : "$" + Number(n).toLocaleString());
const CLOSED = ["Closed-Won", "Closed-Lost"];

function stageStyle(status: string): React.CSSProperties {
  if (status === "Closed-Won") return { background: "var(--pos-soft)", color: "var(--pos)" };
  if (status === "Closed-Lost") return { background: "var(--neg-soft)", color: "var(--neg)" };
  return { background: "var(--accent-soft)", color: "var(--accent-strong)" };
}

export function Company360() {
  const { id } = useParams();
  const meta = useMeta();
  const [company, setCompany] = useState<Company | null>(null);
  const [deals, setDeals] = useState<Lead[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [acts, setActs] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logging, setLogging] = useState(false);
  const [note, setNote] = useState("");

  const loadActs = useCallback(() => {
    if (!id) return;
    api
      .list<Activity>("activities", { module: "companies", record_id: id })
      .then(setActs)
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    api.get<Company>("companies", id).then(setCompany).catch((e) => setError((e as Error).message));
    api.list<Lead>("b2b-leads", { company_id: id }).then(setDeals).catch(() => {});
    api.list<Contact>("contacts", { company_id: id }).then(setContacts).catch(() => {});
    loadActs();
  }, [id, loadActs]);

  const ownerName = (oid?: string | null) =>
    meta?.owners.find((o) => o.id === oid)?.display_name ?? "";

  if (error) return <p className="error">{error}</p>;
  if (!company) return <p className="muted">Loading…</p>;

  const openDeals = deals.filter((d) => !CLOSED.includes(d.status));
  const openPipeline = openDeals.reduce((a, d) => a + (Number(d.amount) || 0), 0);
  const won = deals
    .filter((d) => d.status === "Closed-Won")
    .reduce((a, d) => a + (Number(d.amount) || 0), 0);

  async function logActivity(e: FormEvent) {
    e.preventDefault();
    if (!note.trim() || !id) return;
    try {
      await api.create("activities", {
        type: "note",
        subject: note.trim(),
        module: "companies",
        record_id: id,
      });
      setNote("");
      setLogging(false);
      loadActs();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <div className="page-head">
        <Link to="/companies" className="muted">
          ← Companies
        </Link>
        <span className="spacer" />
        <DataLegend />
      </div>

      {/* Header + rollup */}
      <div className="detail-header">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="co-avatar" style={{ background: `linear-gradient(135deg, ${avatarColor(company.name)}, #0891b2)` }}>
            {initials(company.name)}
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
              <span className="detail-title" style={{ marginTop: 0 }}>
                {company.name}
              </span>
              {company.segment && <span className="chip chip-b2b">{company.segment}</span>}
            </div>
            <div className="detail-sub" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {company.website && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>language</span>
                  <a href={company.website} target="_blank" rel="noreferrer noopener">
                    {company.website.replace(/^https?:\/\//, "")}
                  </a>
                </span>
              )}
              {company.industry && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>domain</span>
                  {company.industry}
                </span>
              )}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setLogging((v) => !v)}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, verticalAlign: "-4px", marginRight: 4 }}>
              add
            </span>
            Log activity
          </button>
        </div>
        <div className="stat-mini-grid">
          <div className="stat-mini"><div className="m-label">Open pipeline</div><div className="m-val tnum">{money(openPipeline)}</div></div>
          <div className="stat-mini"><div className="m-label">Won revenue</div><div className="m-val tnum">{money(won)}</div></div>
          <div className="stat-mini"><div className="m-label">Open deals</div><div className="m-val tnum">{openDeals.length}</div></div>
          <div className="stat-mini"><div className="m-label">Contacts</div><div className="m-val tnum">{contacts.length}</div></div>
        </div>
        {logging && (
          <form onSubmit={logActivity} style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <input
              style={{ flex: 1 }}
              placeholder="Log a note / call / email…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">Save</button>
          </form>
        )}
      </div>

      <div className="detail-cols">
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="panel">
            <div className="panel-head">
              <div className="icon-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-rounded">handshake</span>Deals
                <span className="sync-chip"><span className="material-symbols-rounded">sync</span>from Deals</span>
              </div>
              <Link to="/deals" className="muted" style={{ fontSize: 13 }}>View all →</Link>
            </div>
            {deals.map((d) => (
              <div className="entity-row" key={d.id}>
                <span className="entity-ic"><span className="material-symbols-rounded" style={{ fontSize: 18 }}>handshake</span></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{d.company_name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {[ownerName(d.owner_id), d.close_date ? `close ${d.close_date.slice(0, 10)}` : ""].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <span className="stage-chip" style={stageStyle(d.status)}>{d.status}</span>
                <span className="tnum" style={{ fontSize: 14, fontWeight: 700, width: 80, textAlign: "right" }}>{money(d.amount)}</span>
              </div>
            ))}
            {deals.length === 0 && <p className="muted">No deals.</p>}
          </div>

          <div className="panel">
            <div className="panel-head">
              <div className="icon-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-rounded">group</span>People
                <span className="sync-chip"><span className="material-symbols-rounded">sync</span>from Contacts</span>
              </div>
              <Link to="/contacts" className="muted" style={{ fontSize: 13 }}>View all →</Link>
            </div>
            {contacts.map((c) => (
              <div className="entity-row" key={c.id}>
                <span className="avatar-sm" style={{ background: avatarColor(c.full_name) }}>{initials(c.full_name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/contacts/${c.id}`} style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>
                    {c.full_name}
                  </Link>
                  <div className="muted" style={{ fontSize: 12 }}>{[c.title, c.lifecycle_stage].filter(Boolean).join(" · ")}</div>
                </div>
                {c.email && (
                  <a className="icon-btn" style={{ width: 30, height: 30 }} href={`mailto:${c.email}`}>
                    <span className="material-symbols-rounded" style={{ fontSize: 17 }}>mail</span>
                  </a>
                )}
              </div>
            ))}
            {contacts.length === 0 && <p className="muted">No contacts.</p>}
          </div>

          <div className="panel">
            <div className="icon-title"><span className="material-symbols-rounded">info</span>About</div>
            <div className="detail-grid">
              <div><div className="dtl-label">Industry</div><div className="dtl-val">{company.industry || "—"}</div></div>
              <div><div className="dtl-label">Segment</div><div className="dtl-val">{company.segment || "—"}</div></div>
              <div><div className="dtl-label">Owner</div><div className="dtl-val">{ownerName(company.owner_id) || "—"}</div></div>
              <div><div className="dtl-label">Founded<Star note="No founded-year field in our schema" /></div><div className="dtl-val muted">—</div></div>
              <div><div className="dtl-label">Annual revenue<Star note="Company financials aren't tracked" /></div><div className="dtl-val muted">—</div></div>
              <div><div className="dtl-label">Customer since<Star note="No first-close / customer-since date captured" /></div><div className="dtl-val muted">—</div></div>
            </div>
            {company.about && <p className="muted" style={{ marginBottom: 0 }}>{company.about}</p>}
          </div>
        </div>

        {/* Right: social activity (design 4A — not backed) + real activity timeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="panel">
            <div className="panel-head">
              <div className="icon-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-rounded">rss_feed</span>Social activity
                <Star note="No social-media integration — needs LinkedIn/X/Instagram connectors" />
              </div>
            </div>
            <div className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>
              Track what {company.name} posts across channels.
            </div>
            <div className="social-tabs">
              <span className="social-tab on">All</span>
              <span className="social-tab"><span className="pf-badge" style={{ background: "#0a66c2" }}>in</span>LinkedIn</span>
              <span className="social-tab"><span className="pf-badge" style={{ background: "#111" }}>X</span></span>
              <span className="social-tab"><span className="pf-badge" style={{ background: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af)" }}><span className="material-symbols-rounded" style={{ fontSize: 11 }}>photo_camera</span></span></span>
            </div>
            <div className="nd-empty">
              <span className="material-symbols-rounded">link</span>
              <div>No channels connected yet.<br />Social posts appear here once an account is linked.</div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-head">
              <div className="icon-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-rounded">history</span>Activity
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {acts.map((a) => (
                <div className="feed-card" key={a.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
                    <span className="badge">{a.type}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, flex: 1 }}>{a.subject}</span>
                    <span className="muted" style={{ fontSize: 11.5 }}>{a.occurred_at.slice(0, 10)}</span>
                  </div>
                  {a.body && <div style={{ fontSize: 13, lineHeight: 1.5 }}>{a.body}</div>}
                  {a.actor && <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>by {a.actor}</div>}
                </div>
              ))}
              {acts.length === 0 && <p className="muted">No activity yet — use “Log activity”.</p>}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
