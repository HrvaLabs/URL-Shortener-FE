"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminBioApi } from "@/lib/api-client"
import { BIO_PAGE_KEY } from "@/lib/hooks/useBioPage"
import type { BioPageReviewAction } from "@/lib/types"

export interface AdminBioPageFilters {
  search?: string
  hiddenOnly?: boolean
}

export function useAdminBioPages(filters: AdminBioPageFilters, page: number, size: number) {
  return useQuery({
    queryKey: ["admin", "bio-pages", filters, page, size],
    queryFn: () => adminBioApi.list(filters, page, size),
    placeholderData: keepPreviousData,
  })
}

export function useBioPageReviews(page: number, size: number) {
  return useQuery({
    queryKey: ["admin", "review", "bio", page, size],
    queryFn: () => adminBioApi.reviews(page, size),
    placeholderData: keepPreviousData,
  })
}

function useRefreshBioAdmin(extraKeys: readonly (readonly string[])[] = []) {
  const queryClient = useQueryClient()
  return () =>
    Promise.all(
      [["admin", "bio-pages"], ["admin", "review"], BIO_PAGE_KEY, ["admin", "stats"], ...extraKeys].map((queryKey) =>
        queryClient.invalidateQueries({ queryKey }),
      ),
    )
}

export function useHideBioPage() {
  const refresh = useRefreshBioAdmin()
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => adminBioApi.hide(id, reason),
    onSettled: refresh,
  })
}

export function useUnhideBioPage() {
  const refresh = useRefreshBioAdmin()
  return useMutation({
    mutationFn: (id: number) => adminBioApi.unhide(id),
    onSettled: refresh,
  })
}

export function useChangeBioPageHandle() {
  const refresh = useRefreshBioAdmin()
  return useMutation({
    mutationFn: ({ id, handle }: { id: number; handle: string }) => adminBioApi.changeHandle(id, handle),
    onSettled: refresh,
  })
}

export function useRevokeBioPageHandle() {
  const refresh = useRefreshBioAdmin([["admin", "reserved-aliases"]])
  return useMutation({
    mutationFn: ({ id, reason, expectedHandle }: { id: number; reason: string; expectedHandle: string | null }) =>
      adminBioApi.revokeHandle(id, reason, expectedHandle),
    onSettled: refresh,
  })
}

export function useResolveBioPageReview() {
  const refresh = useRefreshBioAdmin()
  return useMutation({
    mutationFn: ({ pageId, action, reason }: { pageId: number; action: BioPageReviewAction; reason?: string }) =>
      adminBioApi.resolveReview(pageId, action, reason),
    onSettled: refresh,
  })
}
