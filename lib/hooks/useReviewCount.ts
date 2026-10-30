"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi, adminBioApi, adminDomainApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export function useReviewCount() {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: ["admin", "review", "count"],
    queryFn: async () => {
      const results = await Promise.allSettled([
        adminApi.getReviewQueue({ size: 1 }),
        adminBioApi.reviews(0, 1),
        adminDomainApi.list({ status: "PENDING_REVIEW", page: 0, size: 1 }),
      ])
      if (results.every((result) => result.status === "rejected")) throw (results[0] as PromiseRejectedResult).reason
      return results.reduce((total, result) => total + (result.status === "fulfilled" ? result.value.totalElements : 0), 0)
    },
    enabled: isAdmin,
    refetchInterval: 60_000,
  })
}
