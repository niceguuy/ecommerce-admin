import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Revenue",
    value: "$48,294",
    change: "+12.4%",
    positive: true,
    sub: "vs last month",
  },
  {
    label: "Conversion",
    value: "3.82%",
    change: "+0.6%",
    positive: true,
    sub: "store average",
  },
  {
    label: "Deals",
    value: "1,024",
    change: "+8.1%",
    positive: true,
    sub: "closed this month",
  },
  {
    label: "Leads",
    value: "3,891",
    change: "-2.3%",
    positive: false,
    sub: "new signups",
  },
] as const;

export function StatsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-5 shadow-sm shadow-black/20"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            {s.label}
          </p>
          <div className="mt-2 flex items-end justify-between gap-2">
            <p className="text-2xl font-semibold tracking-tight text-zinc-50 tabular-nums">
              {s.value}
            </p>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-xs font-medium tabular-nums",
                s.positive
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              )}
            >
              {s.change}
            </span>
          </div>
          <p className="mt-2 text-xs text-zinc-600">{s.sub}</p>
        </div>
      ))}
    </div>
  );
}
