"use client"

import { useQuery } from "@tanstack/react-query"
import { publicApi } from "@/lib/api-client"
import { retryUnlessRefused } from "@/lib/hooks/useAnalytics"

export function usePublicStats() {
  return useQuery({
    queryKey: ["public", "stats"],
    queryFn: () => publicApi.getStats(),
    staleTime: 10 * 60 * 1000,
    retry: retryUnlessRefused,
  })
}
