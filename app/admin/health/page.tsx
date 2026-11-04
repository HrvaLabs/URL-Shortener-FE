"use client"

import { useQuery } from "@tanstack/react-query"
import { Camera, CircleCheck, Database, Mail, ScanSearch, ShieldAlert, TriangleAlert, Zap, type LucideIcon } from "lucide-react"
import { ApiError, adminApi, retryUnlessRefused } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageMeta } from "@/components/page-meta"
import { StatGrid } from "@/components/admin/stats/stat-grid"
import { LegacyHealth } from "@/components/admin/health/legacy-health"
import {
  ALL_SYSTEMS_WORKING,
  NEEDS_V230_BACKEND,
  garbageCollectionText,
  jobErrorText,
  jobLastRunLines,
  jobOutcome,
  memoryText,
  responseTimeText,
  serverErrorsHint,
  serviceRows,
  sortedJobs,
  startupText,
  trafficTitle,
  unavailableReason,
  uptimeText,
  type ServiceKey,
  type ServiceState,
} from "@/lib/system-status"
import type { SystemStatus, SystemStatusJob } from "@/lib/types"
import { cn, formatDateTime, plural } from "@/lib/utils"

const REFRESH_MS = 30_000

const PAGE_DESCRIPTION = "Live status of hrva.cc: traffic, services, the server and background jobs."

const badgeVariant: Record<ServiceState, "success" | "warning" | "destructive" | "secondary"> = {
  ok: "success",
  warning: "warning",
  down: "destructive",
  off: "secondary",
}

const dotClass: Record<ServiceState, string> = {
  ok: "bg-success",
  warning: "bg-warning",
  down: "bg-destructive",
  off: "bg-muted-foreground",
}

const serviceIcons: Record<ServiceKey, LucideIcon> = {
  database: Database,
  redis: Zap,
  email: Mail,
  screenshots: Camera,
  virusTotal: ScanSearch,
  blocklists: ShieldAlert,
}

const isMissingEndpoint = (error: unknown) => error instanceof ApiError && error.status === 404

const retryUnlessUnavailable = (failureCount: number, error: Error) =>
  !(error instanceof ApiError && error.status === 503) && retryUnlessRefused(failureCount, error)

export default function AdminHealthPage() {
  const { data, error, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "system-status"],
    queryFn: () => adminApi.getSystemStatus(),
    refetchInterval: (query) => (isMissingEndpoint(query.state.error) && !query.state.data ? false : REFRESH_MS),
    retry: retryUnlessUnavailable,
  })

  return (
    <div className="space-y-8">
      <PageMeta title="Admin — Health" description={PAGE_DESCRIPTION} />
      <div>
        <h1 className="font-display text-2xl">Health</h1>
        <p className="mt-1 text-sm text-muted-foreground">{PAGE_DESCRIPTION} Refreshes every 30 seconds.</p>
      </div>

      {isPending ? (
        <HealthSkeleton />
      ) : !data && isMissingEndpoint(error) ? (
        <div className="space-y-6">
          <p role="status" className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm font-medium">
            {NEEDS_V230_BACKEND}
          </p>
          <LegacyHealth />
        </div>
      ) : !data ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm text-destructive">
            {unavailableReason(error) ?? "Couldn't load the system status, so it's unknown right now. Try again."}
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()} disabled={isFetching}>
            Retry
          </Button>
        </div>
      ) : (
        <>
          {isError && (
            <p role="status" className="text-sm text-warning">
              {unavailableReason(error) ? `${unavailableReason(error)} What you see may be out of date.` : "The last refresh failed, so this may be out of date."}{" "}
              <button type="button" onClick={() => refetch()} disabled={isFetching} className="font-medium underline underline-offset-2">
                Retry
              </button>
            </p>
          )}
          <StatusLine problems={data.summary.problems} />
          <Traffic traffic={data.traffic} />
          <Services status={data} />
          <Server server={data.server} />
          <Jobs jobs={data.jobs} />
        </>
      )}
    </div>
  )
}

function StatePill({ state, label }: { state: ServiceState; label: string }) {
  return (
    <Badge variant={badgeVariant[state]} className="shrink-0 gap-1.5 whitespace-nowrap">
      <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", dotClass[state])} />
      {label}
    </Badge>
  )
}

