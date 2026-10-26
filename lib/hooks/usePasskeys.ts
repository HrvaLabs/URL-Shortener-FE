"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { passkeyApi } from "@/lib/api-client"

export function usePasskeys() {
  return useQuery({
    queryKey: ["passkeys"],
    queryFn: passkeyApi.list,
  })
}

function useInvalidatePasskeys() {
  const queryClient = useQueryClient()
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["passkeys"] }),
    queryClient.invalidateQueries({ queryKey: ["twoStep"] }),
  ])
}

export function useRenamePasskey() {
  const invalidate = useInvalidatePasskeys()
  return useMutation({
    mutationFn: ({ id, label }: { id: number; label: string }) => passkeyApi.rename(id, label),
    onSuccess: invalidate,
  })
}

export function useRemovePasskey() {
  const invalidate = useInvalidatePasskeys()
  return useMutation({
    mutationFn: ({ id, password }: { id: number; password?: string }) => passkeyApi.remove(id, password),
    onSuccess: invalidate,
  })
}
