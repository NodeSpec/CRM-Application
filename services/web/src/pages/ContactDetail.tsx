import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

/** Contact profile (REQ-019): details + linked company + activity timeline. */
interface Contact {
  id: string;
  full_name: string;
  title?: string;
  email?: string;
  phone?: string;
  lifecycle_stage?: string;
  notes?: string;
  company_id?: string;
}
interface Company {
  id: string;
  name: string;
}
interface Activity {
  id: string;
  type: string;
  subject?: string;
  occurred_at: string;
}

export function ContactDetail() {
  const { id } = useParams();
  const [contact, setContact] = useState<Contact | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [acts, setActs] = useState<Activity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get<Contact>("contacts", id)
      .then((c) => {
        setContact(c);
        if (c.company_id)
          api.get<Company>("companies", c.company_id).then(setCompany).catch(() => {});
      })
      .catch((e) => setError((e as Error).message));
    api
      .list<Activity>("activities", { module: "contacts", record_id: id })
      .then(setActs)
      .catch(() => {});
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!contact) return <p className="muted">Loading…</p>;

  return (
    <>
      <div className="page-head">
        <Link to="/contacts" className="muted">
          ← Contacts
        </Link>
      </div>
      <div className="panel">
        <h1 style={{ margin: 0 }}>{contact.full_name}</h1>
        <div className="muted">
          {[contact.title, contact.lifecycle_stage].filter(Boolean).join(" · ")}
        </div>
        <div className="muted">
          {contact.email}
          {contact.phone ? ` · ${contact.phone}` : ""}
          {company && (
            <>
              {" · "}
              <Link to={`/companies/${company.id}`}>{company.name}</Link>
            </>
          )}
        </div>
        {contact.notes && <p>{contact.notes}</p>}
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
