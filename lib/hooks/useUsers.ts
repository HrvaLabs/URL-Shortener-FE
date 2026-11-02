"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi, userApi } from "@/lib/api-client"
import type { DestinationChangeOverride, UserUpdateDto, UserFilters } from "@/lib/types"

export function useAllUsers(filters: UserFilters = {}, page = 0, size = 20, sort = "id", order = "asc") {
  return useQuery({
    queryKey: ["users", "all", filters, page, size, sort, order],
    queryFn: () => userApi.getAll(filters, page, size, sort, order),
  })
}

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: userApi.getMe,
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdateDto }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      queryClient.invalidateQueries({ queryKey: ["me"] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => userApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })
}

/** An account's destination change override and live standing, for the admin users page. */
export function useDestinationStanding(userId: number | null) {
  return useQuery({
    queryKey: ["users", "destination-changes", userId],
    queryFn: () => adminApi.getDestinationStanding(userId as number),
    enabled: userId !== null,
    staleTime: 0,
  })
}

export function useSetDestinationOverride() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, override }: { userId: number; override: DestinationChangeOverride }) => adminApi.setDestinationOverride(userId, override),
    onSuccess: (standing, { userId }) => {
      queryClient.setQueryData(["users", "destination-changes", userId], standing)
      return Promise.all([
        queryClient.invalidateQueries({ queryKey: ["users", "all"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "audit-log"] }),
      ])
    },
  })
}
