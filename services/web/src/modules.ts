/**
 * Per-module UI configuration: which columns the list view shows and which
 * fields the create form offers. Adding a module is a data change here — the
 * generic ResourcePage renders from this config.
 */
export type ColType = "text" | "date" | "link" | "number" | "bool";

export interface Column {
  key: string;
  label: string;
  type?: ColType;
}

export interface Field {
  name: string;
  label: string;
  type?: "text" | "date" | "email" | "url" | "number" | "textarea";
  required?: boolean;
}

export interface ModuleConfig {
  title: string;
  resource: string;
  description: string;
  columns: Column[];
  /** Create-form fields; omit to render a read-only (list) view. */
  fields?: Field[];
}

export const MODULES: Record<string, ModuleConfig> = {
  "b2b-leads": {
    title: "B2B Leads",
    resource: "b2b-leads",
    description: "Search, filter and manage B2B leads (REQ-004/005/006).",
    columns: [
      { key: "company_name", label: "Company" },
      { key: "industry_vertical", label: "Industry" },
      { key: "primary_poc", label: "Primary POC" },
      { key: "status", label: "Status" },
      { key: "next_follow_up_date", label: "Next Follow-up", type: "date" },
      { key: "reminder_date", label: "Reminder", type: "date" },
    ],
    fields: [
      { name: "company_name", label: "Company Name", required: true },
      { name: "industry_vertical", label: "Industry / Vertical" },
      { name: "primary_poc", label: "Primary POC" },
      { name: "title_role", label: "Title / Role" },
      { name: "contact_email", label: "Contact Email", type: "email" },
      { name: "lead_source", label: "Lead Source" },
      { name: "status", label: "Status" },
      { name: "next_follow_up_date", label: "Next Follow-up Date", type: "date" },
      { name: "reminder_date", label: "Reminder Date", type: "date" },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
  "b2g-opportunities": {
    title: "B2G Opportunities",
    resource: "b2g-opportunities",
    description: "Track government opportunities and due dates (REQ-007/008).",
    columns: [
      { key: "notice_id", label: "Notice ID" },
      { key: "agency_department", label: "Agency" },
      { key: "focus_area_rr_role", label: "Focus Area" },
      { key: "fit_score_numeric", label: "Fit" },
      { key: "due_date", label: "Due Date", type: "date" },
      { key: "status", label: "Status" },
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
    description: "Events in list view; past events are distinguished (REQ-009).",
    columns: [
      { key: "event_name", label: "Event" },
      { key: "event_date", label: "Date", type: "date" },
      { key: "location", label: "Location" },
      { key: "website_url", label: "Website", type: "link" },
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
    columns: [
      { key: "name", label: "Name" },
      { key: "deadline", label: "Deadline", type: "date" },
      { key: "submission_date", label: "Submitted", type: "date" },
      { key: "website_url", label: "Website", type: "link" },
    ],
    // No create form here — category is an FK managed by an Admin; seeded rows
    // demonstrate the view. (Create via the API / Swagger once categories exist.)
  },
  "publicity-contacts": {
    title: "Publicity Contacts",
    resource: "publicity-contacts",
    description: "Media/publicity contacts by format (REQ-012).",
    columns: [
      { key: "organization", label: "Organization" },
      { key: "format", label: "Format" },
      { key: "contact_name", label: "Contact" },
      { key: "email", label: "Email" },
    ],
    fields: [
      { name: "organization", label: "Organization", required: true },
      { name: "format", label: "Format" },
      { name: "contact_name", label: "Contact Name" },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
  },
};
