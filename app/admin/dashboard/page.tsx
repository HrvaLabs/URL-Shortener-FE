"use client"

import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageMeta } from "@/components/page-meta"
import { AnalyticsSkeleton } from "@/components/analytics/analytics-states"
import { RangePicker } from "@/components/analytics/range-picker"
import { LoginRateLimits } from "@/components/admin/stats/login-rate-limits"
import { TrafficTab } from "@/components/admin/stats/traffic-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { STATS_TABS, adminStatsHref, parseStatsTab, statsTabLabels, type StatsTab } from "@/lib/admin-stats"
import { parseAnalyticsRange } from "@/lib/analytics"
import type { AnalyticsRange } from "@/lib/types"

export default function AdminStatsPage() {
  return (
    <Suspense fallback={<StatsLoading />}>
      <Stats />
    </Suspense>
  )
}

function PageTitle() {
  return (
    <div>
      <h1 className="font-display text-2xl">Stats</h1>
      <p className="mt-1 text-sm text-muted-foreground">Site-wide totals for hrva.cc. Nothing here identifies a visitor.</p>
    </div>
  )
}

function StatsLoading() {
  return (
    <div className="space-y-6">
      <PageTitle />
      <AnalyticsSkeleton variant="overview" />
    </div>
  )
}

function Stats() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = parseStatsTab(searchParams.get("tab"))
  const days = parseAnalyticsRange(searchParams.get("days"))
  const show = (next: { tab: StatsTab; days: AnalyticsRange }) => router.replace(adminStatsHref(next), { scroll: false })

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Stats" description="Site-wide totals for hrva.cc. Nothing here identifies a visitor." />
      <PageTitle />

      <Tabs value={tab} onValueChange={(next) => show({ tab: parseStatsTab(next), days })}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList aria-label="Stats">
            {STATS_TABS.map((value) => (
              <TabsTrigger key={value} value={value}>
                {statsTabLabels[value]}
              </TabsTrigger>
            ))}
          </TabsList>
          <RangePicker value={days} onChange={(next) => show({ tab, days: next })} />
        </div>
        <TabsContent value="traffic" className="mt-6">
          <TrafficTab days={days} />
        </TabsContent>
      </Tabs>

      <LoginRateLimits />
    </div>
  )
}
