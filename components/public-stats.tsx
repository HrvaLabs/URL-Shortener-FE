"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react"
import Link from "next/link"
import { actionVariants } from "@/components/admin/blocklists/labels"
import { StatGrid } from "@/components/admin/stats/stat-grid"
import { ClicksChart } from "@/components/analytics/clicks-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDuration } from "@/lib/admin-stats"
import { analyticsDay, parseServerDateTime } from "@/lib/analytics"
import { ApiError } from "@/lib/api-client"
import { usePublicStats } from "@/lib/hooks/usePublicStats"
import type { PublicStatsResponse } from "@/lib/types"
import { formatDate, formatTimeAgo } from "@/lib/utils"

type Blocklist = PublicStatsResponse["blocklists"][number]

const blocklistActionLabels: Record<Blocklist["action"], string> = {
  BLOCK: "Blocks links",
  FLAG: "Flags links for a person to check",
}

const relatedLinks = [
  { href: "/blog/how-hrva-cc-stops-phishing-links", label: "How hrva.cc stops phishing links" },
  { href: "/help/stats#numbers", label: "What these numbers mean" },
  { href: "/privacy", label: "Privacy policy" },
]

const threeTilesPerRow = "@2xl:[&_dl]:grid-cols-3"

const tileClass = "h-[7.5rem] rounded-xl"

