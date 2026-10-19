"use client"

import type { UrlResponse } from "@/lib/types"
import { Progress } from "@/components/ui/progress"
import { formatDate } from "@/lib/utils"
import { ExternalLink } from "lucide-react"

interface UrlAnalyticsProps {
  url: UrlResponse
}

export function UrlAnalytics({ url }: UrlAnalyticsProps) {
  const created = new Date(url.createDate)
  const daysSinceCreation = Math.max(1, Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)))
  const dailyAvg = daysSinceCreation > 0 ? (url.visits / daysSinceCreation).toFixed(1) : "0"
  const visitPercent = url.visitLimit > 0 ? Math.min(100, (url.visits / url.visitLimit) * 100) : 0

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Total Visits</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{url.visits}</dd>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Visit Limit</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums">{url.visitLimit > 0 ? `${url.visitLimit}` : "∞"}</dd>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Created</dt>
          <dd className="mt-1 text-sm font-medium tabular-nums">{formatDate(url.createDate)}</dd>
        </div>
        <div className="min-w-0 rounded-xl border bg-card p-5">
          <dt className="text-sm text-muted-foreground">Destination</dt>
          <dd className="mt-1 flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium" title={url.longUrl}>
              {url.longUrl}
            </span>
            <a
              href={url.longUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open destination"
              className="ml-auto shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </dd>
        </div>
      </dl>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Visit limit usage</span>
          <span className="tabular-nums">
            {url.visits} / {url.visitLimit > 0 ? url.visitLimit : "∞"}
            {url.visitLimit > 0 ? ` (${Math.round(visitPercent)}%)` : ""}
          </span>
        </div>
        <Progress value={url.visitLimit > 0 ? visitPercent : 0} className="h-1.5" />
      </div>

      {url.visits > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium tabular-nums text-foreground">{dailyAvg}</span>
          <span>visits/day over {daysSinceCreation} day{daysSinceCreation > 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  )
}
