"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { CircleAlert, CircleCheck } from "lucide-react"
import { authApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { PageMeta } from "@/components/page-meta"

type State = "loading" | "success" | "error"

export default function VerifyEmailPage() {
  const params = useParams()
  const token = params.token as string
  const [state, setState] = useState<State>("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setState("error")
      setMessage("Invalid verification link.")
      return
    }
    authApi
      .verifyEmail(token)
      .then(() => setState("success"))
      .catch((err: any) => {
        setState("error")
        setMessage(err?.message || "Verification failed.")
      })
  }, [token])

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <PageMeta title="Verify email" description="Verify your hrva.cc email address." />
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-6">
        <Card className="w-full max-w-sm p-8 text-center">
          {state === "loading" && (
            <div className="flex flex-col items-center gap-4 py-4" role="status">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
              <span className="text-sm text-muted-foreground">Verifying your email…</span>
            </div>
          )}

          {state === "success" && (
            <>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                <CircleCheck className="h-5 w-5 text-success" />
              </div>
              <h1 className="mt-4 font-display text-2xl">Email verified</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">Your account is now active. You can sign in.</p>
              <Button asChild className="mt-8 w-full">
                <Link href="/login">Go to sign in</Link>
              </Button>
            </>
          )}

          {state === "error" && (
            <>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <CircleAlert className="h-5 w-5 text-destructive" />
              </div>
              <h1 className="mt-4 font-display text-2xl">Verification failed</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{message}</p>
              <Button asChild variant="outline" className="mt-8 w-full">
                <Link href="/verify-email/resend">Resend verification email</Link>
              </Button>
            </>
          )}
        </Card>
      </main>
    </div>
  )
}