export function PublicStats() {
  const query = usePublicStats()
  const [lastError, setLastError] = useState<Error | null>(null)
  const focusAfterError = useRef(false)
  if (query.error && query.error !== lastError) setLastError(query.error)
  const error = query.error ?? (query.isFetching ? lastError : null)

  const keepFocusAfterError = useCallback(() => {
    focusAfterError.current = true
  }, [])

  const takeFocus = useCallback(() => {
    const wanted = focusAfterError.current
    focusAfterError.current = false
    const active = document.activeElement
    return wanted && (active === null || active === document.body)
  }, [])

  const retry = () => {
    if (query.isFetching) return
    focusAfterError.current = true
    void query.refetch().then((result) => {
      if (result.data === undefined && refusalOf(result.error) === null) focusAfterError.current = false
    })
  }

  return (
    <div className="@container">
      <h1 className="font-display text-3xl leading-tight sm:text-4xl">hrva.cc in numbers</h1>
      <p className="mt-3 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        Site-wide numbers for hrva.cc, refreshed every hour. Most cover the last 30 full days. Nothing here is about a
        single link or person.
      </p>

      <div id="numbers" className="mt-4 scroll-mt-24">
        {query.data ? (
          <Numbers data={query.data} takeFocus={takeFocus} />
        ) : error ? (
          <LoadError
            error={error}
            retrying={query.isFetching}
            onRetry={retry}
            onRemovedWithFocus={keepFocusAfterError}
            takeFocus={takeFocus}
          />
        ) : (
          <NumbersSkeleton />
        )}
      </div>

      <nav aria-label="About these numbers" className="mt-12 border-t pt-6">
        <ul className="flex flex-wrap gap-x-6 gap-y-3 text-sm">
          {relatedLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-brand-link">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

function useReportRemovalWithFocus(ref: RefObject<HTMLElement | null>, onRemovedWithFocus: () => void) {
  useLayoutEffect(() => {
    const element = ref.current
    return () => {
      if (element?.contains(document.activeElement)) onRemovedWithFocus()
    }
  }, [ref, onRemovedWithFocus])
}

function refusalOf(error: Error | null): string | null {
  return error instanceof ApiError && error.status === 429 ? error.message : null
}

function Numbers({ data, takeFocus }: { data: PublicStatsResponse; takeFocus: () => boolean }) {
  const periodRef = useRef<HTMLParagraphElement>(null)
  const updatedAt = parseServerDateTime(data.updatedAt)

  useEffect(() => {
    if (takeFocus()) periodRef.current?.focus()
  }, [takeFocus])

  return (
    <>
      <p
        ref={periodRef}
        tabIndex={-1}
        className="text-sm tabular-nums text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
      >
        <time dateTime={data.from}>{formatDate(analyticsDay(data.from))}</time> –{" "}
        <time dateTime={data.to}>{formatDate(analyticsDay(data.to))}</time> · Updated{" "}
        <time dateTime={updatedAt.toISOString()}>{formatTimeAgo(updatedAt)}</time>
      </p>

      <div className="mt-8 space-y-8">
        <div className={threeTilesPerRow}>
          <StatGrid
            items={[
              { label: "Active links", value: data.activeLinks.toLocaleString(), hint: "Links that work right now." },
              { label: "Links created", value: data.linksCreated.toLocaleString(), hint: "In the last 30 days." },
              {
                label: "Clicks",
                value: data.clicks.toLocaleString(),
                hint: "In the last 30 days. Bots and link previews aren't counted.",
              },
            ]}
          />
        </div>

        <div className="relative">
          <ClicksChart
            daily={data.daily.map((day) => ({ date: day.date, clicks: day.clicks, uniqueVisitors: 0, botClicks: 0 }))}
            days={30}
            showUniqueVisitors={false}
          />
          {data.clicks === 0 && (
            <p className="pointer-events-none absolute inset-x-0 bottom-0 top-12 flex items-center justify-center px-6">
              <span className="rounded-md bg-card px-3 py-1.5 text-center text-sm text-muted-foreground">
                No clicks in the last 30 days.
              </span>
            </p>
          )}
        </div>

        <div className={threeTilesPerRow}>
          <StatGrid
            title="Keeping links safe"
            items={[
              {
                label: "Harmful links blocked",
                value: data.blocked.last30Days.toLocaleString(),
                hint: `${data.blocked.allTime.toLocaleString()} since hrva.cc started. Links refused before they were created aren't counted.`,
              },
              {
                label: "Visitor reports handled",
                value: data.visitorReportsHandled.toLocaleString(),
                hint: "Reported links a person reviewed in the last 30 days.",
              },
              {
                label: "Average review time",
                value: <AverageReviewTime minutes={data.averageReviewMinutes} />,
                hint: "From the moment hrva.cc or a visitor flags a link to a person's decision.",
              },
            ]}
          />
        </div>

        <Blocklists blocklists={data.blocklists} />
      </div>
    </>
  )
}

function AverageReviewTime({ minutes }: { minutes: number | null }) {
  if (minutes == null) {
    return <span className="text-base font-medium text-muted-foreground">No reviews in the last 30 days</span>
  }
  const { shown, spoken } = formatDuration(minutes)
  return (
    <>
      <span aria-hidden="true">{shown}</span>
      <span className="sr-only">{spoken}</span>
    </>
  )
}

function Blocklists({ blocklists }: { blocklists: Blocklist[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Blocklists in use</h2>
      {blocklists.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No blocklists are loaded right now.</p>
      ) : (
        <ul className="divide-y">
          {blocklists.map((list, index) => (
            <li key={`${index}-${list.name}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 text-sm">
              <span className="min-w-0 flex-1 basis-56 font-medium [overflow-wrap:anywhere]">{list.name}</span>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Badge variant={actionVariants[list.action]}>{blocklistActionLabels[list.action]}</Badge>
                <span className="whitespace-nowrap tabular-nums text-muted-foreground">
                  {list.entries === 1 ? "1 domain" : `${list.entries.toLocaleString()} domains`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface LoadErrorProps {
  error: Error
  retrying: boolean
  onRetry: () => void
  onRemovedWithFocus: () => void
  takeFocus: () => boolean
}

function LoadError({ error, retrying, onRetry, onRemovedWithFocus, takeFocus }: LoadErrorProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const alertRef = useRef<HTMLDivElement>(null)
  const refusal = refusalOf(error)
  useReportRemovalWithFocus(boxRef, onRemovedWithFocus)

  useEffect(() => {
    if (refusal && takeFocus()) alertRef.current?.focus()
  }, [refusal, takeFocus])

  return (
    <div ref={boxRef} className="mt-8 rounded-xl border bg-card px-6 py-12 text-center">
      <div ref={alertRef} role="alert" tabIndex={-1} className="focus-visible:ring-0 focus-visible:ring-offset-0">
        <p className="text-sm text-destructive">Couldn&apos;t load the numbers.</p>
        {refusal && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{refusal}</p>}
      </div>
      <p role="status" className="sr-only">
        {retrying ? "Trying again" : ""}
      </p>
      {!refusal && <TryAgainButton retrying={retrying} onRetry={onRetry} onRemovedWithFocus={onRemovedWithFocus} />}
    </div>
  )
}

function TryAgainButton({
  retrying,
  onRetry,
  onRemovedWithFocus,
}: {
  retrying: boolean
  onRetry: () => void
  onRemovedWithFocus: () => void
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  useReportRemovalWithFocus(buttonRef, onRemovedWithFocus)

  return (
    <Button
      ref={buttonRef}
      variant="outline"
      size="sm"
      onClick={onRetry}
      aria-disabled={retrying}
      className="mt-4 aria-disabled:opacity-50"
    >
      Try again
    </Button>
  )
}

function NumbersSkeleton() {
  return (
    <div aria-busy="true">
      <p role="status" className="sr-only">
        Loading the numbers
      </p>
      <div aria-hidden="true">
        <Skeleton className="h-5 w-80 max-w-full" />
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 @md:grid-cols-2 @2xl:grid-cols-3">
            <Skeleton className={tileClass} />
            <Skeleton className={tileClass} />
            <Skeleton className={tileClass} />
          </div>
          <Skeleton className="h-[19.25rem] rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-5 w-40" />
            <div className="grid gap-4 @md:grid-cols-2 @2xl:grid-cols-3">
              <Skeleton className={tileClass} />
              <Skeleton className={tileClass} />
              <Skeleton className={tileClass} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
