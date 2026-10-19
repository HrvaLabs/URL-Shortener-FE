"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CircleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"
import { safeNext } from "@/lib/utils"

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
  const { refreshUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get("token")
    const err = searchParams.get("error")

    if (token) {
      const next = sessionStorage.getItem("post-login-next")
      localStorage.setItem("auth-token", `Bearer ${token}`)
      refreshUser()
        .then(() => {
          router.push(safeNext(next))
          sessionStorage.removeItem("post-login-next")
        })
        .catch(() => setError("Authentication failed."))
    } else if (err) {
      sessionStorage.removeItem("post-login-next")
      const messages: Record<string, string> = {
        no_email: "Could not retrieve email from provider.",
        account_inactive: "Your account is deactivated. Contact an administrator.",
      }
      setError(messages[err] ?? "Authentication failed.")
    } else {
      setError("Invalid callback — no token received.")
    }
  }, [searchParams, router, refreshUser])

  if (error) {
    return (
      <AuthCallbackShell>
        <Card className="w-full max-w-sm p-8 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <CircleAlert className="h-5 w-5 text-destructive" />
          </div>
          <h1 className="mt-4 font-display text-2xl">Authentication failed</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{error}</p>
          <Button asChild className="mt-8 w-full">
            <Link href="/login">Try again</Link>
          </Button>
        </Card>
      </AuthCallbackShell>
    )
  }

  return <AuthCallbackLoading />
}
