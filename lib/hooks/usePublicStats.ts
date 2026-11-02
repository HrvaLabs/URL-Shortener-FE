"use client"

import { useQuery } from "@tanstack/react-query"
import { publicApi, retryUnlessRefused } from "@/lib/api-client"

export function usePublicStats() {
  return useQuery({
    queryKey: ["public", "stats"],
    queryFn: () => publicApi.getStats(),
    staleTime: 10 * 60 * 1000,
    retry: retryUnlessRefused,
  })
}
