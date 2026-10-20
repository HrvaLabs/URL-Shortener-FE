"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { connectedAppsApi } from "@/lib/api-client"

export function useConnectedApps() {
  return useQuery({
    queryKey: ["connectedApps"],
    queryFn: connectedAppsApi.list,
  })
}

export function useDisconnectApp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (clientId: string) => connectedAppsApi.disconnect(clientId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["connectedApps"] }),
  })
}
