"use client"

import Link from "next/link"
import { PageMeta } from "@/components/page-meta"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ClicksChart } from "@/components/analytics/clicks-chart"
import { RangePicker } from "@/components/analytics/range-picker"
import { StatTotals } from "@/components/analytics/stat-totals"
import { ANALYTICS_HISTORY_START, analyticsDay, analyticsHref, rangeLabels } from "@/lib/analytics"
import { useAnalyticsOverview } from "@/lib/hooks/useAnalytics"
import type { AnalyticsOverview, AnalyticsRange, AnalyticsTopLink } from "@/lib/types"
import { cn, formatDate } from "@/lib/utils"

interface OverviewAnalyticsProps {
  days: AnalyticsRange
  onDaysChange: (days: AnalyticsRange) => void
}

const plural = (count: number, word: string) => `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`

export function OverviewAnalytics({ days, onDaysChange }: OverviewAnalyticsProps) {
  const { data, error, isPending, isPlaceholderData, refetch, isRefetching } = useAnalyticsOverview(days)

  return (
    <div className="space-y-6">
      <PageMeta title="Dashboard — Analytics" description="Clicks, daily unique visitors and top links across all your links." />
      <div>
        <h1 className="font-display text-2xl">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Clicks across all your links</p>
      </div>

      {isPending ? (
        <OverviewLoading />
      ) : error ? (
        <OverviewError retrying={isRefetching} onRetry={() => refetch()} />
      ) : (
        <OverviewBody data={data} days={days} onDaysChange={onDaysChange} refreshing={isPlaceholderData} />
      )}
    </div>
  )
}

interface OverviewBodyProps {
  data: AnalyticsOverview
  days: AnalyticsRange
  onDaysChange: (days: AnalyticsRange) => void
  refreshing: boolean
}

function OverviewBody({ data, days, onDaysChange, refreshing }: OverviewBodyProps) {
  const { totals, daily, topLinks } = data
  const empty = totals.clicks + totals.botClicks === 0
  const historyStart = formatDate(analyticsDay(ANALYTICS_HISTORY_START))
  const counters = [
    { label: "Links", value: data.totalUrls },
    { label: "Active", value: data.activeUrls },
    { label: "Expired", value: data.expiredUrls },
  ]

  return (
    <>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">All time</h2>
        <dl className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          {counters.map((counter) => (
            <div key={counter.label}>
              <dt className="text-xs text-muted-foreground">{counter.label}</dt>
              <dd className="mt-0.5 font-medium tabular-nums">{counter.value.toLocaleString()}</dd>
            </div>
          ))}
          <div className="max-w-sm">
            <dt className="text-xs text-muted-foreground">All-time visits</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{data.totalVisits.toLocaleString()}</dd>
            <dd className="mt-1 text-xs text-muted-foreground">
              Daily unique visitors, added up since each link was created. Counts from before {historyStart} used an older method.
            </dd>
          </div>
        </dl>
      </section>

      <RangePicker value={days} onChange={onDaysChange} />

      <div className={cn("space-y-6 transition-opacity", refreshing && "opacity-60")} aria-busy={refreshing}>
        <StatTotals
          totals={totals}
          uniqueVisitorsHint="Counted per day and per link, so one person on two different days or two links counts twice."
        />

        {empty ? (
          <div className="rounded-xl border bg-card px-6 py-12 text-center">
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              No clicks in the last {rangeLabels[days]}. Daily history starts on {historyStart}, so earlier clicks only count toward all-time visits.
            </p>
          </div>
        ) : (
          <>
            <ClicksChart daily={daily} days={days} />
            <TopLinks links={topLinks} days={days} />
          </>
        )}
      </div>
    </>
  )
}

interface TopLinksProps {
  links: AnalyticsTopLink[]
  days: AnalyticsRange
}

function TopLinks({ links, days }: TopLinksProps) {
  const top = Math.max(1, ...links.map((link) => link.clicks))

  return (
    <section className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Top links</h2>
      {links.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No clicks in this range.</p>
      ) : (
        <ol className="space-y-1 p-2">
          {links.map((link) => (
            <li key={link.id}>
              <Link
                href={analyticsHref({ link: link.id, days })}
                className="block space-y-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent"
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="min-w-0 truncate font-mono text-[13px] font-medium text-brand">/{link.shortUrl}</span>
                  <span className="shrink-0 text-sm tabular-nums">{plural(link.clicks, "click")}</span>
                </span>
                <span aria-hidden="true" className="block h-1.5 overflow-hidden rounded-full bg-muted">
                  <span className="block h-full rounded-full bg-brand" style={{ width: `${(link.clicks / top) * 100}%` }} />
                </span>
                <span className="flex items-baseline justify-between gap-4 text-xs text-muted-foreground">
                  <span className="min-w-0 truncate" title={link.destinationHost || undefined}>
                    {link.destinationHost}
                  </span>
                  <span className="shrink-0 tabular-nums">{plural(link.uniqueVisitors, "daily unique visitor")}</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

interface OverviewErrorProps {
  retrying: boolean
  onRetry: () => void
}

function OverviewError({ retrying, onRetry }: OverviewErrorProps) {
  return (
    <div className="rounded-xl border bg-card px-6 py-12 text-center">
      <p className="text-sm text-destructive">Couldn&apos;t load analytics. Try again.</p>
      <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying} className="mt-4">
        Retry
      </Button>
    </div>
  )
}

function OverviewLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-10 w-96 max-w-full" />
      </div>
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )
}
