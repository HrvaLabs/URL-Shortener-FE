"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export function useReviewCount() {
  const { isAdmin } = useAuth()
  return useQuery({
    queryKey: ["admin", "review", "count"],
    queryFn: () => adminApi.getReviewQueue({ size: 1 }),
    select: (page) => page.totalElements,
    enabled: isAdmin,
    refetchInterval: 60_000,
  })
}
