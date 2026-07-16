import { useEffect, useState } from "react";
import { api } from "../api/client";

/** Shape of GET /api/v1/meta — filter options + alert thresholds. */
export interface CustomFieldDef {
  module: string;
  key: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options: string[];
  sort_order: number;
}

export interface Meta {
  lead_statuses: { label: string; is_closed: boolean }[];
  submission_categories: { id: string; label: string }[];
  publicity_formats: string[];
  contact_lifecycle_stages: string[];
  owners: { id: string; display_name: string; email: string }[];
  custom_field_defs: CustomFieldDef[];
  thresholds: {
    b2g_due_date_threshold_days: number;
    submission_deadline_threshold_days: number;
  };
}

let cache: Meta | null = null;
let inflight: Promise<Meta> | null = null;

/** Fetch /meta once and share it across components. */
export function useMeta(): Meta | null {
  const [meta, setMeta] = useState<Meta | null>(cache);
  useEffect(() => {
    if (cache) {
      setMeta(cache);
      return;
    }
    if (!inflight) inflight = api.object<Meta>("meta").then((m) => (cache = m));
    let active = true;
    inflight.then((m) => active && setMeta(m)).catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return meta;
}
