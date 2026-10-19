"use client"

import { useState } from "react"
import Link from "next/link"
import { authApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { PageMeta } from "@/components/page-meta"

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.resendVerification(email)
      setSent(true)
      toast.success("If the account exists and is unverified, a new link has been sent.")
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <PageMeta title="Resend verification" description="Resend your hrva.cc email verification link." />
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-6">
        <Card className="w-full max-w-sm p-8">
          <div className="text-center">
            <h1 className="font-display text-2xl">Resend verification</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">We&apos;ll email you a fresh verification link</p>
          </div>
          {sent ? (
            <div className="mt-8 space-y-4">
              <div className="rounded-lg bg-success/10 p-4 text-center text-sm text-success">
                If an unverified account exists for that email, a new verification link is on its way.
              </div>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4" />
                  Back to login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending…" : "Resend verification link"}
              </Button>
              <Link
                href="/login"
                className="flex items-center justify-center gap-1.5 pt-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to login
              </Link>
            </form>
          )}
        </Card>
      </main>
    </div>
  )
}
