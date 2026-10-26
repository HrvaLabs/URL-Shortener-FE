"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi, adminBioApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export function useReviewCount() {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: ["admin", "review", "count"],
    queryFn: async () => {
      const [links, bioPages] = await Promise.all([adminApi.getReviewQueue({ size: 1 }), adminBioApi.reviews(0, 1)])
      return links.totalElements + bioPages.totalElements
    },
    enabled: isAdmin,
    refetchInterval: 60_000,
  })
}
