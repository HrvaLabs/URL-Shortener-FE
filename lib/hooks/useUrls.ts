"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { urlApi } from "@/lib/api-client"
import type { CreateUrlDto, UrlUpdateDto, UrlResponse, Page, UrlFilters } from "@/lib/types"

export function useMyUrls(filters: UrlFilters = {}, page = 0, size = 20, sort = "createDate", order = "desc") {
  return useQuery({
    queryKey: ["urls", "my", filters, page, size, sort, order],
    queryFn: () => urlApi.getMyUrls(filters, page, size, sort, order),
  })
}

export function useAllUrls(filters: UrlFilters = {}, page = 0, size = 20, sort = "createDate", order = "desc") {
  return useQuery({
    queryKey: ["urls", "all", filters, page, size, sort, order],
    queryFn: () => urlApi.getAllUrls(filters, page, size, sort, order),
  })
}

export function useCreateUrl(apiKey?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUrlDto) => urlApi.create(data, apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
    },
  })
}

export function useCreateUrlWithApiKey(apiKey: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUrlDto) => urlApi.create(data, apiKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
    },
  })
}

export function useUpdateUrl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UrlUpdateDto }) => urlApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
    },
  })
}

export function useDeactivateUrl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => urlApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
    },
  })
}

export function useActivateUrl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => urlApi.activate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
    },
  })
}

export function useDeleteUrl() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => urlApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["urls"] })
    },
  })
}
