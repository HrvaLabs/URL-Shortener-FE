"use client"

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CircleAlert } from "lucide-react"
import { SIGN_IN_EXPIRED, SecondStep } from "@/components/auth/second-step"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { ApiError, authApi } from "@/lib/api-client"
import { useAuth } from "@/lib/auth-context"
import { FORGOT_PASSWORD_LABEL, SIGNUPS_PAUSED, providerDisabledHeading, providerDisabledText } from "@/lib/moderation"
import { forgetOAuthProvider, providerFromParam, providerTurnedOffText, readOAuthProvider, type SwitchableMethod } from "@/lib/sign-in-methods"
import { TWO_STEP_METHODS, type SignedIn, type TwoStepMethod } from "@/lib/types"
import { safeNext } from "@/lib/utils"

const messages: Record<string, string> = {
  no_email: "Could not retrieve email from provider.",
  account_inactive: "Your account is deactivated. Contact an administrator.",
  two_step_unavailable: "Two-step sign-in isn't available right now. Try again in a minute.",
  sign_in_unavailable: "Signing in isn't available right now. Try again in a minute.",
  invalid_email: "This account's email address can't be used on hrva.cc. Sign in with another account, or another way.",
  github_email_unverified: "Your GitHub account has no verified email address. Verify one on GitHub, or sign in another way.",
  google_email_unverified: "Your Google account's email address isn't verified.",
  registration_disabled: `${SIGNUPS_PAUSED} Sign in if you already have an account.`,
  provider_error: "Signing in didn't work. Try again, or sign in another way.",
}

type Callback =
  | { kind: "code"; code: string }
  | { kind: "second-step"; pendingToken: string; methods: TwoStepMethod[] }
  | { kind: "error"; error: string; fromProvider: boolean; switchedOff?: { provider: SwitchableMethod | null } }

function isTwoStepMethod(value: string): value is TwoStepMethod {
  return (TWO_STEP_METHODS as readonly string[]).includes(value)
}

function readCallback(searchParams: URLSearchParams): Callback {
  const code = searchParams.get("code")
  const pendingToken = searchParams.get("pendingToken")
  const err = searchParams.get("error")

  if (code) return { kind: "code", code }
  if (pendingToken) {
    const methods = (searchParams.get("methods") ?? "").split(",").filter(isTwoStepMethod)
    return { kind: "second-step", pendingToken, methods }
  }
  if (err === "provider_turned_off") return { kind: "error", error: providerTurnedOffText(providerFromParam(searchParams.get("provider")) ?? readOAuthProvider()), fromProvider: true }
  if (err === "provider_disabled") {
    const provider = providerFromParam(searchParams.get("provider")) ?? readOAuthProvider()
    return { kind: "error", error: providerDisabledText(provider), fromProvider: true, switchedOff: { provider } }
  }
  if (err) return { kind: "error", error: Object.hasOwn(messages, err) ? messages[err] : "Authentication failed.", fromProvider: true }
  return { kind: "error", error: "Invalid callback — no sign-in code received.", fromProvider: false }
}

function withForgotPasswordLink(text: string) {
  const [before, after] = text.split(FORGOT_PASSWORD_LABEL)
  if (after === undefined) return text
  return (
    <>
      {before}
      <Link href="/reset-password" className="font-medium text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">{FORGOT_PASSWORD_LABEL}</Link>
      {after}
    </>
  )
}

function AuthCallbackShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-6">{children}</main>
    </div>
  )
}

export function AuthCallbackLoading() {
  return (
    <AuthCallbackShell>
      <div className="flex flex-col items-center gap-4" role="status">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
        <span className="text-sm text-muted-foreground">Signing you in…</span>
      </div>
    </AuthCallbackShell>
  )
}

export function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { completeSignIn } = useAuth()
  const [callback] = useState(() => readCallback(searchParams))
  const [secondStep, setSecondStep] = useState<{ pendingToken: string; methods: TwoStepMethod[] } | null>(() =>
    callback.kind === "second-step" ? { pendingToken: callback.pendingToken, methods: callback.methods } : null)
  const exchanged = useRef(false)
  const [error, setError] = useState<string | null>(() => {
    if (callback.kind === "error") return callback.error
    if (callback.kind === "second-step" && callback.methods.length === 0) return SIGN_IN_EXPIRED
    return null
  })
  const switchedOff = callback.kind === "error" && error === callback.error ? callback.switchedOff : undefined
  const errorHeadingRef = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    if (callback.kind === "second-step" || callback.kind === "code") window.history.replaceState(null, "", "/auth/callback")
  }, [callback])

  useEffect(() => {
    if (error) errorHeadingRef.current?.focus()
  }, [error])

  const handleSignedIn = useCallback((signedIn: SignedIn) => {
    completeSignIn(signedIn)
    router.replace(safeNext(sessionStorage.getItem("post-login-next")))
    sessionStorage.removeItem("post-login-next")
  }, [completeSignIn, router])

  useEffect(() => {
    forgetOAuthProvider()
    if (callback.kind === "code") {
      if (exchanged.current) return
      exchanged.current = true
      localStorage.removeItem("auth-token")
      authApi.exchangeOAuthCode(callback.code)
        .then((response) => {
          if (response.twoStepRequired && response.pendingToken) {
            setSecondStep({ pendingToken: response.pendingToken, methods: response.methods ?? [] })
          } else if (response.token && response.user) {
            handleSignedIn({ token: response.token, user: response.user })
          } else {
            setError("Authentication failed.")
          }
        })
        .catch((err) => setError(err instanceof ApiError && err.status === 410 ? SIGN_IN_EXPIRED : err instanceof Error && err.message ? err.message : "Authentication failed."))
    } else if (callback.kind === "error" && callback.fromProvider) {
      sessionStorage.removeItem("post-login-next")
    }
  }, [callback, handleSignedIn])

  const handleExpired = useCallback((message: string) => setError(message), [])

  const handleBackToSignIn = useCallback(() => router.push("/login"), [router])

  if (error) {
    return (
      <AuthCallbackShell>
        <Card className="w-full max-w-sm p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <CircleAlert className="h-5 w-5 text-destructive" />
          </div>
          <h1
            ref={errorHeadingRef}
            tabIndex={-1}
            className="mt-4 font-display text-2xl focus-visible:ring-0 focus-visible:ring-offset-0"
          >
            {switchedOff ? providerDisabledHeading(switchedOff.provider) : "Authentication failed"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{switchedOff ? withForgotPasswordLink(error) : error}</p>
          <Button asChild className="mt-8 w-full">
            <Link href="/login">{switchedOff ? "Back to sign in" : "Try again"}</Link>
          </Button>
        </Card>
      </AuthCallbackShell>
    )
  }

  if (secondStep) {
    return (
      <AuthCallbackShell>
        <Card className="w-full max-w-sm p-8">
          <SecondStep
            pendingToken={secondStep.pendingToken}
            methods={secondStep.methods}
            onSignedIn={handleSignedIn}
            onExpired={handleExpired}
            onBackToSignIn={handleBackToSignIn}
          />
        </Card>
      </AuthCallbackShell>
    )
  }

  return <AuthCallbackLoading />
}
