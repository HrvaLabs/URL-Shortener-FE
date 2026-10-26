"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { authApi } from "@/lib/api-client"
import { useWebAuthnSupported } from "@/lib/hooks/useWebAuthnSupported"
import { toastPasskeySignInError } from "@/lib/passkey-toasts"
import type { SignedIn } from "@/lib/types"
import { abortPasskeyRequest, getPasskey } from "@/lib/webauthn"

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
  const [busy, setBusy] = useState<"waiting" | "signing-in" | null>(null)
  const ceremonyInFlight = useRef(false)
  const mounted = useRef(true)
  const focusAfterFailure = useRef(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
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

  useEffect(() => {
    if (busy !== null || !focusAfterFailure.current) return
    focusAfterFailure.current = false
    buttonRef.current?.focus()
  }, [busy])

  if (!supported) return null

  const handleClick = async () => {
    setBusy("waiting")
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
      if (!mounted.current) return
      setBusy("signing-in")
      const signedIn = await authApi.passkeySignIn(ceremonyId, credential, rememberMeRef.current)
      if (!mounted.current) return
      onSignedIn(signedIn)
    } catch (error) {
      if (!mounted.current) return
      toastPasskeySignInError(error, router)
      focusAfterFailure.current = true
      setBusy(null)
      onBusyChange(false)
    }
  }

  return (
    <Button
      ref={buttonRef}
      type="button"
      variant="outline"
      className="h-auto min-h-10 w-full gap-2 whitespace-normal"
      onClick={handleClick}
      disabled={busy !== null}
      aria-busy={busy !== null}
    >
      <KeyRound className="h-4 w-4 shrink-0" />
      {busy === "waiting" ? "Waiting for your passkey…" : busy === "signing-in" ? "Signing in…" : "Sign in with a passkey"}
    </Button>
  )
}
