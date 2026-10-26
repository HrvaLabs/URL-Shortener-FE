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
import { useAuth } from "@/lib/auth-context"
import { TWO_STEP_METHODS, type SignedIn, type TwoStepMethod } from "@/lib/types"
import { safeNext } from "@/lib/utils"

const messages: Record<string, string> = {
  no_email: "Could not retrieve email from provider.",
  account_inactive: "Your account is deactivated. Contact an administrator.",
  two_step_unavailable: "Two-step sign-in isn't available right now. Try again in a minute.",
  invalid_email: "This account's email address can't be used on hrva.cc. Sign in with another account or with your email and password.",
}

type Callback =
  | { kind: "token"; token: string }
  | { kind: "second-step"; pendingToken: string; methods: TwoStepMethod[] }
  | { kind: "error"; error: string; fromProvider: boolean }

function isTwoStepMethod(value: string): value is TwoStepMethod {
  return (TWO_STEP_METHODS as readonly string[]).includes(value)
}

function readCallback(searchParams: URLSearchParams): Callback {
  const token = searchParams.get("token")
  const pendingToken = searchParams.get("pendingToken")
  const err = searchParams.get("error")

  if (token) return { kind: "token", token }
  if (pendingToken) {
    const methods = (searchParams.get("methods") ?? "").split(",").filter(isTwoStepMethod)
    return { kind: "second-step", pendingToken, methods }
  }
  if (err) return { kind: "error", error: Object.hasOwn(messages, err) ? messages[err] : "Authentication failed.", fromProvider: true }
  return { kind: "error", error: "Invalid callback — no token received.", fromProvider: false }
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
  const { refreshUser, completeSignIn } = useAuth()
  const [callback] = useState(() => readCallback(searchParams))
  const [error, setError] = useState<string | null>(() => {
    if (callback.kind === "error") return callback.error
    if (callback.kind === "second-step" && callback.methods.length === 0) return SIGN_IN_EXPIRED
    return null
  })
  const errorHeadingRef = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    if (callback.kind === "second-step") window.history.replaceState(null, "", "/auth/callback")
  }, [callback])

  useEffect(() => {
    if (error) errorHeadingRef.current?.focus()
  }, [error])

  useEffect(() => {
    if (callback.kind === "token") {
      const next = sessionStorage.getItem("post-login-next")
      localStorage.setItem("auth-token", `Bearer ${callback.token}`)
      refreshUser()
        .then(() => {
          router.push(safeNext(next))
          sessionStorage.removeItem("post-login-next")
        })
        .catch(() => setError("Authentication failed."))
    } else if (callback.kind === "error" && callback.fromProvider) {
      sessionStorage.removeItem("post-login-next")
    }
  }, [callback, router, refreshUser])

  const handleSignedIn = useCallback((signedIn: SignedIn) => {
    completeSignIn(signedIn)
    router.replace(safeNext(sessionStorage.getItem("post-login-next")))
    sessionStorage.removeItem("post-login-next")
  }, [completeSignIn, router])

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
            Authentication failed
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
          <Button asChild className="mt-8 w-full">
            <Link href="/login">Try again</Link>
          </Button>
        </Card>
      </AuthCallbackShell>
    )
  }

  if (callback.kind === "second-step") {
    return (
      <AuthCallbackShell>
        <Card className="w-full max-w-sm p-8">
          <SecondStep
            pendingToken={callback.pendingToken}
            methods={callback.methods}
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
