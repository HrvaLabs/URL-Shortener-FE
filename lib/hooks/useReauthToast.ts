"use client"

import { toast } from "sonner"
import { ApiError } from "@/lib/api-client"
import { REAUTH_TOAST_ID, useAuth } from "@/lib/auth-context"
import { useNeedsPassword } from "@/lib/hooks/useSignInMethods"

export function useReauthToast() {
  const { logout } = useAuth()
  const needsPassword = useNeedsPassword()

  return (error: unknown, message: string): boolean => {
    if (!needsPassword && error instanceof ApiError && error.status === 401) {
      toast.error(message, {
        id: REAUTH_TOAST_ID,
        duration: Infinity,
        closeButton: true,
        action: { label: "Sign in again", onClick: () => logout() },
      })
      return true
    }
    toast.error(message)
    return false
  }
}
