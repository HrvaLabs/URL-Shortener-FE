"use client"

import { actionLabels, actionVariants } from "@/components/admin/blocklists/labels"
import { RankedList } from "@/components/admin/stats/ranked-list"
import { StackedDailyChart, inFillOrder, type StackFill } from "@/components/admin/stats/stacked-daily-chart"
import { StatGrid } from "@/components/admin/stats/stat-grid"
import { StatsPanel } from "@/components/admin/stats/stats-panel"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatBytes, formatMinutes, resolutionLabels, reviewSourceLabels } from "@/lib/admin-stats"
import { parseServerDateTime } from "@/lib/analytics"
import { useSafetyStats } from "@/lib/hooks/useSiteStats"
import { blockReasonLabels } from "@/lib/labels"
import type { AnalyticsRange, BlockReason, SafetyStats, SourceHealth } from "@/lib/types"
import { formatDateTime, formatTimeAgo, plural } from "@/lib/utils"

const blockReasonFills: Record<BlockReason, StackFill> = {
  SAFE_BROWSING: { step: 100 },
  BLOCKLIST: { step: 100, hatch: true },
  DOMAIN_RULE: { step: 55 },
  SCAM_SIGNALS: { step: 55, hatch: true },
  ADMIN: { step: 25 },
  USER_BLOCKED: { step: 25, hatch: true },
}

const blockedLabels: Record<string, string> = { ...blockReasonLabels, unknown: "Unknown" }

const resolvedLabels: Record<string, string> = { ...resolutionLabels, unknown: "Unknown" }

interface SafetyTabProps {
  days: AnalyticsRange
}

export function SafetyTab({ days }: SafetyTabProps) {
  const query = useSafetyStats(days)
  return <StatsPanel query={query}>{(data) => <SafetyBody data={data} days={days} />}</StatsPanel>
}

interface SafetyBodyProps {
  data: SafetyStats
  days: AnalyticsRange
}

function SafetyBody({ data, days }: SafetyBodyProps) {
  const { resolveTimes, domainRules } = data

  return (
    <>
      <StackedDailyChart
        title="Reviews opened per day"
        hint="An entry the checks also flagged counts as flagged."
        series={data.reviewsOpened}
        labels={reviewSourceLabels}
        days={days}
      />
      <StatGrid
        items={[
          { label: "Open reviews", value: data.openReviews.toLocaleString(), href: "/admin/review" },
          { label: "Of which visitor reports", value: data.openVisitorReports.toLocaleString() },
          {
            label: "Possible scammers",
            value: data.possibleScammers.toLocaleString(),
            hint: "Signals only; nothing is blocked automatically.",
          },
        ]}
      />
      <RankedList
        title="Resolved in this range"
        valueLabel="Reviews"
        entries={data.resolved}
        label={(value) => resolvedLabels[value] ?? value}
        emptyText="No reviews resolved in this range."
      />
      <StatGrid
        title="Time to resolve"
        hint={`From flag to decision, for the ${plural(resolveTimes.count, "review")} resolved in this range.`}
        items={[
          { label: "Median", value: formatMinutes(resolveTimes.medianMinutes) },
          { label: "90th percentile", value: formatMinutes(resolveTimes.p90Minutes) },
        ]}
      />
      <StackedDailyChart
        title="Links blocked per day"
        hint="Links that are still blocked, by the day they were blocked."
        series={inFillOrder(data.blocked, blockReasonFills)}
        labels={blockedLabels}
        fills={blockReasonFills}
        days={days}
      />
      <StatGrid
        title="Domain rules"
        items={[
          { label: "Blocked domains", value: domainRules.block.toLocaleString() },
          { label: "Trusted domains", value: domainRules.allow.toLocaleString() },
        ]}
      />
      <Blocklists sources={data.sources} />
    </>
  )
}

function Blocklists({ sources }: { sources: SourceHealth[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Blocklists</h2>
      {sources.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No blocklists yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>On</TableHead>
              <TableHead className="text-right">Entries</TableHead>
              <TableHead className="text-right">Memory</TableHead>
              <TableHead className="whitespace-nowrap">Last loaded</TableHead>
              <TableHead className="whitespace-nowrap">Last error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => {
              const loaded = source.lastSuccessAt ? parseServerDateTime(source.lastSuccessAt) : null
              return (
                <TableRow key={source.id}>
                  <TableCell>
                    <span className="block min-w-32 font-medium [overflow-wrap:anywhere]">{source.name}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionVariants[source.action] ?? "secondary"}>{actionLabels[source.action] ?? source.action}</Badge>
                  </TableCell>
                  <TableCell className={source.enabled ? undefined : "text-muted-foreground"}>{source.enabled ? "Yes" : "No"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{source.domainCount?.toLocaleString() ?? "—"}</TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">{formatBytes(source.memoryBytes)}</TableCell>
                  <TableCell className="tabular-nums text-muted-foreground">
                    {loaded ? (
                      <span className="block min-w-40">
                        <span className="whitespace-nowrap">{formatTimeAgo(loaded)}</span> ·{" "}
                        <span className="whitespace-nowrap">{formatDateTime(loaded)}</span>
                      </span>
                    ) : (
                      "Never"
                    )}
                  </TableCell>
                  <TableCell>
                    {source.lastError ? (
                      <span className="block min-w-48 text-destructive [overflow-wrap:anywhere]">{source.lastError}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </section>
  )
}
