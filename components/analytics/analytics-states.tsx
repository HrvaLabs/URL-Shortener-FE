"use client"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ApiError } from "@/lib/api-client"
import { rangeLabels } from "@/lib/analytics"
import type { AnalyticsRange } from "@/lib/types"
import { cn } from "@/lib/utils"

interface AnalyticsEmptyProps {
  days: AnalyticsRange
  historyStart: string
}

export function AnalyticsEmpty({ days, historyStart }: AnalyticsEmptyProps) {
  return (
    <div className="rounded-xl border bg-card px-6 py-12 text-center">
      <p className="mx-auto max-w-md text-sm text-muted-foreground">
        No clicks in the last {rangeLabels[days]}. Daily history starts on {historyStart}, so earlier clicks only count toward all-time visits.
      </p>
    </div>
  )
}

interface AnalyticsErrorProps {
  error: Error
  retrying: boolean
  onRetry: () => void
  refusals?: Record<number, string>
  message?: string
}

export function AnalyticsError({
  error,
  retrying,
  onRetry,
  refusals,
  message = "Couldn't load analytics. Try again.",
}: AnalyticsErrorProps) {
  const refusal = refusals && error instanceof ApiError ? refusals[error.status] : undefined
  return (
    <div className="rounded-xl border bg-card px-6 py-12 text-center">
      <p className={cn("text-sm", refusal ? "text-muted-foreground" : "text-destructive")}>
        {refusal ?? message}
      </p>
      {!refusal && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying} className="mt-4">
          Retry
        </Button>
      )}
    </div>
  )
}

interface AnalyticsSkeletonProps {
  variant: "link" | "overview"
}

export function AnalyticsSkeleton({ variant }: AnalyticsSkeletonProps) {
  return (
    <div className="space-y-6" aria-busy="true">
      {variant === "link" ? (
        <div className="space-y-2">
          <Skeleton className="h-7 w-56 max-w-full" />
          <Skeleton className="h-5 w-40 max-w-full" />
        </div>
      ) : (
        <div className="space-y-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-96 max-w-full" />
        </div>
      )}
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-72 w-full rounded-xl" />
    </div>
  )
}