function StatusLine({ problems }: { problems: string[] }) {
  if (problems.length === 0) {
    return (
      <div role="status" className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 p-4 text-sm font-medium">
        <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-success" />
        {ALL_SYSTEMS_WORKING}
      </div>
    )
  }
  return (
    <div role="status" className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0 text-warning" />
        {plural(problems.length, "problem")}
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-10">
        {problems.map((problem, index) => (
          <li key={index} className="[overflow-wrap:anywhere]">
            {problem}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Traffic({ traffic }: { traffic: SystemStatus["traffic"] }) {
  return (
    <StatGrid
      title={trafficTitle(traffic.windowMinutes)}
      items={[
        { label: "Requests", value: traffic.requests.toLocaleString("en-US") },
        { label: "Redirects", value: traffic.redirects.toLocaleString("en-US") },
        { label: "Response time", value: <span className="text-lg">{responseTimeText(traffic.p50Ms, traffic.p95Ms)}</span> },
        { label: "Server errors (5xx)", value: traffic.serverErrors.toLocaleString("en-US"), hint: serverErrorsHint(traffic.serverErrors, traffic.requests) },
      ]}
    />
  )
}

function Services({ status }: { status: SystemStatus }) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold">Services</h2>
      <ul className="divide-y rounded-xl border bg-card">
        {serviceRows(status).map((service) => {
          const Icon = serviceIcons[service.key]
          return (
            <li key={service.key} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
              <Icon aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-48 flex-1">
                <h3 className="text-sm font-medium">{service.name}</h3>
                <p className="text-sm text-muted-foreground">{service.description}</p>
                {service.details.map((detail) => (
                  <p key={detail} className="mt-0.5 text-xs tabular-nums text-muted-foreground [overflow-wrap:anywhere]">
                    {detail}
                  </p>
                ))}
              </div>
              <StatePill state={service.state} label={service.label} />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function Server({ server }: { server: SystemStatus["server"] }) {
  return (
    <StatGrid
      title="Server"
      items={[
        { label: "Version", value: server.version ?? "Unknown" },
        { label: "Uptime", value: uptimeText(server.uptimeSeconds) },
        { label: "Last start", value: <span className="text-lg">{formatDateTime(server.startedAt)}</span>, hint: startupText(server.startupSeconds) },
        { label: "Java memory", value: <span className="text-lg">{memoryText(server.heapUsedBytes, server.heapMaxBytes)}</span>, hint: "Heap in use" },
        { label: "Garbage collection", value: <span className="text-lg">{garbageCollectionText(server.gcPauseMsTotal)}</span>, hint: "Since the server started" },
      ]}
    />
  )
}

function Jobs({ jobs }: { jobs: SystemStatusJob[] }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">Background jobs</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">Since the server started. Failed jobs come first.</p>
      </div>
      {jobs.length === 0 ? (
        <p className="rounded-xl border bg-card px-5 py-8 text-center text-sm text-muted-foreground">No background jobs reported.</p>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job</TableHead>
                <TableHead className="hidden @2xl:table-cell">Last run</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead className="hidden @4xl:table-cell">Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedJobs(jobs).map((job) => (
                <JobRow key={job.name} job={job} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}

function JobRow({ job }: { job: SystemStatusJob }) {
  const outcome = jobOutcome(job)
  const lastRun = jobLastRunLines(job)
  const failed = outcome.state === "down"
  const error = jobErrorText(job)
  return (
    <TableRow className="align-top">
      <TableCell className="align-top">
        <div className="min-w-36">
          <p className="font-medium [overflow-wrap:anywhere]">{job.label}</p>
          <div className="mt-1 space-y-0.5 text-xs tabular-nums text-muted-foreground @2xl:hidden">
            {lastRun.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {failed && (
            <p className="mt-1.5 whitespace-pre-wrap text-xs text-destructive [overflow-wrap:anywhere] @4xl:hidden">
              <span className="font-medium">Error: </span>
              {error}
            </p>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden align-top @2xl:table-cell">
        <div className="min-w-44 space-y-0.5 text-xs tabular-nums text-muted-foreground">
          {lastRun.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </TableCell>
      <TableCell className="align-top">
        <StatePill state={outcome.state} label={outcome.label} />
      </TableCell>
      <TableCell className="hidden align-top @4xl:table-cell">
        <p className={cn("min-w-56 whitespace-pre-wrap text-xs [overflow-wrap:anywhere]", failed ? "text-destructive" : "text-muted-foreground")}>{error}</p>
      </TableCell>
    </TableRow>
  )
}

function HealthSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-14 w-full rounded-xl" />
      <div className="grid gap-4 @md:grid-cols-2 @4xl:grid-cols-4">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} className="h-24 rounded-xl" />
        ))}
      </div>
      <ul className="divide-y rounded-xl border bg-card">
        {[...Array(6)].map((_, index) => (
          <li key={index} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="h-4 w-4" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <Skeleton className="h-6 w-24" />
          </li>
        ))}
      </ul>
    </div>
  )
}
