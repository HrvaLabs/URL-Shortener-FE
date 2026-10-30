"use client"

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query"
import { ApiError, publicApi, settingsApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { retryUnlessRefused } from "@/lib/hooks/useAnalytics"
import { anonymousLinksPaused, refusedSwitch } from "@/lib/moderation"
import type { SettingKey, SettingValue } from "@/lib/types"

const ADMIN_SETTINGS_KEY = ["admin", "settings"]

const PUBLIC_SETTINGS_KEY = ["public", "settings"]

const AUDIT_LOG_KEY = ["admin", "audit-log"]

export function useAdminSettings() {
  return useQuery({
    queryKey: ADMIN_SETTINGS_KEY,
    queryFn: settingsApi.list,
  })
}

function useRefreshSettings() {
  const queryClient = useQueryClient()
  return () => Promise.all([ADMIN_SETTINGS_KEY, PUBLIC_SETTINGS_KEY, AUDIT_LOG_KEY].map((queryKey) => queryClient.invalidateQueries({ queryKey })))
}

export function useChangeSetting() {
  const refresh = useRefreshSettings()
  return useMutation({
    mutationFn: ({ key, value }: { key: SettingKey; value: SettingValue }) => settingsApi.change(key, value),
    onSettled: refresh,
  })
}

export function useResetSetting() {
  const refresh = useRefreshSettings()
  return useMutation({
    mutationFn: (key: SettingKey) => settingsApi.reset(key),
    onSettled: refresh,
  })
}

export function refreshPublicSettingsAfterRefusal(queryClient: QueryClient, error: unknown) {
  if (!(error instanceof ApiError) || refusedSwitch(error.message) === null) return
  void queryClient
    .fetchQuery({ queryKey: PUBLIC_SETTINGS_KEY, queryFn: () => publicApi.getSettings("no-store"), staleTime: 0 })
    .catch(() => {})
}

export function usePublicSettings() {
  return useQuery({
    queryKey: PUBLIC_SETTINGS_KEY,
    queryFn: () => publicApi.getSettings(),
    staleTime: 60_000,
    retry: retryUnlessRefused,
  })
}

export function useAnonymousLinksPaused(): boolean {
  const { user, isLoading } = useAuth()
  const { data } = usePublicSettings()
  return anonymousLinksPaused(data, Boolean(user), isLoading)
}
