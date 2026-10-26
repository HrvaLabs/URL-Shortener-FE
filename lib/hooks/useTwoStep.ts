"use client"

import { useCallback } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { twoStepApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"

export function useTwoStepStatus() {
  return useQuery({
    queryKey: ["twoStep"],
    queryFn: twoStepApi.status,
  })
}

export function useRefreshTwoStep() {
  const queryClient = useQueryClient()
  const { refreshUser } = useAuth()
  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["twoStep"] }),
      queryClient.invalidateQueries({ queryKey: ["passkeys"] }),
    ])
    await refreshUser()
  }, [queryClient, refreshUser])
}
