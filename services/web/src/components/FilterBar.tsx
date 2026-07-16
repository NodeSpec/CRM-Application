import type { FilterDef, ModuleConfig, OptionSource } from "../modules";
import type { Meta } from "../lib/useMeta";

/**
 * Filter controls for a list view (REQ-006). Search box (?q=), per-field
 * dropdowns / text / date-range / number-range inputs, plus Clear and Export.
 * Values live in the parent (ResourcePage) as a flat query-param map.
 */
interface Props {
  config: ModuleConfig;
  meta: Meta | null;
  values: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  onExport: () => void;
}

function options(source: OptionSource | undefined, meta: Meta | null) {
  if (!meta || !source) return [] as { value: string; label: string }[];
  if (source === "lead_statuses")
    return meta.lead_statuses.map((s) => ({ value: s.label, label: s.label }));
  if (source === "submission_categories")
    return meta.submission_categories.map((c) => ({
      value: c.id,
      label: c.label,
    }));
  if (source === "contact_lifecycle_stages")
    return meta.contact_lifecycle_stages.map((s) => ({ value: s, label: s }));
  if (source === "owners")
    return meta.owners.map((o) => ({
      value: o.id,
      label: o.display_name || o.email,
    }));
  return meta.publicity_formats.map((f) => ({ value: f, label: f }));
}

export function FilterBar({ config, meta, values, onChange, onExport }: Props) {
  const set = (k: string, v: string) => {
    const next = { ...values };
    if (v === "") delete next[k];
    else next[k] = v;
    onChange(next);
  };

  const renderFilter = (f: FilterDef) => {
    if (f.type === "select") {
      return (
        <label className="filter-field" key={f.name}>
          <span>{f.label}</span>
          <select value={values[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>
            <option value="">All</option>
            {options(f.optionsFrom, meta).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      );
    }
    if (f.type === "dateRange" || f.type === "numberRange") {
      const t = f.type === "dateRange" ? "date" : "number";
      return (
        <label className="filter-field" key={f.name}>
          <span>{f.label}</span>
          <span style={{ display: "flex", gap: 6 }}>
            <input
              type={t}
              value={values[`${f.name}_from`] ?? ""}
              onChange={(e) => set(`${f.name}_from`, e.target.value)}
              aria-label={`${f.label} from`}
            />
            <input
              type={t}
              value={values[`${f.name}_to`] ?? ""}
              onChange={(e) => set(`${f.name}_to`, e.target.value)}
              aria-label={`${f.label} to`}
            />
          </span>
        </label>
      );
    }
    return (
      <label className="filter-field" key={f.name}>
        <span>{f.label}</span>
        <input
          type="text"
          value={values[f.name] ?? ""}
          onChange={(e) => set(f.name, e.target.value)}
        />
      </label>
    );
  };

  const hasFilters = Object.keys(values).length > 0;

  return (
    <div className="filter-bar">
      {config.searchable && (
        <label className="filter-field">
          <span>Search</span>
          <input
            className="filter-search"
            type="search"
            placeholder="Search…"
            value={values.q ?? ""}
            onChange={(e) => set("q", e.target.value)}
          />
        </label>
      )}
      {(config.filters ?? []).map(renderFilter)}
      <div className="filter-actions">
        {hasFilters && (
          <button className="btn" onClick={() => onChange({})}>
            Clear
          </button>
        )}
        <button className="btn" onClick={onExport}>
          <span
            className="material-symbols-rounded"
            style={{ fontSize: 16, verticalAlign: "-3px", marginRight: 4 }}
          >
            download
          </span>
          Export CSV
        </button>
      </div>
    </div>
  );
}
