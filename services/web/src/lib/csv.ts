import type { Column } from "../modules";

/** Serialize the current (filtered) rows to CSV using the module's columns as
 *  headers, then trigger a browser download (REQ-006 "export the filtered view"). */
function escape(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function rowsToCsv(
  rows: Record<string, unknown>[],
  columns: Column[]
): string {
  const header = columns.map((c) => escape(c.label)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const v = row[c.key];
          return escape(c.type === "date" && v ? String(v).slice(0, 10) : v);
        })
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
