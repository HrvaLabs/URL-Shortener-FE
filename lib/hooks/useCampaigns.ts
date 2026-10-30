"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { campaignApi } from "@/lib/api-client"

export const campaignsKey = ["admin", "campaigns"]

export function useCampaigns(page: number, size: number, sort: string, order: "asc" | "desc", search: string) {
  return useQuery({
    queryKey: [...campaignsKey, "list", page, size, sort, order, search],
    queryFn: () => campaignApi.list(page, size, sort, order, search || undefined),
    placeholderData: keepPreviousData,
  })
}

export function useCampaignDetail(id: number, enabled: boolean) {
  return useQuery({
    queryKey: [...campaignsKey, "detail", id],
    queryFn: () => campaignApi.detail(id),
    enabled,
  })
}

export function useCampaignLinks(id: number, page: number, size: number, sort: string, order: "asc" | "desc", search: string) {
  return useQuery({
    queryKey: [...campaignsKey, "links", id, page, size, sort, order, search],
    queryFn: () => campaignApi.links(id, page, size, sort, order, search || undefined),
    placeholderData: keepPreviousData,
  })
}

export function useAllowCampaign() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => campaignApi.allow(id),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: campaignsKey }),
        queryClient.invalidateQueries({ queryKey: ["urls"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "review"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "domain-block-preview"] }),
      ]),
  })
}
