"use client"

import { Suspense, useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { PageMeta } from "@/components/page-meta"
import { getBackendOrigin, safeNext } from "@/lib/utils"
import { rememberOAuthProvider } from "@/lib/sign-in-methods"
import { ArrowLeft } from "lucide-react"
import { PasskeySignInButton } from "@/components/auth/passkey-sign-in-button"
import { SecondStep } from "@/components/auth/second-step"
import { usePasskeyAutofill } from "@/lib/hooks/usePasskeyAutofill"
import { useWebAuthnSupported } from "@/lib/hooks/useWebAuthnSupported"
import type { SignedIn, TwoStepMethod } from "@/lib/types"
import { abortPasskeyRequest } from "@/lib/webauthn"

function LoginForm({ next }: { next: string | null }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [secondStep, setSecondStep] = useState<{ pendingToken: string; methods: TwoStepMethod[] } | null>(null)
  const [passkeyBusy, setPasskeyBusy] = useState(false)
  const [signedIn, setSignedIn] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const focusEmailOnReturn = useRef<"focus" | "select" | null>(null)
  const { login, completeSignIn } = useAuth()
  const router = useRouter()
  const passkeysSupported = useWebAuthnSupported()

  const finishSignIn = useCallback(() => {
    setSignedIn(true)
    toast.success("Welcome back!")
    router.push(safeNext(next))
  }, [router, next])

  const handleSignedIn = useCallback((result: SignedIn) => {
    completeSignIn(result)
    finishSignIn()
  }, [completeSignIn, finishSignIn])

  usePasskeyAutofill({ enabled: !secondStep && !passkeyBusy && !loading && !signedIn, rememberMe, onSignedIn: handleSignedIn })

  useEffect(() => {
    const focusMode = focusEmailOnReturn.current
    if (secondStep || !focusMode) return
    focusEmailOnReturn.current = null
    emailRef.current?.focus()
    if (focusMode === "select") emailRef.current?.select()
  }, [secondStep])

  const handleExpired = (message: string) => {
    focusEmailOnReturn.current = "focus"
    setSecondStep(null)
    toast.error(message)
  }

  const handleUseDifferentAccount = () => {
    focusEmailOnReturn.current = "select"
    setPassword("")
    setSecondStep(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    abortPasskeyRequest()
    setLoading(true)
    try {
      const result = await login(email, password, rememberMe)
      if (result.status === "two-step") {
        setSecondStep({ pendingToken: result.pendingToken, methods: result.methods })
        setLoading(false)
        return
      }
      finishSignIn()
    } catch (err) {
      setLoading(false)
      const message = (err instanceof Error && err.message) || "Invalid credentials"
      if (message.toLowerCase().includes("verify")) {
        toast.error(message, {
          action: { label: "Resend", onClick: () => router.push("/verify-email/resend") },
        })
      } else {
        toast.error(message)
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <PageMeta title="Sign in" description="Sign in to your hrva.cc account to manage your shortened URLs." />
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-6">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to home
          </Link>
          <Card className="p-8">
            {secondStep ? (
              <SecondStep
                pendingToken={secondStep.pendingToken}
                methods={secondStep.methods}
                onSignedIn={handleSignedIn}
                onExpired={handleExpired}
                onUseDifferentAccount={handleUseDifferentAccount}
              />
            ) : (
              <>
                <div className="text-center">
                  <h1 className="font-display text-2xl">Welcome back</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your account</p>
                </div>
                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      ref={emailRef}
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username webauthn"
                      required
                      className="mt-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link
                        href="/reset-password"
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Forgot?
                      </Link>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                  <label className="flex w-fit cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-input accent-brand"
                    />
                    <span className="text-sm text-muted-foreground">Remember me</span>
                  </label>
                  <Button type="submit" className="w-full" disabled={loading} aria-busy={loading}>
                    {loading ? "Signing in…" : "Sign in"}
                  </Button>
                </form>
                <div className="mt-4">
                  <PasskeySignInButton
                    rememberMe={rememberMe}
                    onSignedIn={handleSignedIn}
                    onBusyChange={setPasskeyBusy}
                  />
                  {passkeysSupported && (
                    <p className="mt-2 text-center text-sm">
                      <Link href="/help/passkeys" className="text-brand-link">How passkeys work</Link>
                    </p>
                  )}
                </div>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button asChild variant="outline" className="w-full gap-2">
                    <a
                      href={`${getBackendOrigin()}/oauth2/authorization/google`}
                      onClick={() => {
                        rememberOAuthProvider("GOOGLE")
                        if (next) sessionStorage.setItem("post-login-next", next)
                        else sessionStorage.removeItem("post-login-next")
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google
                    </a>
                  </Button>
                  <Button asChild variant="outline" className="w-full gap-2">
                    <a
                      href={`${getBackendOrigin()}/oauth2/authorization/github`}
                      onClick={() => {
                        rememberOAuthProvider("GITHUB")
                        if (next) sessionStorage.setItem("post-login-next", next)
                        else sessionStorage.removeItem("post-login-next")
                      }}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/>
                      </svg>
                      GitHub
                    </a>
                  </Button>
                </div>
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <Link href="/register" className="font-medium text-brand hover:underline">
                    Register
                  </Link>
                </p>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}

function LoginFormWithNext() {
  const searchParams = useSearchParams()
  return <LoginForm next={searchParams.get("next")} />
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginForm next={null} />}>
      <LoginFormWithNext />
    </Suspense>
  )
}
