"use client"

import type { ReactNode } from "react"
import type { UseQueryResult } from "@tanstack/react-query"
import { AnalyticsError, AnalyticsSkeleton } from "@/components/analytics/analytics-states"
import { cn } from "@/lib/utils"

interface StatsPanelProps<T> {
  query: UseQueryResult<T, Error>
  children: (data: T) => ReactNode
}

export function StatsPanel<T>({ query, children }: StatsPanelProps<T>) {
  if (query.isPending) return <AnalyticsSkeleton variant="panel" />
  if (query.isError) {
    return (
      <AnalyticsError
        error={query.error}
        retrying={query.isRefetching}
        onRetry={() => query.refetch()}
        message="Couldn't load these stats. Try again."
      />
    )
  }
  const refreshing = query.isPlaceholderData
  return (
    <div className={cn("space-y-6 transition-opacity", refreshing && "opacity-60")} aria-busy={refreshing}>
      {children(query.data)}
    </div>
  )
}
