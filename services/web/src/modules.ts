/**
 * Per-module UI configuration: list columns, create-form fields, filter
 * controls, and due-date badge behaviour. The generic ResourcePage renders
 * entirely from this config, so adding/adjusting a module is a data change.
 */
export type ColType = "text" | "date" | "link" | "number" | "bool";

/** Where a select's options come from (fetched via /meta). */
export type OptionSource =
  | "lead_statuses"
  | "submission_categories"
  | "publicity_formats";

export interface Column {
  key: string;
  label: string;
  type?: ColType;
  /** Renders a due-date badge next to the value (REQ-008/010). */
  badge?: "b2g_due" | "submission_deadline" | "submission_status";
}

export interface Field {
  name: string;
  label: string;
  type?: "text" | "date" | "email" | "url" | "number" | "textarea" | "select";
  required?: boolean;
  optionsFrom?: OptionSource;
}

export type FilterType = "select" | "text" | "dateRange" | "numberRange";

export interface FilterDef {
  /** Query-param base (a real column name). */
  name: string;
  label: string;
  type: FilterType;
  optionsFrom?: OptionSource;
}

export interface ModuleConfig {
  title: string;
  resource: string;
  description: string;
  columns: Column[];
  fields?: Field[];
  /** Show the free-text search box (maps to ?q=). */
  searchable?: boolean;
  filters?: FilterDef[];
}

export const MODULES: Record<string, ModuleConfig> = {
  "b2b-leads": {
    title: "B2B Leads",
    resource: "b2b-leads",
    description: "Search, filter and manage B2B leads (REQ-004/005/006).",
    searchable: true,
    columns: [
      { key: "company_name", label: "Company" },
      { key: "industry_vertical", label: "Industry" },
      { key: "primary_poc", label: "Primary POC" },
      { key: "status", label: "Status" },
      { key: "next_follow_up_date", label: "Next Follow-up", type: "date" },
      { key: "reminder_date", label: "Reminder", type: "date" },
    ],
    filters: [
      { name: "status", label: "Status", type: "select", optionsFrom: "lead_statuses" },
      { name: "industry_vertical", label: "Industry", type: "text" },
      { name: "lead_source", label: "Lead Source", type: "text" },
      { name: "initial_contact_date", label: "Initial Contact", type: "dateRange" },
      { name: "next_follow_up_date", label: "Next Follow-up", type: "dateRange" },
    ],
    fields: [
      { name: "company_name", label: "Company Name", required: true },
      { name: "industry_vertical", label: "Industry / Vertical" },
      { name: "primary_poc", label: "Primary POC" },
      { name: "title_role", label: "Title / Role" },
      { name: "contact_email", label: "Contact Email", type: "email" },
      { name: "lead_source", label: "Lead Source" },
      { name: "status", label: "Status", type: "select", optionsFrom: "lead_statuses" },
      { name: "next_follow_up_date", label: "Next Follow-up Date", type: "date" },
      { name: "reminder_date", label: "Reminder Date", type: "date" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  "b2g-opportunities": {
    title: "B2G Opportunities",
    resource: "b2g-opportunities",
    description: "Track government opportunities and due dates (REQ-007/008).",
    searchable: true,
    columns: [
      { key: "notice_id", label: "Notice ID" },
      { key: "agency_department", label: "Agency" },
      { key: "focus_area_rr_role", label: "Focus Area" },
      { key: "fit_score_numeric", label: "Fit" },
      { key: "due_date", label: "Due Date", type: "date", badge: "b2g_due" },
      { key: "status", label: "Status" },
    ],
    filters: [
      { name: "status", label: "Status", type: "text" },
      { name: "agency_department", label: "Agency", type: "text" },
      { name: "focus_area_rr_role", label: "Focus Area", type: "text" },
      { name: "fit_score_numeric", label: "Fit Score", type: "numberRange" },
      { name: "due_date", label: "Due Date", type: "dateRange" },
    ],
    fields: [
      { name: "notice_id", label: "Notice ID", required: true },
      { name: "agency_department", label: "Agency / Department" },
      { name: "opportunity_link", label: "Opportunity Link", type: "url" },
      { name: "focus_area_rr_role", label: "Focus Area / RR Role" },
      { name: "fit_score_numeric", label: "Fit Score (1-10)", type: "number" },
      { name: "due_date", label: "Due Date", type: "date" },
      { name: "contact_email", label: "Contact Email", type: "email" },
      { name: "status", label: "Status" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  events: {
    title: "Events",
    resource: "events",
    description: "Events in list or calendar view; past events are distinguished (REQ-009).",
    searchable: true,
    columns: [
      { key: "event_name", label: "Event" },
      { key: "event_date", label: "Date", type: "date" },
      { key: "location", label: "Location" },
      { key: "website_url", label: "Website", type: "link" },
    ],
    filters: [
      { name: "event_date", label: "Date", type: "dateRange" },
      { name: "location", label: "Location", type: "text" },
    ],
    fields: [
      { name: "event_name", label: "Event Name", required: true },
      { name: "event_date", label: "Date", type: "date", required: true },
      { name: "location", label: "Location", required: true },
      { name: "website_url", label: "Website", type: "url" },
    ],
  },
  submissions: {
    title: "Submissions",
    resource: "submissions",
    description: "Submissions with deadlines and submitted status (REQ-010).",
    searchable: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "deadline", label: "Deadline", type: "date", badge: "submission_deadline" },
      { key: "submission_date", label: "Status", badge: "submission_status" },
      { key: "website_url", label: "Website", type: "link" },
    ],
    filters: [
      { name: "category_id", label: "Category", type: "select", optionsFrom: "submission_categories" },
      { name: "deadline", label: "Deadline", type: "dateRange" },
    ],
    fields: [
      { name: "name", label: "Name", required: true },
      { name: "category_id", label: "Category", type: "select", optionsFrom: "submission_categories", required: true },
      { name: "deadline", label: "Deadline", type: "date", required: true },
      { name: "submission_date", label: "Submission Date", type: "date" },
      { name: "website_url", label: "Website", type: "url" },
    ],
  },
  "publicity-contacts": {
    title: "Publicity Contacts",
    resource: "publicity-contacts",
    description: "Media/publicity contacts by format (REQ-012).",
    searchable: true,
    columns: [
      { key: "organization", label: "Organization" },
      { key: "format", label: "Format" },
      { key: "contact_name", label: "Contact" },
      { key: "email", label: "Email" },
    ],
    filters: [
      { name: "format", label: "Format", type: "select", optionsFrom: "publicity_formats" },
    ],
    fields: [
      { name: "organization", label: "Organization", required: true },
      { name: "format", label: "Format", type: "select", optionsFrom: "publicity_formats" },
      { name: "contact_name", label: "Contact Name" },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
};
