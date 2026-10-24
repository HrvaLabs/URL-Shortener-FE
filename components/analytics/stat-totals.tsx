import type { AnalyticsTotals } from "@/lib/types"

interface StatTotalsProps {
  totals: AnalyticsTotals
}

export function StatTotals({ totals }: StatTotalsProps) {
  const stats = [
    { label: "Clicks", value: totals.clicks },
    {
      label: "Daily unique visitors",
      value: totals.uniqueVisitors,
      hint: "Counted per day, so one person on two days counts twice.",
    },
    {
      label: "Bot clicks",
      value: totals.botClicks,
      hint: "Link previews, crawlers and scripts. Not counted as clicks.",
    },
  ]

  return (
    <dl className="grid gap-px overflow-hidden rounded-xl border bg-border shadow-[0_1px_2px_rgb(0_0_0/0.04)] sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0 bg-card p-5">
          <dt className="text-sm text-muted-foreground">{stat.label}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{stat.value.toLocaleString()}</dd>
          {stat.hint && <dd className="mt-1.5 text-xs text-muted-foreground">{stat.hint}</dd>}
        </div>
      ))}
    </dl>
  )
}
