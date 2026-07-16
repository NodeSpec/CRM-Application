import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

/** Company / Account 360 (REQ-020): header + integrated contacts, deals, activity. */
interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  segment?: string;
  about?: string;
}
interface Contact {
  id: string;
  full_name: string;
  title?: string;
}
interface Lead {
  id: string;
  company_name: string;
  status: string;
  amount?: number | null;
}
interface Activity {
  id: string;
  type: string;
  subject?: string;
  occurred_at: string;
}

const money = (n?: number | null) =>
  n == null ? "—" : "$" + Number(n).toLocaleString();

export function Company360() {
  const { id } = useParams();
  const [company, setCompany] = useState<Company | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [deals, setDeals] = useState<Lead[]>([]);
  const [acts, setActs] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get<Company>("companies", id).then(setCompany).catch((e) => setError((e as Error).message));
    api.list<Contact>("contacts", { company_id: id }).then(setContacts).catch(() => {});
    api.list<Lead>("b2b-leads", { company_id: id }).then(setDeals).catch(() => {});
    api
      .list<Activity>("activities", { module: "companies", record_id: id })
      .then(setActs)
      .catch(() => {});
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!company) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="page-head">
        <Link to="/companies" className="muted">
          ← Companies
        </Link>
      </div>
      <div className="panel">
        <h1 style={{ margin: 0 }}>{company.name}</h1>
        <div className="muted">
          {[company.industry, company.segment].filter(Boolean).join(" · ")}
        </div>
        {company.website && (
          <div>
            <a href={company.website} target="_blank" rel="noreferrer noopener">
              {company.website}
            </a>
          </div>
        )}
        {company.about && <p>{company.about}</p>}
      </div>
      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Deals</div>
          </div>
          {deals.length ? (
            deals.map((d) => (
              <div className="pipe-row" key={d.id}>
                <span className="pipe-name">{d.company_name}</span>
                <span className="badge">{d.status}</span>
                <span className="pipe-count tnum">{money(d.amount)}</span>
              </div>
            ))
          ) : (
            <p className="muted">No deals.</p>
          )}
        </div>
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Contacts</div>
          </div>
          {contacts.length ? (
            contacts.map((c) => (
              <div className="pipe-row" key={c.id}>
                <Link to={`/contacts/${c.id}`} className="pipe-name">
                  {c.full_name}
                </Link>
                <span className="muted">{c.title}</span>
              </div>
            ))
          ) : (
            <p className="muted">No contacts.</p>
          )}
        </div>
      </div>
      <div className="panel">
        <div className="panel-head">
          <div className="panel-title">Activity</div>
        </div>
        {acts.length ? (
          acts.map((a) => (
            <div className="pipe-row" key={a.id}>
              <span className="badge">{a.type}</span>
              <span className="pipe-name">{a.subject}</span>
              <span className="muted">{a.occurred_at.slice(0, 10)}</span>
            </div>
          ))
        ) : (
          <p className="muted">No activity yet.</p>
        )}
      </div>
    </>
  );
}
