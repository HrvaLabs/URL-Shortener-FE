"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError, bioApi } from "@/lib/api-client"
import { handleFormatError } from "@/lib/bio"
import { retryUnlessRefused } from "@/lib/hooks/useAnalytics"
import type { BioHandleAvailability, BioPage, BioPageUpdate } from "@/lib/types"

export const BIO_PAGE_KEY = ["bio", "me"] as const

const HANDLE_KEY = ["bio", "handle"] as const

const AVAILABILITY_DELAY_MS = 400

export function useBioPage() {
  return useQuery({
    queryKey: BIO_PAGE_KEY,
    queryFn: async (): Promise<BioPage | null> => {
      try {
        return await bioApi.mine()
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null
        throw error
      }
    },
    retry: retryUnlessRefused,
  })
}

export function useRefreshBioPage() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: BIO_PAGE_KEY })
}

function useStoreBioPage() {
  const queryClient = useQueryClient()
  return (page: BioPage | null) => {
    queryClient.setQueryData(BIO_PAGE_KEY, page)
    void queryClient.invalidateQueries({ queryKey: HANDLE_KEY, refetchType: "none" })
    void queryClient.invalidateQueries({ queryKey: ["analytics", "bio"] })
  }
}

export function useCreateBioPage() {
  const store = useStoreBioPage()
  return useMutation({
    mutationFn: (handle: string) => bioApi.create(handle),
    onSuccess: (page) => store(page),
  })
}

export function useSaveBioPage() {
  const store = useStoreBioPage()
  return useMutation({
    mutationFn: (data: BioPageUpdate) => bioApi.update(data),
    onSuccess: (page) => store(page),
  })
}

export function useChangeBioHandle() {
  const store = useStoreBioPage()
  return useMutation({
    mutationFn: (handle: string) => bioApi.changeHandle(handle),
    onSuccess: (page) => store(page),
  })
}

export function useDeleteBioPage() {
  const store = useStoreBioPage()
  return useMutation({
    mutationFn: () => bioApi.remove(),
    onSuccess: () => store(null),
  })
}

export function useHandleAvailability(handle: string, enabled: boolean) {
  const [settledHandle, setSettledHandle] = useState(handle)

  useEffect(() => {
    const timer = setTimeout(() => setSettledHandle(handle), AVAILABILITY_DELAY_MS)
    return () => clearTimeout(timer)
  }, [handle])

  const settled = settledHandle === handle
  const query = useQuery({
    queryKey: [...HANDLE_KEY, settledHandle],
    queryFn: () => bioApi.availability(settledHandle),
    enabled: enabled && settled && handleFormatError(settledHandle) === null,
    retry: false,
  })
  return { query, settled }
}

export function useKnownHandleAvailability() {
  const queryClient = useQueryClient()
  return (handle: string) => queryClient.getQueryData<BioHandleAvailability>([...HANDLE_KEY, handle])
}
