"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PageMeta } from "@/components/page-meta"
import { Database, Zap, Mail } from "lucide-react"
import { parseServerDateTime } from "@/lib/analytics"
import { cn, formatDateTime } from "@/lib/utils"

type ServiceState = "ok" | "down" | "unknown"

const badgeVariant: Record<ServiceState, "success" | "destructive" | "secondary"> = {
  ok: "success",
  down: "destructive",
  unknown: "secondary",
}

const dotClass: Record<ServiceState, string> = {
  ok: "bg-success",
  down: "bg-destructive",
  unknown: "bg-muted-foreground",
}

function summary(database: boolean, redis: boolean): { text: string; ok: boolean } {
  if (database && redis) return { text: "All core services are operational.", ok: true }
  if (database) return { text: "Redis isn't connected. The database is.", ok: false }
  if (redis) return { text: "The database isn't connected. Redis is.", ok: false }
  return { text: "Neither the database nor Redis is connected.", ok: false }
}

export default function AdminHealthPage() {
  const { data: stats, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 30_000,
  })
  const { data: latestEmails, isPending: emailsPending, isError: emailsFailed } = useQuery({
    queryKey: ["admin", "email-log", 0, 1],
    queryFn: () => adminApi.getEmailLog(0, 1),
    refetchInterval: 30_000,
  })
  const lastEmail = latestEmails?.content?.[0]

  const services: { name: string; icon: typeof Database; description: string; state: ServiceState; label: string; extra?: string }[] = [
    {
      name: "Database",
      icon: Database,
      description: "PostgreSQL connection",
      state: stats?.databaseActive ? "ok" : "down",
      label: stats?.databaseActive ? "Connected" : "Disconnected",
    },
    {
      name: "Cache (Redis)",
      icon: Zap,
      description: "In-memory data store",
      state: stats?.cacheActive ? "ok" : "down",
      label: stats?.cacheActive ? "Connected" : "Disconnected",
      extra: stats?.cacheActive ? `Hit ratio: ${stats.cacheHitRatio}` : undefined,
    },
    {
      name: "SMTP",
      icon: Mail,
      description: "Email delivery service",
      state: emailsPending || emailsFailed ? "unknown" : lastEmail?.status === "FAILED" ? "down" : "ok",
      label: emailsPending
        ? "Checking"
        : emailsFailed
          ? "Couldn't check"
          : !lastEmail
            ? "No emails yet"
            : lastEmail.status === "FAILED"
              ? "Last email failed"
              : "Last email delivered",
      extra: lastEmail ? `Last email: ${formatDateTime(parseServerDateTime(lastEmail.createdAt))}` : undefined,
    },
  ]

  const status = stats ? summary(stats.databaseActive, stats.cacheActive) : null

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Health" description="Live status of the database, Redis and email delivery." />
      <div>
        <h1 className="font-display text-2xl">Health</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live status of the database, Redis and email delivery. Refreshes every 30 seconds.</p>
      </div>

      {isLoading ? (
        <ul className="divide-y rounded-xl border bg-card">
          {[...Array(3)].map((_, i) => (
            <li key={i} className="flex items-center gap-4 px-5 py-4">
              <Skeleton className="h-4 w-4" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3.5 w-48" />
              </div>
              <Skeleton className="h-6 w-24" />
            </li>
          ))}
        </ul>
      ) : isError && !stats ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm text-destructive">Couldn&apos;t load the health status, so it&apos;s unknown right now. Try again.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()} disabled={isFetching}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {isError && (
            <p role="status" className="text-sm text-warning">
              The last refresh failed, so this may be out of date.{" "}
              <button type="button" onClick={() => refetch()} disabled={isFetching} className="font-medium underline underline-offset-2">
                Retry
              </button>
            </p>
          )}
          <ul className="divide-y rounded-xl border bg-card">
            {services.map((svc) => {
              const Icon = svc.icon
              return (
                <li key={svc.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-medium">{svc.name}</h2>
                    <p className="text-sm text-muted-foreground">{svc.description}</p>
                    {svc.extra && <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{svc.extra}</p>}
                  </div>
                  <Badge variant={badgeVariant[svc.state]} className="shrink-0 gap-1.5">
                    <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", dotClass[svc.state])} />
                    {svc.label}
                  </Badge>
                </li>
              )
            })}
          </ul>
        </>
      )}

      {stats && status && (
        <p className="text-sm text-muted-foreground">
          <span className={cn("font-medium", status.ok ? "text-success" : "text-destructive")}>{status.text}</span>
          {" "}&middot; Java {stats.javaVersion}
        </p>
      )}
    </div>
  )
}
