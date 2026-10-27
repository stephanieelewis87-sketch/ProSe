export function Box({ tone, children }: { tone: "ok" | "warn" | "bad" | "plain"; children: React.ReactNode }) {
  const bg = {
    ok: "bg-emerald-50 dark:bg-emerald-950",
    warn: "bg-amber-50 dark:bg-amber-950",
    bad: "bg-red-50 dark:bg-red-950",
    plain: "bg-neutral-100 dark:bg-neutral-800",
  }[tone];
  return <div className={`flex flex-col gap-1.5 rounded-lg p-4 text-sm ${bg}`}>{children}</div>;
}
