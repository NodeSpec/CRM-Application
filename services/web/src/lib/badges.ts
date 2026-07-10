/** Due-date badge helpers (REQ-008 B2G, REQ-010 submissions). */
export interface BadgeInfo {
  text: string;
  kind: "warn" | "neg" | "pos" | "muted";
  icon?: string;
}

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr.slice(0, 10) + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

/** B2G: red when past due & not closed, amber when within the threshold. */
export function b2gDueBadge(
  dueDate: unknown,
  status: unknown,
  thresholdDays: number
): BadgeInfo | null {
  if (!dueDate) return null;
  const closed = /closed/i.test(String(status ?? ""));
  if (closed) return null;
  const days = daysUntil(String(dueDate));
  if (days < 0) return { text: "Past due", kind: "neg", icon: "error" };
  if (days <= thresholdDays)
    return { text: `Due in ${days}d`, kind: "warn", icon: "schedule" };
  return null;
}

/** Submission deadline: only flagged while unsubmitted (REQ-010). */
export function submissionDeadlineBadge(
  deadline: unknown,
  submissionDate: unknown,
  thresholdDays: number
): BadgeInfo | null {
  if (submissionDate || !deadline) return null;
  const days = daysUntil(String(deadline));
  if (days < 0) return { text: "Overdue", kind: "neg", icon: "error" };
  if (days <= thresholdDays)
    return { text: `Due in ${days}d`, kind: "warn", icon: "schedule" };
  return null;
}

/** Submitted vs pending chip (REQ-010). */
export function submissionStatusBadge(submissionDate: unknown): BadgeInfo {
  return submissionDate
    ? { text: "Submitted", kind: "pos", icon: "check_circle" }
    : { text: "Pending", kind: "muted" };
}
