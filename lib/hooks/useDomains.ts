"use client"

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { adminDomainApi, domainApi } from "@/lib/api-client"
import type { AdminDomainFilters, CustomDomainStatus, DomainLinkMode } from "@/lib/types"

const DOMAINS_KEY = ["domains"]

const MY_DOMAINS_KEY = ["domains", "mine"]

const ADMIN_DOMAINS_KEY = ["admin", "domains"]

const REVIEW_COUNT_KEY = ["admin", "review", "count"]

const POLL_INTERVAL = 10_000

const POLLED_STATUSES: ReadonlySet<CustomDomainStatus> = new Set(["APPROVED_PROVISIONING", "AWAITING_DNS"])

export function useMyDomains() {
  return useQuery({
    queryKey: MY_DOMAINS_KEY,
    queryFn: domainApi.mine,
  })
}

export function useDomain(id: number, { poll, enabled = true }: { poll: boolean; enabled?: boolean }) {
  return useQuery({
    queryKey: [...DOMAINS_KEY, id],
    queryFn: () => domainApi.get(id),
    enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return poll && status && POLLED_STATUSES.has(status) ? POLL_INTERVAL : false
    },
  })
}

function useRefreshMyDomains() {
  const queryClient = useQueryClient()
  return () => Promise.all([DOMAINS_KEY, ["urls"]].map((queryKey) => queryClient.invalidateQueries({ queryKey })))
}

export function useApplyDomain() {
  const refresh = useRefreshMyDomains()
  return useMutation({
    mutationFn: ({ hostname, reason }: { hostname: string; reason: string }) => domainApi.apply(hostname, reason),
    onSuccess: refresh,
  })
}

export function useRemoveDomain() {
  const refresh = useRefreshMyDomains()
  return useMutation({
    mutationFn: ({ id, links }: { id: number; links: DomainLinkMode }) => domainApi.remove(id, links),
    onSettled: refresh,
  })
}

export function useRetryMyDomain() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => domainApi.retry(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: DOMAINS_KEY }),
  })
}

export function useAdminDomains(filters: AdminDomainFilters) {
  return useQuery({
    queryKey: [...ADMIN_DOMAINS_KEY, filters],
    queryFn: () => adminDomainApi.list(filters),
    placeholderData: keepPreviousData,
  })
}

export function useDomainSummary() {
  return useQuery({
    queryKey: [...ADMIN_DOMAINS_KEY, "summary"],
    queryFn: adminDomainApi.summary,
  })
}

export function useDomainAllowance(userId: number | null) {
  return useQuery({
    queryKey: [...ADMIN_DOMAINS_KEY, "allowance", userId],
    queryFn: () => adminDomainApi.allowance(userId as number),
    enabled: userId != null,
  })
}

function useRefreshAdminDomains() {
  const queryClient = useQueryClient()
  return () => Promise.all([ADMIN_DOMAINS_KEY, REVIEW_COUNT_KEY].map((queryKey) => queryClient.invalidateQueries({ queryKey })))
}

export function useApproveDomain() {
  const refresh = useRefreshAdminDomains()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string | null }) => adminDomainApi.approve(id, note),
    onSettled: refresh,
  })
}

export function useRejectDomain() {
  const refresh = useRefreshAdminDomains()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string | null }) => adminDomainApi.reject(id, note),
    onSettled: refresh,
  })
}

export function useDisableDomain() {
  const refresh = useRefreshAdminDomains()
  return useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) => adminDomainApi.disable(id, note),
    onSettled: refresh,
  })
}

export function useEnableDomain() {
  const refresh = useRefreshAdminDomains()
  return useMutation({
    mutationFn: (id: number) => adminDomainApi.enable(id),
    onSettled: refresh,
  })
}

export function useRetryDomain() {
  const refresh = useRefreshAdminDomains()
  return useMutation({
    mutationFn: (id: number) => adminDomainApi.retry(id),
    onSettled: refresh,
  })
}

export function useAdminRemoveDomain() {
  const refresh = useRefreshAdminDomains()
  return useMutation({
    mutationFn: ({ id, links }: { id: number; links: DomainLinkMode }) => adminDomainApi.remove(id, links),
    onSettled: refresh,
  })
}

export function useCheckCloudflare() {
  const refresh = useRefreshAdminDomains()
  return useMutation({
    mutationFn: () => adminDomainApi.checkCloudflare(),
    onSettled: refresh,
  })
}

export function useReconcileDomains() {
  const refresh = useRefreshAdminDomains()
  return useMutation({
    mutationFn: () => adminDomainApi.reconcile(),
    onSettled: refresh,
  })
}

export function useSetDomainAllowance() {
  const refresh = useRefreshAdminDomains()
  return useMutation({
    mutationFn: ({ userId, maxDomains, reason }: { userId: number; maxDomains: number; reason: string }) =>
      adminDomainApi.setAllowance(userId, maxDomains, reason),
    onSettled: refresh,
  })
}

export function useRemoveDomainAllowance() {
  const refresh = useRefreshAdminDomains()
  return useMutation({
    mutationFn: (userId: number) => adminDomainApi.removeAllowance(userId),
    onSettled: refresh,
  })
}
