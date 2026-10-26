"use client"

import { AlertCircle } from "lucide-react"
import { LoginRateLimits } from "@/components/admin/stats/login-rate-limits"
import { StackedDailyChart, inFillOrder, type StackFill } from "@/components/admin/stats/stacked-daily-chart"
import { StatGrid } from "@/components/admin/stats/stat-grid"
import { StatsPanel } from "@/components/admin/stats/stats-panel"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { emailStatusLabels, formatBytes, redisPrefixLabels } from "@/lib/admin-stats"
import { parseServerDateTime } from "@/lib/analytics"
import { useSystemStats } from "@/lib/hooks/useSiteStats"
import type { AnalyticsRange, EmailStatus, RedirectTiming, RedisKeyCounts, SystemStats } from "@/lib/types"
import { cn, formatDateTime } from "@/lib/utils"

const emailFills: Record<EmailStatus, StackFill> = {
  SENT: { step: 100 },
  FAILED: { step: 55 },
  RESENT: { step: 55, hatch: true },
  SENDING: { step: 25 },
}

const redirectSourceLabels: Record<RedirectTiming["source"], string> = {
  cache: "Cache",
  db: "Database",
}

const UP = "UP"

const UNKNOWN_VERSION = "unknown"

function formatMs(ms: number | null): string {
  return ms == null ? "—" : `${ms.toFixed(1)} ms`
}

function formatSlowest({ maxMs }: RedirectTiming): string {
  return maxMs === 0 ? "—" : formatMs(maxMs)
}

interface SystemTabProps {
  days: AnalyticsRange
}

export function SystemTab({ days }: SystemTabProps) {
  const query = useSystemStats(days)
  return (
    <div className="space-y-6">
      <StatsPanel query={query}>{(data) => <SystemBody data={data} days={days} />}</StatsPanel>
      <LoginRateLimits />
    </div>
  )
}

interface SystemBodyProps {
  data: SystemStats
  days: AnalyticsRange
}

function SystemBody({ data, days }: SystemBodyProps) {
  const { health, cache, redis, database } = data

  return (
    <>
      {!database.shortUrlUnique && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <span className="text-foreground">
            short_url uniqueness isn&apos;t enforced: the database has duplicate short links, so the unique index was skipped.
          </span>
        </div>
      )}
      <StatGrid
        title="App"
        items={[
          { label: "Version", value: data.appVersion === UNKNOWN_VERSION ? "Unknown" : `v${data.appVersion}` },
          { label: "Started", value: formatDateTime(parseServerDateTime(data.startedAt)) },
          { label: "Uptime", value: data.uptime },
          { label: "Java", value: data.javaVersion },
          { label: "Profiles", value: data.activeProfiles.length > 0 ? data.activeProfiles.join(", ") : "default" },
        ]}
      />
      <StatGrid
        title="Health"
        items={[
          { label: "Database", value: <HealthBadge status={health.database} /> },
          { label: "Redis", value: <HealthBadge status={health.redis} /> },
        ]}
      />
      <Redirects timings={data.redirects} />
      <StatGrid
        items={[
          { label: "Requests since the last restart", value: data.requests.total.toLocaleString() },
          { label: "Server errors (5xx)", value: data.requests.serverErrors.toLocaleString() },
          {
            label: "Link cache hit ratio",
            value: cache.hitRatio == null ? "No lookups yet" : `${cache.hitRatio.toFixed(1)}%`,
            hint: "Link lookups answered from Redis since the last restart.",
          },
          { label: "JVM heap", value: formatBytes(data.jvmHeapUsedBytes), hint: `of ${formatBytes(data.jvmHeapMaxBytes)}` },
        ]}
      />
      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Redis</h2>
        <StatGrid
          items={[
            { label: "Used memory", value: formatBytes(redis.usedMemoryBytes) },
            { label: "Max memory", value: redis.maxMemoryBytes === 0 ? "No limit" : formatBytes(redis.maxMemoryBytes) },
          ]}
        />
        <RedisKeys keys={redis.keys} />
      </section>
      <StatGrid
        title="Database"
        items={[
          { label: "Engine", value: `${database.product} ${database.version}` },
          { label: "Size", value: formatBytes(database.sizeBytes) },
        ]}
      />
      <StackedDailyChart
        title="Emails per day"
        series={inFillOrder(data.emails, emailFills)}
        labels={emailStatusLabels}
        fills={emailFills}
        days={days}
      />
    </>
  )
}

function HealthBadge({ status }: { status: string }) {
  const up = status === UP
  return (
    <Badge variant={up ? "success" : "destructive"} className="gap-1.5">
      <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", up ? "bg-success" : "bg-destructive")} />
      {status}
    </Badge>
  )
}

function Redirects({ timings }: { timings: RedirectTiming[] }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="border-b px-5 py-3.5">
        <h2 className="text-sm font-semibold">Redirects</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Counts and averages since the last restart. Slowest covers the last few minutes.</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead className="text-right">Redirects</TableHead>
            <TableHead className="text-right">Average</TableHead>
            <TableHead className="whitespace-nowrap text-right">Slowest recently</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timings.map((timing) => (
            <TableRow key={timing.source}>
              <TableCell>{redirectSourceLabels[timing.source] ?? timing.source}</TableCell>
              <TableCell className="text-right tabular-nums">{timing.count.toLocaleString()}</TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">{formatMs(timing.meanMs)}</TableCell>
              <TableCell className="whitespace-nowrap text-right tabular-nums">{formatSlowest(timing)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  )
}

function RedisKeys({ keys }: { keys: RedisKeyCounts | null }) {
  const count = (value: number) => `${keys?.capped ? "≥ " : ""}${value.toLocaleString()}`
  const rows = keys
    ? [
        ...Object.entries(keys.counts).map(([prefix, value]) => ({ label: redisPrefixLabels[prefix] ?? prefix, value })),
        { label: "Other", value: keys.other },
      ]
    : []

  return (
    <div className="min-w-0 rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="flex items-baseline justify-between gap-4 border-b px-5 py-3.5">
        <h3 className="text-sm font-semibold">Keys by use</h3>
        <span className="text-xs text-muted-foreground">Keys</span>
      </div>
      {keys == null ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">Redis didn&apos;t answer.</p>
      ) : (
        <dl className="divide-y">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 px-5 py-2.5 text-sm">
              <dt className="min-w-0 [overflow-wrap:anywhere]">{row.label}</dt>
              <dd className="shrink-0 tabular-nums text-muted-foreground">{count(row.value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
