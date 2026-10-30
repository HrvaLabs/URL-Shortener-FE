"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userApi } from "@/lib/api-client"
import type { UserUpdateDto, UserFilters } from "@/lib/types"

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
