/**
 * Generic module screen scaffold. Each CRM module (B2B leads, B2G
 * opportunities, events, submissions, publicity contacts) renders one of these
 * with its resource path and column set. The list/detail/create/edit/delete
 * behaviour is a TODO under the chosen scaffold scope — the routing, layout and
 * API wiring are in place so filling in a module is contained work.
 */
export interface ResourcePageProps {
  title: string;
  /** API resource path under /api/v1, e.g. "b2b-leads". */
  resource: string;
  /** Columns to show in the list view once implemented. */
  columns: string[];
  description?: string;
}

export function ResourcePage({
  title,
  resource,
  columns,
  description,
}: ResourcePageProps) {
  return (
    <section>
      <h1>{title}</h1>
      {description && <p className="muted">{description}</p>}
      <p className="muted">
        API: <code>/api/v1/{resource}</code>
      </p>
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan={columns.length} className="muted">
              {/* TODO(scaffold): fetch via api.list(resource) and render rows. */}
              Scaffold — records load here once the module is implemented.
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
