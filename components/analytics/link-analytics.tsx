"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { PageMeta } from "@/components/page-meta"
import { StatusBadge } from "@/components/status-badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BreakdownList } from "@/components/analytics/breakdown-list"
import { ClicksChart } from "@/components/analytics/clicks-chart"
import { RangePicker } from "@/components/analytics/range-picker"
import { StatTotals } from "@/components/analytics/stat-totals"
import { ApiError } from "@/lib/api-client"
import { ANALYTICS_HISTORY_START, analyticsDay, analyticsHref, parseServerDateTime, rangeLabels } from "@/lib/analytics"
import { useUrlAnalytics } from "@/lib/hooks/useAnalytics"
import type { AnalyticsRange, UrlAnalytics } from "@/lib/types"
import { cn, formatDate, formatDateTime, formatShortUrl, formatTimeAgo } from "@/lib/utils"

interface LinkAnalyticsProps {
  linkId: number
  days: AnalyticsRange
  onDaysChange: (days: AnalyticsRange) => void
}

const refusals: Record<number, string> = {
  403: "You can only see analytics for your own links.",
  404: "This link doesn't exist or was deleted.",
}

const refusalOf = (error: Error) => (error instanceof ApiError ? refusals[error.status] : undefined)

export function LinkAnalytics({ linkId, days, onDaysChange }: LinkAnalyticsProps) {
  const { data, error, isPending, isPlaceholderData, refetch, isRefetching } = useUrlAnalytics(linkId, days)

  return (
    <div className="space-y-6">
      <PageMeta title="Dashboard — Link analytics" description="Clicks, referrers, countries and devices for one of your links." />
      <Link
        href={analyticsHref({ days })}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All analytics
      </Link>

      {isPending ? (
        <LinkAnalyticsLoading />
      ) : error ? (
        <AnalyticsError error={error} retrying={isRefetching} onRetry={() => refetch()} />
      ) : (
        <LinkAnalyticsBody data={data} days={days} onDaysChange={onDaysChange} refreshing={isPlaceholderData} />
      )}
    </div>
  )
}

interface LinkAnalyticsBodyProps {
  data: UrlAnalytics
  days: AnalyticsRange
  onDaysChange: (days: AnalyticsRange) => void
  refreshing: boolean
}

function LinkAnalyticsBody({ data, days, onDaysChange, refreshing }: LinkAnalyticsBodyProps) {
  const { link, totals, daily, breakdowns } = data
  const empty = totals.clicks + totals.botClicks === 0
  const historyStart = formatDate(analyticsDay(ANALYTICS_HISTORY_START))
  const createDate = link.createDate ? parseServerDateTime(link.createDate) : null
  const lastAccessed = link.lastAccessed ? parseServerDateTime(link.lastAccessed) : null

  return (
    <>
      <div className="min-w-0 space-y-4">
        <div className="min-w-0">
          <h1 className="font-mono text-lg font-medium text-brand [overflow-wrap:anywhere]">{formatShortUrl(link.shortUrl)}</h1>
          <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
            <StatusBadge status={link.status} className="shrink-0" />
            {link.destinationHost && (
              <span className="min-w-0 truncate text-sm text-muted-foreground" title={link.destinationHost}>
                {link.destinationHost}
              </span>
            )}
          </div>
        </div>
        <dl className="flex flex-wrap gap-x-10 gap-y-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Created</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{formatDate(createDate)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last visit</dt>
            <dd className="mt-0.5 font-medium tabular-nums" title={lastAccessed ? formatDateTime(lastAccessed) : undefined}>
              {formatTimeAgo(lastAccessed)}
            </dd>
          </div>
          <div className="max-w-sm">
            <dt className="text-xs text-muted-foreground">All-time visits</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{link.visits.toLocaleString()}</dd>
            <dd className="mt-1 text-xs text-muted-foreground">
              Daily unique visitors, added up since the link was created. Counts from before {historyStart} used an older method.
            </dd>
          </div>
        </dl>
      </div>

      <RangePicker value={days} onChange={onDaysChange} />

      <div className={cn("space-y-6 transition-opacity", refreshing && "opacity-60")} aria-busy={refreshing}>
        <StatTotals totals={totals} />

        {empty ? (
          <div className="rounded-xl border bg-card px-6 py-12 text-center">
            <p className="mx-auto max-w-md text-sm text-muted-foreground">
              No clicks in the last {rangeLabels[days]}. Daily history starts on {historyStart}, so earlier clicks only count toward all-time visits.
            </p>
          </div>
        ) : (
          <>
            <ClicksChart daily={daily} days={days} />
            <div className="grid gap-4 lg:grid-cols-2">
              <BreakdownList
                title="Referrers"
                dimension="referrers"
                entries={breakdowns.referrers}
                note={link.passwordProtected ? "Referrers aren't available for password-protected links." : undefined}
              />
              <BreakdownList title="Countries" dimension="countries" entries={breakdowns.countries} />
              <BreakdownList title="Devices" dimension="devices" entries={breakdowns.devices} />
              <BreakdownList title="Browsers" dimension="browsers" entries={breakdowns.browsers} />
              <BreakdownList title="Operating systems" dimension="operatingSystems" entries={breakdowns.operatingSystems} />
            </div>
          </>
        )}
      </div>
    </>
  )
}

interface AnalyticsErrorProps {
  error: Error
  retrying: boolean
  onRetry: () => void
}

function AnalyticsError({ error, retrying, onRetry }: AnalyticsErrorProps) {
  const refusal = refusalOf(error)
  return (
    <div className="rounded-xl border bg-card px-6 py-12 text-center">
      <p className={cn("text-sm", refusal ? "text-muted-foreground" : "text-destructive")}>
        {refusal ?? "Couldn't load analytics. Try again."}
      </p>
      {!refusal && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying} className="mt-4">
          Retry
        </Button>
      )}
    </div>
  )
}

function LinkAnalyticsLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-7 w-56 max-w-full" />
        <Skeleton className="h-5 w-40 max-w-full" />
      </div>
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )
}
