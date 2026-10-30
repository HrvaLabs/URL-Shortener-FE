"use client"

import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiKeyApi } from "@/lib/api-client"
import type { ApiKeyFilters, ApiKeyUpdateDto } from "@/lib/types"

export function useMyApiKeys(active?: boolean) {
  return useQuery({
    queryKey: ["apiKeys", "my", active ?? "all"],
    queryFn: () => apiKeyApi.getMyKeys(active),
  })
}

export function useMyInactiveApiKeys(page = 0, size = 10, enabled = true) {
  return useQuery({
    queryKey: ["apiKeys", "my", "inactive", page, size],
    queryFn: () => apiKeyApi.getMyInactiveKeys(page, size),
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useAllApiKeys(filters: ApiKeyFilters = {}, page = 0, size = 20, sort = "createDate", order = "desc") {
  return useQuery({
    queryKey: ["apiKeys", "all", filters, page, size, sort, order],
    queryFn: () => apiKeyApi.getAllKeys(filters, page, size, sort, order),
    placeholderData: keepPreviousData,
  })
}

export function useGenerateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiKeyApi.generate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
    },
  })
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ApiKeyUpdateDto }) => apiKeyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
    },
  })
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiKeyApi.revoke(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apiKeys"] }),
  })
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiKeyApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apiKeys"] }),
  })
}

export function useDeleteInactiveApiKeys() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiKeyApi.deleteInactive(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apiKeys"] }),
  })
}

export function useActivateApiKey() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => apiKeyApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
    },
  })
}
