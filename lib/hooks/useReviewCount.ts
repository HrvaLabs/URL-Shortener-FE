"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi, adminBioApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export function useReviewCount() {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: ["admin", "review", "count"],
    queryFn: async () => {
      const [links, bioPages] = await Promise.allSettled([adminApi.getReviewQueue({ size: 1 }), adminBioApi.reviews(0, 1)])
      if (links.status === "rejected" && bioPages.status === "rejected") throw links.reason
      const linkCount = links.status === "fulfilled" ? links.value.totalElements : 0
      const bioPageCount = bioPages.status === "fulfilled" ? bioPages.value.totalElements : 0
      return linkCount + bioPageCount
    },
    enabled: isAdmin,
    refetchInterval: 60_000,
  })
}
