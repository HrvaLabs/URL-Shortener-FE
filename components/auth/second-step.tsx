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

  useEffect(() => () => {
    if (ceremonyInFlight.current) abortPasskeyRequest()
  }, [])

  const showPasskey = methods.includes("WEBAUTHN") && supported
  const hasTotp = methods.includes("TOTP")
  const showCode = hasTotp || methods.includes("RECOVERY_CODE")

  const fail = (error: unknown, message: string | null) => {
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

  return (
    <>
      <div className="text-center">
        <h1 className="font-display text-2xl">Two-step verification</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Confirm it&apos;s you to finish signing in.</p>
      </div>
      <div className="mt-8 space-y-6">
        {showPasskey && (
          <Button
            type="button"
            className="h-auto min-h-10 w-full gap-2 whitespace-normal"
            onClick={handlePasskey}
            disabled={busy !== null}
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
                id="code"
                inputMode="text"
                autoComplete="one-time-code"
                placeholder={hasTotp ? "123456 or recovery code" : "ABCD-EFGH"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-2 font-mono placeholder:font-sans"
                autoFocus={!showPasskey}
                required
              />
            </div>
            <Button
              type="submit"
              variant={showPasskey ? "outline" : "default"}
              className="w-full"
              disabled={busy !== null}
            >
              {busy === "code" ? "Signing in…" : "Verify & sign in"}
            </Button>
          </form>
        )}
        {!showPasskey && !showCode && (
          <p className="text-center text-sm text-muted-foreground">
            This browser can&apos;t use passkeys or security keys. Sign in from a browser that can.
          </p>
        )}
      </div>
    </>
  )
}
