"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AnalyticsViewSwitch } from "@/components/analytics/analytics-view-switch"
import { BioAnalytics } from "@/components/analytics/bio-analytics"
import { LinkAnalytics } from "@/components/analytics/link-analytics"
import { OverviewAnalytics } from "@/components/analytics/overview-analytics"
import { analyticsHref, parseAnalyticsRange, parseAnalyticsView, parseLinkId } from "@/lib/analytics"
import type { AnalyticsRange } from "@/lib/types"

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsLoading />}>
      <Analytics />
    </Suspense>
  )
}

function AnalyticsLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
    </div>
  )
}

function Analytics() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const link = parseLinkId(searchParams.get("link"))
  const days = parseAnalyticsRange(searchParams.get("days"))
  const view = parseAnalyticsView(searchParams.get("view"))
  const onDaysChange = (next: AnalyticsRange) => router.replace(analyticsHref({ link, days: next, view }), { scroll: false })

  if (link != null) return <LinkAnalytics linkId={link} days={days} onDaysChange={onDaysChange} />
  return (
    <div className="space-y-6">
      <AnalyticsViewSwitch view={view} days={days} />
      {view === "bio" ? (
        <BioAnalytics days={days} onDaysChange={onDaysChange} />
      ) : (
        <OverviewAnalytics days={days} onDaysChange={onDaysChange} />
      )}
    </div>
  )
}
