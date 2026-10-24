"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { analyticsApi, ApiError } from "@/lib/api-client"
import type { AnalyticsRange } from "@/lib/types"

const retryUnlessRefused = (failureCount: number, error: Error) =>
  !(error instanceof ApiError && error.status >= 400 && error.status < 500) && failureCount < 1

export function useAnalyticsOverview(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["analytics", "overview", days],
    queryFn: () => analyticsApi.getOverview(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
  })
}

export function useUrlAnalytics(id: number, days: AnalyticsRange) {
  return useQuery({
    queryKey: ["analytics", "url", id, days],
    queryFn: () => analyticsApi.getUrlAnalytics(id, days),
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[2] === id ? previous : undefined),
    retry: retryUnlessRefused,
  })
}
