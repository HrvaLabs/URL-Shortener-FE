"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api-client"
import { retryUnlessRefused } from "@/lib/hooks/useAnalytics"
import type { AnalyticsRange } from "@/lib/types"

export function useTrafficStats(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["admin", "stats", "traffic", days],
    queryFn: () => adminApi.getTrafficStats(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
  })
}

export function useLinksStats(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["admin", "stats", "links", days],
    queryFn: () => adminApi.getLinksStats(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
  })
}

export function useUsersStats(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["admin", "stats", "users", days],
    queryFn: () => adminApi.getUsersStats(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
  })
}
