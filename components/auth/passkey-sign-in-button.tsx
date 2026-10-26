"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ApiError, authApi } from "@/lib/api-client"
import { useWebAuthnSupported } from "@/lib/hooks/useWebAuthnSupported"
import type { SignedIn } from "@/lib/types"
import { abortPasskeyRequest, getPasskey, passkeyErrorMessage } from "@/lib/webauthn"

export function PasskeySignInButton({
  rememberMe,
  onSignedIn,
  onBusyChange,
}: {
  rememberMe: boolean
  onSignedIn: (s: SignedIn) => void
  onBusyChange: (busy: boolean) => void
}) {
  const supported = useWebAuthnSupported()
  const [busy, setBusy] = useState(false)
  const ceremonyInFlight = useRef(false)
  const mounted = useRef(true)
  const rememberMeRef = useRef(rememberMe)
  const router = useRouter()

  useEffect(() => {
    rememberMeRef.current = rememberMe
  }, [rememberMe])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (ceremonyInFlight.current) abortPasskeyRequest()
    }
  }, [])

  if (!supported) return null

  const handleClick = async () => {
    setBusy(true)
    onBusyChange(true)
    try {
      const { ceremonyId, options } = await authApi.passkeyOptions()
      if (!mounted.current) return
      ceremonyInFlight.current = true
      let credential
      try {
        credential = await getPasskey(options)
      } finally {
        ceremonyInFlight.current = false
      }
      onSignedIn(await authApi.passkeySignIn(ceremonyId, credential, rememberMeRef.current))
    } catch (error) {
      if (!mounted.current) return
      const message = passkeyErrorMessage(error, "sign-in")
      if (error instanceof ApiError && error.status === 403 && error.message.toLowerCase().includes("verify")) {
        toast.error(error.message, {
          action: { label: "Resend", onClick: () => router.push("/verify-email/resend") },
        })
      } else if (message) {
        toast.error(message)
      }
    } finally {
      setBusy(false)
      onBusyChange(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="h-auto min-h-10 w-full gap-2 whitespace-normal"
      onClick={handleClick}
      disabled={busy}
      aria-busy={busy}
    >
      <KeyRound className="h-4 w-4 shrink-0" />
      Sign in with a passkey
    </Button>
  )
}
