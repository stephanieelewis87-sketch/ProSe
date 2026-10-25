import type { Citation } from "@/lib/legal/types";

export function Cite({ c }: { c: Citation }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-neutral-500">
      {c.url ? <a className="underline" href={c.url} target="_blank" rel="noopener noreferrer">{c.label}</a> : c.label}
      <span className={`rounded px-1.5 py-0.5 font-sans text-[10px] font-semibold uppercase tracking-wide ${
        c.verified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
        {c.verified ? "Checked" : "To verify"}
      </span>
    </span>
  );
}

export const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC", weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
