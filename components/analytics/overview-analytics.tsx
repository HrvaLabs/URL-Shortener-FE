"use client"

import { useQuery } from "@tanstack/react-query"
import { analyticsApi } from "@/lib/api-client"
import { PageMeta } from "@/components/page-meta"

export function OverviewAnalytics() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["analytics", "overview"],
    queryFn: () => analyticsApi.getOverview(),
  })

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div>
        <PageMeta title="Dashboard — Analytics" />
        <p className="text-sm text-destructive">Failed to load analytics</p>
      </div>
    )
  }

  const cards = [
    { label: "Total visits", value: stats.totalVisits.toLocaleString() },
    { label: "URLs", value: stats.totalUrls.toLocaleString() },
    { label: "Active", value: stats.activeUrls.toLocaleString() },
    { label: "Expired", value: stats.expiredUrls.toLocaleString() },
  ]

  const maxVisits = Math.max(1, ...stats.topUrls.map((u) => u.visits))

  return (
    <div className="space-y-6">
      <PageMeta title="Dashboard — Analytics" description="Visit analytics across your shortened URLs." />
      <div>
        <h1 className="font-display text-2xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Visit totals across your links</p>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{c.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-xl border bg-card">
        <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Top URLs by visits</h2>
        {stats.topUrls.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">No URLs yet.</p>
        ) : (
          <ul className="divide-y">
            {stats.topUrls.map((u) => (
              <li key={u.id} className="space-y-2 px-5 py-4">
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="min-w-0 truncate font-mono text-[13px] font-medium text-brand">/{u.shortUrl}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{u.visits.toLocaleString()} visits</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(u.visits / maxVisits) * 100}%` }} />
                </div>
                <p className="truncate text-xs text-muted-foreground" title={u.longUrl}>{u.longUrl}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
