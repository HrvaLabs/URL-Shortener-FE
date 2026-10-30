"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { signInMethodApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { useMe } from "@/lib/hooks/useUsers"
import type { SignInMethod, SignInMethodsResponse, UserDto } from "@/lib/types"
import { isLocalAccount } from "@/lib/utils"

export function useNeedsPassword(): boolean {
  const { user } = useAuth()
  const { data: me } = useMe()
  return isLocalAccount(user) && (me?.passwordSet ?? user?.passwordSet) !== false
}

function useStoreMethods(passwordSet?: boolean) {
  const queryClient = useQueryClient()
  return (response: SignInMethodsResponse) => {
    queryClient.setQueryData<UserDto>(["me"], (me) => {
      if (!me) return me
      return { ...me, signInMethods: response.signInMethods, ...(passwordSet === undefined ? {} : { passwordSet }) }
    })
    if (!queryClient.getQueryData(["me"])) void queryClient.invalidateQueries({ queryKey: ["me"] })
  }
}

export function useTurnOffSignInMethod() {
  const store = useStoreMethods()
  return useMutation({
    mutationFn: (method: SignInMethod) => signInMethodApi.turnOff(method),
    onSuccess: store,
  })
}

export function useTurnOnSignInMethod() {
  const store = useStoreMethods()
  return useMutation({
    mutationFn: (method: SignInMethod) => signInMethodApi.turnOn(method),
    onSuccess: store,
  })
}

export function useRemovePassword() {
  const store = useStoreMethods(false)
  return useMutation({
    mutationFn: (currentPassword: string) => signInMethodApi.removePassword(currentPassword),
    onSuccess: store,
  })
}
