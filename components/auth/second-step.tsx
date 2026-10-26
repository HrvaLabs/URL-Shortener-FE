"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, REQUEST_FAILED, authApi } from "@/lib/api-client"
import { useWebAuthnSupported } from "@/lib/hooks/useWebAuthnSupported"
import type { SignedIn, TwoStepMethod } from "@/lib/types"
import { abortPasskeyRequest, getPasskey, passkeyErrorMessage } from "@/lib/webauthn"

export const SIGN_IN_EXPIRED = "Your sign-in expired. Sign in again."

const CEREMONY_EXPIRED = "This request expired. Try again."

type Busy = "passkey-waiting" | "passkey-verifying" | "code"

export function SecondStep({
  pendingToken,
  methods,
  onSignedIn,
  onExpired,
  onBackToSignIn,
  onUseDifferentAccount,
}: {
  pendingToken: string
  methods: TwoStepMethod[]
  onSignedIn: (signedIn: SignedIn) => void
  onExpired: (message: string) => void
  onBackToSignIn?: () => void
  onUseDifferentAccount?: () => void
}) {
  const supported = useWebAuthnSupported()
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState<Busy | null>(null)
  const [passkeyError, setPasskeyError] = useState<string | null>(null)
  const ceremonyInFlight = useRef(false)
  const mounted = useRef(true)
  const expiredReported = useRef(false)
  const focusAfterFailure = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)
  const passkeyButtonRef = useRef<HTMLButtonElement>(null)

  const hasPasskey = methods.includes("WEBAUTHN")
  const showPasskey = hasPasskey && supported
  const hasTotp = methods.includes("TOTP")
  const showCode = hasTotp || methods.includes("RECOVERY_CODE")
  const hasMethod = hasPasskey || showCode
  const passkeyBusy = busy === "passkey-waiting" || busy === "passkey-verifying"

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (ceremonyInFlight.current) abortPasskeyRequest()
    }
  }, [])

  useEffect(() => {
    if (showCode && !showPasskey) codeRef.current?.focus()
    else headingRef.current?.focus()
  }, [showCode, showPasskey])

  useEffect(() => {
    if (hasMethod || expiredReported.current) return
    expiredReported.current = true
    onExpired(SIGN_IN_EXPIRED)
  }, [hasMethod, onExpired])

  useEffect(() => {
    if (busy !== null || !focusAfterFailure.current) return
    focusAfterFailure.current = false
    const codeField = codeRef.current
    if (codeField) {
      codeField.focus()
      codeField.select()
    } else {
      passkeyButtonRef.current?.focus()
    }
  }, [busy])

  const fail = (error: unknown, message: string | null) => {
    if (!mounted.current) return
    if (error instanceof ApiError && error.status === 410) {
      onExpired(error.message && error.message !== REQUEST_FAILED ? error.message : SIGN_IN_EXPIRED)
      return
    }
    if (message) toast.error(message)
    focusAfterFailure.current = true
    setBusy(null)
  }

  const isCeremonyExpired = (error: unknown) =>
    error instanceof ApiError && error.status === 410 && error.message === CEREMONY_EXPIRED

  const handlePasskey = async () => {
    setPasskeyError(null)
    setBusy("passkey-waiting")
    let verifying = false
    try {
      const { ceremonyId, options } = await authApi.secondStepPasskeyOptions(pendingToken)
      if (!mounted.current) return
      ceremonyInFlight.current = true
      let credential
      try {
        credential = await getPasskey(options)
      } finally {
        ceremonyInFlight.current = false
      }
      if (!mounted.current) return
      setBusy("passkey-verifying")
      verifying = true
      const signedIn = await authApi.secondStepPasskey(pendingToken, ceremonyId, credential)
      if (!mounted.current) return
      onSignedIn(signedIn)
    } catch (error) {
      if (mounted.current && verifying && isCeremonyExpired(error)) {
        setPasskeyError(CEREMONY_EXPIRED)
        focusAfterFailure.current = true
        setBusy(null)
        return
      }
      fail(error, passkeyErrorMessage(error, showCode ? "second-step" : "second-step-no-code"))
    }
  }

  const handleCode = async (event: React.FormEvent) => {
    event.preventDefault()
    const trimmedCode = code.trim()
    if (!trimmedCode) {
      codeRef.current?.focus()
      codeRef.current?.select()
      return
    }
    setPasskeyError(null)
    setBusy("code")
    try {
      const signedIn = await authApi.secondStepTotp(pendingToken, trimmedCode)
      if (!mounted.current) return
      onSignedIn(signedIn)
    } catch (error) {
      fail(error, (error instanceof Error && error.message) || REQUEST_FAILED)
    }
  }

  if (!hasMethod) return null

  return (
    <>
      <div className="text-center">
        <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl focus-visible:ring-0 focus-visible:ring-offset-0">
          Two-step verification
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Confirm it&apos;s you to finish signing in.</p>
      </div>
      <div className="mt-8 space-y-6">
        {showPasskey && (
          <div className="space-y-2">
            <Button
              ref={passkeyButtonRef}
              type="button"
              className="h-auto min-h-10 w-full gap-2 whitespace-normal"
              onClick={handlePasskey}
              disabled={busy !== null}
              aria-busy={passkeyBusy}
              aria-describedby={passkeyError ? "passkeyError" : undefined}
            >
              <KeyRound className="h-4 w-4 shrink-0" />
              {busy === "passkey-waiting"
                ? "Waiting for your passkey…"
                : busy === "passkey-verifying"
                  ? "Signing in…"
                  : "Use a passkey or security key"}
            </Button>
            <p id="passkeyError" role="alert" className="text-center text-sm text-destructive empty:hidden">
              {passkeyError}
            </p>
          </div>
        )}
        {showPasskey && showCode && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or enter a code</span>
            </div>
          </div>
        )}
        {showCode && (
          <form onSubmit={handleCode} className="space-y-4">
            <div>
              <Label htmlFor="code">{hasTotp ? "Authenticator code" : "Recovery code"}</Label>
              <Input
                ref={codeRef}
                id="code"
                inputMode="text"
                autoComplete="one-time-code"
                placeholder={hasTotp ? "123456 or recovery code" : "Recovery code, like ABCD-EFGH"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-2 font-mono placeholder:font-sans"
                required
              />
            </div>
            <Button
              type="submit"
              variant={showPasskey ? "outline" : "default"}
              className="w-full"
              disabled={busy !== null}
              aria-busy={busy === "code"}
            >
              {busy === "code" ? "Signing in…" : "Verify & sign in"}
            </Button>
          </form>
        )}
        {!showCode && (!showPasskey || onBackToSignIn) && (
          <div className="space-y-4">
            {!showPasskey && (
              <p className="text-center text-sm text-muted-foreground">
                This browser can&apos;t use passkeys or security keys. Sign in from a browser that can.
              </p>
            )}
            {onBackToSignIn && (
              <Button type="button" variant="outline" className="w-full" onClick={onBackToSignIn}>
                Back to sign in
              </Button>
            )}
          </div>
        )}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-center text-sm">
          {onUseDifferentAccount ? (
            <button type="button" className="text-brand-link" onClick={onUseDifferentAccount}>
              Use a different account
            </button>
          ) : showCode && onBackToSignIn ? (
            <button type="button" className="text-brand-link" onClick={onBackToSignIn}>
              Back to sign in
            </button>
          ) : null}
          <Link href="/help/passkeys#lost-device" target="_blank" className="text-brand-link">
            Lost your passkey or codes?<span className="sr-only"> (opens in a new tab)</span>
          </Link>
        </div>
      </div>
    </>
  )
}
