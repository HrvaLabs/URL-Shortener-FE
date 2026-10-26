"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { QRCodeSVG } from "qrcode.react"
import { KeyRound, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { RECOVERY_CODES_PANEL_ID, RecoveryCodes } from "@/components/recovery-codes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { REQUEST_FAILED, authApi, twoStepApi } from "@/lib/api-client"
import { useRefreshTwoStep, useTwoStepStatus } from "@/lib/hooks/useTwoStep"
import { useWebAuthnSupported } from "@/lib/hooks/useWebAuthnSupported"
import type { TwoStepStatus } from "@/lib/types"
import { abortPasskeyRequest, getPasskey, isWebAuthnSupported, passkeyErrorMessage } from "@/lib/webauthn"

export const OPEN_TURN_OFF_EVENT = "two-step:open-turn-off"
export const TWO_STEP_TITLE_ID = "two-step-title"

const LOW_RECOVERY_CODES = 2

type Busy =
  | "setup"
  | "enable-totp"
  | "remove-totp"
  | "enable"
  | "disable-passkey-waiting"
  | "disable-passkey-verifying"
  | "disable-code"

type FocusTarget = React.RefObject<HTMLElement | null>

function errorText(error: unknown): string {
  return error instanceof Error && error.message ? error.message : REQUEST_FAILED
}

function passkeyCount(count: number): string {
  if (count === 0) return "No passkeys or security keys"
  return count === 1 ? "1 passkey or security key" : `${count} passkeys or security keys`
}

function secondStepSummary(status: TwoStepStatus): string {
  const active: string[] = []
  const missing: string[] = []
  if (status.passkeys > 0) active.push(passkeyCount(status.passkeys))
  else missing.push(passkeyCount(0))
  if (status.totp) active.push("Authenticator app")
  else missing.push("Authenticator app not set up")
  return [...active, ...missing].join(" · ")
}

export function TwoStepCard() {
  const { data: status, isLoading, isFetching, error, refetch } = useTwoStepStatus()
  const refreshTwoStep = useRefreshTwoStep()
  const supported = useWebAuthnSupported()
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [setupData, setSetupData] = useState<{ secret: string; otpauthUri: string } | null>(null)
  const [setupCode, setSetupCode] = useState("")
  const [removingTotp, setRemovingTotp] = useState(false)
  const [removeCode, setRemoveCode] = useState("")
  const [turningOff, setTurningOff] = useState(false)
  const [disableCode, setDisableCode] = useState("")
  const [busy, setBusy] = useState<Busy | null>(null)
  const mounted = useRef(true)
  const ceremonyInFlight = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const setupButtonRef = useRef<HTMLButtonElement>(null)
  const enableCodeRef = useRef<HTMLInputElement>(null)
  const removeTotpButtonRef = useRef<HTMLButtonElement>(null)
  const removeTotpCodeRef = useRef<HTMLInputElement>(null)
  const turnOnButtonRef = useRef<HTMLButtonElement>(null)
  const turnOffButtonRef = useRef<HTMLButtonElement>(null)
  const disableCodeRef = useRef<HTMLInputElement>(null)
  const focusAfterClose = useRef<FocusTarget | null>(null)
  const focusAfterFailure = useRef<FocusTarget | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (ceremonyInFlight.current) abortPasskeyRequest()
    }
  }, [])

  useEffect(() => {
    const openTurnOff = () => {
      if (recoveryCodes) {
        document.getElementById(RECOVERY_CODES_PANEL_ID)?.focus()
        return
      }
      setTurningOff(true)
    }
    window.addEventListener(OPEN_TURN_OFF_EVENT, openTurnOff)
    return () => window.removeEventListener(OPEN_TURN_OFF_EVENT, openTurnOff)
  }, [recoveryCodes])

  useEffect(() => {
    const opener = focusAfterClose.current
    if (!opener) return
    focusAfterClose.current = null
    const target = opener.current?.isConnected ? opener.current : headingRef.current
    target?.focus()
  })

  useEffect(() => {
    if (busy !== null || !focusAfterFailure.current) return
    const target = focusAfterFailure.current.current
    focusAfterFailure.current = null
    if (!target?.isConnected) return
    target.focus()
    if (target instanceof HTMLInputElement) target.select()
  }, [busy])

  const run = async (
    kind: Busy,
    action: () => Promise<void>,
    focusOnFailure: FocusTarget,
    fallback: (error: unknown) => string | null = errorText,
  ) => {
    setBusy(kind)
    try {
      await action()
      await refreshTwoStep()
    } catch (error) {
      if (!mounted.current) return
      const message = fallback(error)
      if (message) toast.error(message)
      focusAfterFailure.current = focusOnFailure
    } finally {
      if (mounted.current) setBusy(null)
    }
  }

  const startSetup = async () => {
    setBusy("setup")
    try {
      const data = await authApi.setupTwoFactor()
      if (mounted.current) setSetupData(data)
    } catch (error) {
      if (!mounted.current) return
      toast.error(errorText(error))
      focusAfterFailure.current = setupButtonRef
    } finally {
      if (mounted.current) setBusy(null)
    }
  }

  const confirmSetup = (event: React.FormEvent) => {
    event.preventDefault()
    return run("enable-totp", async () => {
      const { recoveryCodes: codes } = await authApi.enableTwoFactor(setupCode.trim())
      setSetupData(null)
      setSetupCode("")
      if (codes.length > 0) {
        setRecoveryCodes(codes)
      } else {
        focusAfterClose.current = headingRef
        toast.success("Authenticator app added")
      }
    }, enableCodeRef)
  }

  const removeTotp = (event: React.FormEvent) => {
    event.preventDefault()
    return run("remove-totp", async () => {
      await twoStepApi.removeTotp(removeCode.trim())
      focusAfterClose.current = headingRef
      setRemovingTotp(false)
      setRemoveCode("")
      toast.success("Authenticator app removed")
    }, removeTotpCodeRef)
  }

  const turnOnWithPasskeys = () => run("enable", async () => {
    const { recoveryCodes: codes } = await twoStepApi.enable()
    if (codes.length > 0) {
      setRecoveryCodes(codes)
    } else {
      focusAfterClose.current = headingRef
      toast.success("Two-step verification is on")
    }
  }, turnOnButtonRef)

  const closeSetup = () => {
    focusAfterClose.current = setupButtonRef
    setSetupData(null)
    setSetupCode("")
  }

  const closeRemoveTotp = () => {
    focusAfterClose.current = removeTotpButtonRef
    setRemovingTotp(false)
    setRemoveCode("")
  }

  const closeTurnOff = () => {
    focusAfterClose.current = turnOffButtonRef
    setTurningOff(false)
    setDisableCode("")
  }

  const closeRecoveryCodes = () => {
    focusAfterClose.current = headingRef
    setRecoveryCodes(null)
  }

  const finishTurnOff = () => {
    focusAfterClose.current = headingRef
    setTurningOff(false)
    setDisableCode("")
    toast.success("Two-step verification is off")
  }

  const turnOffWithPasskey = () => {
    if (!isWebAuthnSupported()) return
    return run("disable-passkey-waiting", async () => {
      const { ceremonyId, options } = await twoStepApi.disableOptions()
      if (!mounted.current) return
      ceremonyInFlight.current = true
      let credential
      try {
        credential = await getPasskey(options)
      } finally {
        ceremonyInFlight.current = false
      }
      if (!mounted.current) return
      setBusy("disable-passkey-verifying")
      await twoStepApi.disable({ ceremonyId, credential })
      finishTurnOff()
    }, disableCodeRef, (error) => passkeyErrorMessage(error, "verify"))
  }

  const turnOffWithCode = (event: React.FormEvent) => {
    event.preventDefault()
    return run("disable-code", async () => {
      await twoStepApi.disable({ code: disableCode.trim() })
      finishTurnOff()
    }, disableCodeRef)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle
          ref={headingRef}
          id={TWO_STEP_TITLE_ID}
          tabIndex={-1}
          className="flex items-center gap-2 text-base focus-visible:ring-0 focus-visible:ring-offset-0"
        >
          Two-step verification
          {status?.enabled && <Badge variant="success">On</Badge>}
        </CardTitle>
        <CardDescription>
          Ask for a second step after your password, Google or GitHub sign-in: a code from an authenticator app, or a passkey or security key.
          {!recoveryCodes && (
            <>
              {" "}
              <Link href="/help/passkeys#two-step" className="text-brand-link">Help</Link>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : error && !status ? (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-destructive">Failed to load two-step verification</p>
            <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>Retry</Button>
          </div>
        ) : !status ? null : recoveryCodes ? (
          <RecoveryCodes codes={recoveryCodes} onDone={closeRecoveryCodes} />
        ) : (
          <>
            {status.enabled && (
              <p className="text-sm">
                <span className="font-medium">Your second step:</span> {secondStepSummary(status)}
              </p>
            )}

            <section aria-labelledby="authenticatorAppHeading" className="space-y-3">
              <h4 id="authenticatorAppHeading" className="text-sm font-medium">Authenticator app</h4>

              {!status.totp && !setupData && (
                <div className="space-y-2">
                  <Button ref={setupButtonRef} size="sm" variant="outline" disabled={busy !== null} aria-busy={busy === "setup"} onClick={startSetup}>
                    {busy === "setup" ? "Starting…" : "Set up an authenticator app"}
                  </Button>
                  {!status.enabled && (
                    <p className="text-xs text-muted-foreground">Setting this up also turns two-step verification on.</p>
                  )}
                </div>
              )}

              {!status.totp && setupData && (
                <form onSubmit={confirmSetup} className="space-y-3">
                  <p className="text-sm text-muted-foreground">Scan with your authenticator app, then enter the 6-digit code.</p>
                  <div className="inline-block rounded-lg border bg-white p-2">
                    <QRCodeSVG value={setupData.otpauthUri} size={160} fgColor="#0e0e11" bgColor="#ffffff" />
                  </div>
                  <p className="break-all text-xs text-muted-foreground">Secret: <span className="font-mono text-foreground">{setupData.secret}</span></p>
                  <div>
                    <Label htmlFor="enableCode">Verification code</Label>
                    <Input ref={enableCodeRef} id="enableCode" inputMode="numeric" autoComplete="one-time-code" placeholder="123456" value={setupCode} onChange={(e) => setSetupCode(e.target.value)} required className="mt-1.5 h-10 max-w-sm" autoFocus />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm" disabled={busy !== null || !setupCode.trim()} aria-busy={busy === "enable-totp"}>
                      {busy === "enable-totp" ? "Verifying…" : "Verify & enable"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={closeSetup}>Cancel</Button>
                  </div>
                </form>
              )}

              {status.totp && !removingTotp && (
                <Button ref={removeTotpButtonRef} size="sm" variant="outline" disabled={busy !== null} onClick={() => setRemovingTotp(true)}>
                  Remove authenticator app
                </Button>
              )}

              {status.totp && removingTotp && (
                <form onSubmit={removeTotp} className="space-y-3">
                  <div>
                    <Label htmlFor="removeTotpCode">Authenticator or recovery code</Label>
                    <Input ref={removeTotpCodeRef} id="removeTotpCode" inputMode="text" autoComplete="one-time-code" placeholder="123456 or recovery code" value={removeCode} onChange={(e) => setRemoveCode(e.target.value)} required className="mt-1.5 h-10 max-w-sm font-mono placeholder:font-sans" autoFocus />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="submit" size="sm" variant="destructive" disabled={busy !== null || !removeCode.trim()} aria-busy={busy === "remove-totp"}>
                      {busy === "remove-totp" ? "Removing…" : "Remove authenticator app"}
                    </Button>
                    <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={closeRemoveTotp}>Cancel</Button>
                  </div>
                </form>
              )}
            </section>

            <Separator />

            {!status.enabled && status.passkeys > 0 && supported && (
              <Button ref={turnOnButtonRef} size="sm" disabled={busy !== null} aria-busy={busy === "enable"} onClick={turnOnWithPasskeys}>
                {busy === "enable" ? "Turning on…" : "Turn on with my passkeys"}
              </Button>
            )}

            {!status.enabled && status.passkeys === 0 && !status.totp && (
              <p className="text-sm text-muted-foreground">Add an authenticator app or a passkey to turn this on.</p>
            )}

            {status.enabled && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground tabular-nums">Recovery codes left: {status.recoveryCodesRemaining}</p>

                {status.recoveryCodesRemaining <= LOW_RECOVERY_CODES && (
                  <p className="flex items-start gap-1.5 text-sm font-medium text-warning">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    {status.recoveryCodesRemaining === 0
                      ? "No recovery codes left. Turn two-step verification off and on again to get 10 new ones."
                      : "Running low on recovery codes. Turn two-step verification off and on again to get 10 new ones."}
                  </p>
                )}

                {!turningOff && (
                  <Button ref={turnOffButtonRef} size="sm" variant="outline" disabled={busy !== null} onClick={() => setTurningOff(true)}>
                    Turn off two-step verification
                  </Button>
                )}

                {turningOff && (
                  <div className="space-y-4 rounded-lg border p-4">
                    {status.passkeys > 0 && supported && (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          className="h-auto min-h-8 gap-1.5 whitespace-normal"
                          disabled={busy !== null}
                          aria-busy={busy === "disable-passkey-waiting" || busy === "disable-passkey-verifying"}
                          onClick={turnOffWithPasskey}
                          autoFocus
                        >
                          <KeyRound className="h-4 w-4 shrink-0" />
                          {busy === "disable-passkey-waiting"
                            ? "Waiting for your passkey…"
                            : busy === "disable-passkey-verifying"
                              ? "Turning off…"
                              : "Use a passkey or security key"}
                        </Button>
                        <div className="border-t" />
                      </>
                    )}
                    <form onSubmit={turnOffWithCode} className="space-y-3">
                      <div>
                        <Label htmlFor="disableCode">Authenticator or recovery code</Label>
                        <Input ref={disableCodeRef} id="disableCode" inputMode="text" autoComplete="one-time-code" placeholder="123456 or recovery code" value={disableCode} onChange={(e) => setDisableCode(e.target.value)} required className="mt-1.5 h-10 max-w-sm font-mono placeholder:font-sans" autoFocus={status.passkeys === 0 || !supported} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" size="sm" variant="destructive" disabled={busy !== null || !disableCode.trim()} aria-busy={busy === "disable-code"}>
                          {busy === "disable-code" ? "Turning off…" : "Turn off"}
                        </Button>
                        <Button type="button" size="sm" variant="outline" disabled={busy !== null} onClick={closeTurnOff}>Cancel</Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
