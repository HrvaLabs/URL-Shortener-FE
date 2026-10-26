"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { bioApi } from "@/lib/api-client"
import { retryUnlessRefused } from "@/lib/hooks/useAnalytics"
import type { AnalyticsRange } from "@/lib/types"

export function useBioAnalytics(days: AnalyticsRange) {
  return useQuery({
    queryKey: ["analytics", "bio", days],
    queryFn: () => bioApi.analytics(days),
    placeholderData: keepPreviousData,
    retry: retryUnlessRefused,
  })
}
