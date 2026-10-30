"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api-client"
import type { ReservedAliasInput } from "@/lib/types"

const reservedAliasesKey = ["admin", "reserved-aliases"]

export function useReservedAliases(search: string, page: number, size: number, sort: string, order: "asc" | "desc") {
  return useQuery({
    queryKey: [...reservedAliasesKey, search, page, size, sort, order],
    queryFn: () => adminApi.getReservedAliases(search || undefined, page, size, sort || undefined, order),
    placeholderData: keepPreviousData,
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
