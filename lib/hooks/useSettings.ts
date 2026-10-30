"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { publicApi, settingsApi } from "@/lib/api-client"
import { retryUnlessRefused } from "@/lib/hooks/useAnalytics"
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

export function usePublicSettings() {
  return useQuery({
    queryKey: PUBLIC_SETTINGS_KEY,
    queryFn: publicApi.getSettings,
    staleTime: 60_000,
    retry: retryUnlessRefused,
  })
}
