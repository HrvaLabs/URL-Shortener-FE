"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { analyticsApi, retryUnlessRefused } from "@/lib/api-client"
import type { AnalyticsRange } from "@/lib/types"

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
