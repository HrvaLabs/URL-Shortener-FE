"use client"

import { useEffect, useRef, useState } from "react"
import { KeyRound } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, REQUEST_FAILED, authApi } from "@/lib/api-client"
import { useWebAuthnSupported } from "@/lib/hooks/useWebAuthnSupported"
import type { SignedIn, TwoStepMethod } from "@/lib/types"
import { abortPasskeyRequest, getPasskey, passkeyErrorMessage } from "@/lib/webauthn"

export function SecondStep({
  pendingToken,
  methods,
  onSignedIn,
  onExpired,
}: {
  pendingToken: string
  methods: TwoStepMethod[]
  onSignedIn: (signedIn: SignedIn) => void
  onExpired: () => void
}) {
  const supported = useWebAuthnSupported()
  const [code, setCode] = useState("")
  const [busy, setBusy] = useState<"passkey" | "code" | null>(null)
  const ceremonyInFlight = useRef(false)
  const mounted = useRef(true)
  const expiredReported = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  const hasPasskey = methods.includes("WEBAUTHN")
  const showPasskey = hasPasskey && supported
  const hasTotp = methods.includes("TOTP")
  const showCode = hasTotp || methods.includes("RECOVERY_CODE")
  const hasMethod = hasPasskey || showCode

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
    onExpired()
  }, [hasMethod, onExpired])

  const fail = (error: unknown, message: string | null) => {
    if (!mounted.current) return
    if (error instanceof ApiError && error.status === 410) {
      onExpired()
      return
    }
    if (message) toast.error(message)
    setBusy(null)
  }

  const handlePasskey = async () => {
    setBusy("passkey")
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
      onSignedIn(await authApi.secondStepPasskey(pendingToken, ceremonyId, credential))
    } catch (error) {
      fail(error, passkeyErrorMessage(error, "verify"))
    }
  }

  const handleCode = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy("code")
    try {
      onSignedIn(await authApi.secondStepTotp(pendingToken, code))
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
          <Button
            type="button"
            className="h-auto min-h-10 w-full gap-2 whitespace-normal"
            onClick={handlePasskey}
            disabled={busy !== null}
            aria-busy={busy === "passkey"}
          >
            <KeyRound className="h-4 w-4 shrink-0" />
            Use a passkey or security key
          </Button>
        )}
        {showPasskey && showCode && <div className="border-t" />}
        {showCode && (
          <form onSubmit={handleCode} className="space-y-4">
            <div>
              <Label htmlFor="code">{hasTotp ? "Authenticator code" : "Recovery code"}</Label>
              <Input
                ref={codeRef}
                id="code"
                inputMode="text"
                autoComplete="one-time-code"
                placeholder={hasTotp ? "123456 or recovery code" : "ABCD-EFGH"}
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
        {!showPasskey && !showCode && (
          <div className="space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              This browser can&apos;t use passkeys or security keys. Sign in from a browser that can.
            </p>
            <Button type="button" variant="outline" className="w-full" onClick={onExpired}>
              Back to sign in
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
