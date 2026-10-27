"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiKeyApi, apiKeyCleanupApi } from "@/lib/api-client"
import type { ApiKeyUpdateDto } from "@/lib/types"

export function useMyApiKeys() {
  return useQuery({
    queryKey: ["apiKeys", "my"],
    queryFn: apiKeyApi.getMyKeys,
  })
}

export function useAllApiKeys(page = 0, size = 20) {
  return useQuery({
    queryKey: ["apiKeys", "all", page, size],
    queryFn: () => apiKeyApi.getAllKeys(page, size),
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
    mutationFn: (id: number) => apiKeyCleanupApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["apiKeys"] }),
  })
}

export function useDeleteInactiveApiKeys() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => apiKeyCleanupApi.deleteInactive(),
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
