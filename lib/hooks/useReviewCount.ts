"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi, adminBioApi, adminDomainApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { reviewBadgeCounts } from "@/lib/moderation"

export function useReviewCount() {
  const { isAdmin, adminNeedsTwoStep } = useAuth()
  return useQuery({
    queryKey: ["admin", "review", "count"],
    queryFn: async () => {
      const results = await Promise.allSettled([
        adminApi.getReviewQueue({ size: 1 }),
        adminBioApi.reviews(undefined, 0, 1),
        adminDomainApi.list({ status: "PENDING_REVIEW", page: 0, size: 1 }),
        adminDomainApi.requests({ status: "WAITING", page: 0, size: 1 }),
      ])
      return reviewBadgeCounts(results)
    },
    enabled: isAdmin && !adminNeedsTwoStep,
    refetchInterval: 60_000,
  })
}
