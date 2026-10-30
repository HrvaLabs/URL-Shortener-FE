"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { usePublicSettings } from "@/lib/hooks/useSettings"
import { SIGNUPS_PAUSED, signupsPaused } from "@/lib/moderation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { PageMeta } from "@/components/page-meta"
import { ProviderButtons } from "@/components/auth/provider-buttons"
import { ArrowLeft } from "lucide-react"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const router = useRouter()
  const { data: publicSettings } = usePublicSettings()
  const paused = signupsPaused(publicSettings)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      await register(email, password)
      toast.success("Account created! Check your email to verify before signing in.")
      router.push("/login")
    } catch (err: any) {
      toast.error(err.message || "Registration failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <PageMeta title="Create an account" description="Sign up for a free hrva.cc account to manage your shortened URLs with analytics and control." />
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
            <div className="text-center">
              <h1 className="font-display text-2xl">Create an account</h1>
              {!paused && <p className="mt-1.5 text-sm text-muted-foreground">Start managing your links</p>}
            </div>
            {paused ? (
              <p className="mt-8 text-center text-sm leading-relaxed text-muted-foreground">
                {SIGNUPS_PAUSED} <Link href="/login" className="font-medium text-brand hover:underline">Sign in</Link> if you already have an account.
              </p>
            ) : (
              <>
              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
              <ProviderButtons next={null} />
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="font-medium text-brand hover:underline">
                  Sign in
                </Link>
              </p>
              <p className="mt-3 text-center text-xs leading-relaxed text-muted-foreground">
                By creating an account you agree to the{" "}
                <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">
                  Privacy Policy
                </Link>
                .
              </p>
              </>
            )}
          </Card>
        </div>
      </main>
    </div>
  )
}
