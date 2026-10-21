"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PageMeta } from "@/components/page-meta"
import { Database, Zap, Mail } from "lucide-react"
import { cn, formatDateTime } from "@/lib/utils"

export default function AdminHealthPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminApi.getStats(),
    refetchInterval: 30_000,
  })
  const { data: latestEmails } = useQuery({
    queryKey: ["admin", "email-log", 0, 1],
    queryFn: () => adminApi.getEmailLog(0, 1),
    refetchInterval: 30_000,
  })
  const lastEmail = latestEmails?.content?.[0]

  const services = [
    {
      name: "Database",
      icon: Database,
      description: "PostgreSQL connection",
      ok: stats?.databaseActive ?? false,
      okLabel: "Connected",
      failLabel: "Disconnected",
    },
    {
      name: "Cache (Redis)",
      icon: Zap,
      description: "In-memory data store",
      ok: stats?.cacheActive ?? false,
      okLabel: "Connected",
      failLabel: "Disconnected",
      extra: stats?.cacheActive ? `Hit ratio: ${stats.cacheHitRatio}` : undefined,
    },
    {
      name: "SMTP",
      icon: Mail,
      description: "Email delivery service",
      ok: lastEmail?.status !== "FAILED",
      okLabel: lastEmail ? "Last email delivered" : "No emails yet",
      failLabel: "Last email failed",
      extra: lastEmail ? `Last email: ${formatDateTime(lastEmail.createdAt)}` : undefined,
    },
  ]

  const operational = !!stats && stats.databaseActive && stats.cacheActive

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Health" description="Real-time status of all system services." />
      <div>
        <h1 className="font-display text-2xl">System Health</h1>
        <p className="mt-1 text-sm text-muted-foreground">Real-time status of all system services</p>
      </div>

      {isLoading ? (
        <ul className="divide-y rounded-xl border bg-card">
          {[...Array(4)].map((_, i) => (
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
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {services.map((svc) => {
            const Icon = svc.icon
            return (
              <li key={svc.name} className="flex items-center gap-4 px-5 py-4">
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm font-medium">{svc.name}</h2>
                  <p className="text-sm text-muted-foreground">{svc.description}</p>
                  {svc.extra && <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{svc.extra}</p>}
                </div>
                <Badge variant={svc.ok ? "success" : "destructive"} className="shrink-0 gap-1.5">
                  <span
                    aria-hidden="true"
                    className={cn("h-2 w-2 rounded-full", svc.ok ? "bg-success" : "bg-destructive")}
                  />
                  {svc.ok ? svc.okLabel : svc.failLabel}
                </Badge>
              </li>
            )
          })}
        </ul>
      )}

      {stats && (
        <p className="text-sm text-muted-foreground">
          All core services are{" "}
          <span className={cn("font-medium", operational ? "text-success" : "text-destructive")}>
            {operational ? "operational" : "experiencing issues"}
          </span>
          . &middot; <span className="tabular-nums">{stats.recentUrls.length}</span> recent URLs &middot; Java {stats.javaVersion}
        </p>
      )}
    </div>
  )
}
