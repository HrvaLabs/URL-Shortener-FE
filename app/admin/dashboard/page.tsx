"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageMeta } from "@/components/page-meta"
import { formatDate, formatDateTime, truncateUrl } from "@/lib/utils"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function PageTitle() {
  return (
    <div>
      <h1 className="font-display text-2xl">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">System overview and statistics</p>
    </div>
  )
}

function StatTile({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-semibold tabular-nums">{value}</dd>
      {hint && <dd className="mt-1 text-xs text-muted-foreground">{hint}</dd>}
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 30_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageMeta title="Admin Dashboard" description="System overview and statistics." />
        <PageTitle />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-2 h-7 w-16" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="space-y-6">
        <PageMeta title="Admin Dashboard" />
        <PageTitle />
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load stats</p>
        </div>
      </div>
    )
  }

  const systemItems = [
    { label: "App Version", value: `v${stats.appVersion}` },
    { label: "Uptime", value: stats.uptime },
    { label: "Requests", value: stats.requestsCount.toLocaleString() },
    { label: "Java", value: stats.javaVersion },
    { label: "Server Time", value: new Date(stats.serverTime).toLocaleString() },
  ]

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Dashboard" description="System overview and statistics." />
      <PageTitle />

      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile
          label="Total users"
          value={stats.totalUsers.toLocaleString()}
          hint={`+${stats.newUsers7d.toLocaleString()} this week · +${stats.newUsers30d.toLocaleString()} this month`}
        />
        <StatTile label="Total URLs" value={stats.totalUrls.toLocaleString()} />
        <StatTile label="Active URLs" value={stats.activeUrls.toLocaleString()} />
        <StatTile label="API keys" value={stats.totalApiKeys.toLocaleString()} />
      </dl>

      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Cache hit ratio" value={stats.cacheHitRatio} />
        <StatTile label="JVM heap" value={stats.jvmMemoryUsed} hint={`of ${stats.jvmMemoryMax}`} />
        <StatTile
          label="Redirect avg"
          value={
            <>
              {stats.redirectAvgMs ?? "—"}
              <span className="text-sm font-normal text-muted-foreground"> ms</span>
            </>
          }
          hint={`max ${stats.redirectMaxMs ?? "—"}ms · ${stats.redirectCount?.toLocaleString() ?? 0} redirects`}
        />
        <StatTile
          label="Active profiles"
          value={stats.activeProfiles.length}
          hint={stats.activeProfiles.join(", ") || "default"}
        />
      </dl>

      <section className="rounded-xl border bg-card">
        <h2 className="border-b px-5 py-3.5 text-sm font-semibold">System</h2>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 p-5 md:grid-cols-4 lg:grid-cols-7">
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Database</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              <span
                aria-hidden="true"
                className={cn("h-2 w-2 shrink-0 rounded-full", stats.databaseActive ? "bg-success" : "bg-destructive")}
              />
              <span className={stats.databaseActive ? "text-success" : "text-destructive"}>
                {stats.databaseActive ? "Connected" : "Disconnected"}
              </span>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-muted-foreground">Cache (Redis)</dt>
            <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium">
              <span
                aria-hidden="true"
                className={cn("h-2 w-2 shrink-0 rounded-full", stats.cacheActive ? "bg-success" : "bg-muted-foreground/50")}
              />
              <span className={stats.cacheActive ? "text-success" : "text-muted-foreground"}>
                {stats.cacheActive ? "Active" : "Inactive"}
              </span>
            </dd>
          </div>
          {systemItems.map((item) => (
            <div key={item.label} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{item.label}</dt>
              <dd className="mt-1 truncate text-sm font-medium tabular-nums" title={item.value}>{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <LoginRateLimits />

      <section className="overflow-hidden rounded-xl border bg-card">
        <h2 className="border-b px-5 py-3.5 text-sm font-semibold">Recent URLs</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Short URL</TableHead>
              <TableHead>Long URL</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Visits</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stats.recentUrls.map((url) => (
              <TableRow key={url.id}>
                <TableCell>
                  <span className="font-mono text-[13px] font-medium text-brand">/{url.shortUrl}</span>
                </TableCell>
                <TableCell className="max-w-[200px] text-muted-foreground">
                  <span className="block truncate" title={url.longUrl}>{truncateUrl(url.longUrl, 40)}</span>
                </TableCell>
                <TableCell>{url.ownerEmail || "—"}</TableCell>
                <TableCell className="tabular-nums">{url.visits.toLocaleString()}</TableCell>
                <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground" title={formatDateTime(url.createDate)}>
                  {formatDate(url.createDate)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </div>
  )
}

function LoginRateLimits() {
  const { data: attempts, isLoading, refetch } = useQuery<Record<string, number>>({
    queryKey: ["admin", "login-attempts"],
    queryFn: () => adminApi.getLoginAttempts(),
    refetchInterval: 10_000,
  })

  const handleClear = async () => {
    try {
      await adminApi.clearLoginAttempts()
      toast.success("Rate limits cleared")
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Failed to clear")
    }
  }

  const entries = attempts ? Object.entries(attempts) : []

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex min-h-[3.25rem] items-center justify-between gap-4 border-b px-5 py-2.5">
        <h2 className="text-sm font-semibold">Login Rate Limits</h2>
        {!isLoading && entries.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear} className="h-8">
            Clear all
          </Button>
        )}
      </div>
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-20 w-full" />
        </div>
      ) : entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">No active rate limits</p>
      ) : (
        <ul className="divide-y">
          {entries.map(([ip, count]) => (
            <li key={ip} className="flex items-center justify-between gap-4 px-5 py-2.5">
              <span className="font-mono text-[13px]">{ip}</span>
              <Badge
                variant={count >= 10 ? "destructive" : count >= 5 ? "warning" : "outline"}
                className="tabular-nums"
              >
                {count} attempt{count !== 1 ? "s" : ""}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
