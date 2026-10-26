"use client"

import { Suspense, type FocusEvent } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PageMeta } from "@/components/page-meta"
import { AnalyticsSkeleton } from "@/components/analytics/analytics-states"
import { RangePicker } from "@/components/analytics/range-picker"
import { LinksTab } from "@/components/admin/stats/links-tab"
import { SafetyTab } from "@/components/admin/stats/safety-tab"
import { SystemTab } from "@/components/admin/stats/system-tab"
import { TrafficTab } from "@/components/admin/stats/traffic-tab"
import { UsersTab } from "@/components/admin/stats/users-tab"
import { Skeleton } from "@/components/ui/skeleton"
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

const focusRingRoom = 4

function revealFocusedTab(event: FocusEvent<HTMLDivElement>) {
  const scroller = event.currentTarget
  const tab = event.target.getBoundingClientRect()
  const view = scroller.getBoundingClientRect()
  if (tab.left - focusRingRoom < view.left) scroller.scrollLeft -= view.left - tab.left + focusRingRoom
  else if (tab.right + focusRingRoom > view.right) scroller.scrollLeft += tab.right + focusRingRoom - view.right
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
      <Skeleton className="h-9 w-72 max-w-full" />
      <AnalyticsSkeleton variant="panel" />
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
          <div className="flex max-w-full overflow-x-auto" onFocus={revealFocusedTab}>
            <TabsList aria-label="Stats">
              {STATS_TABS.map((value) => (
                <TabsTrigger key={value} value={value}>
                  {statsTabLabels[value]}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <RangePicker value={days} onChange={(next) => show({ tab, days: next })} />
        </div>
        <TabsContent value="traffic" className="mt-6">
          <TrafficTab days={days} />
        </TabsContent>
        <TabsContent value="links" className="mt-6">
          <LinksTab days={days} />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UsersTab days={days} />
        </TabsContent>
        <TabsContent value="safety" className="mt-6">
          <SafetyTab days={days} />
        </TabsContent>
        <TabsContent value="system" className="mt-6">
          <SystemTab days={days} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
