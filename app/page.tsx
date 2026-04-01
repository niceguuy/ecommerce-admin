import { StatsGrid } from "@/components/dashboard/stats-grid";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 lg:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">
          Overview
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Performance and key metrics for your store.
        </p>
      </div>

      <StatsGrid />

      <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6">
        <h2 className="text-sm font-medium text-zinc-300">Recent activity</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Charts and detailed reports can be added here. Your core metrics are
          above.
        </p>
      </section>
    </div>
  );
}
