/**
 * Asterisk convention (user request): a `*` marks any design element whose data
 * is not yet represented in our schema. `<Star>` renders the marker in a header;
 * `<DataLegend>` explains it once per page.
 */
export function Star({ note }: { note?: string }) {
  return (
    <sup
      className="nd-star"
      title={note ?? "Not yet connected to your data model"}
      aria-label="data not yet available"
    >
      *
    </sup>
  );
}

export function DataLegend({ children }: { children?: React.ReactNode }) {
  return (
    <span className="data-legend">
      <span className="nd-star">*</span>
      {children ?? "Sections marked with an asterisk need data we don't capture yet."}
    </span>
  );
}
