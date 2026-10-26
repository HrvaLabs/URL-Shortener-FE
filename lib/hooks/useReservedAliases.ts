"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api-client"
import type { ReservedAliasInput } from "@/lib/types"

const reservedAliasesKey = ["admin", "reserved-aliases"]

export function useReservedAliases() {
  return useQuery({
    queryKey: reservedAliasesKey,
    queryFn: () => adminApi.getReservedAliases(),
  })
}

export function useReserveAlias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReservedAliasInput) => adminApi.reserveAlias(input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: reservedAliasesKey }),
  })
}

export function useUnreserveAlias() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => adminApi.unreserveAlias(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: reservedAliasesKey }),
  })
}
