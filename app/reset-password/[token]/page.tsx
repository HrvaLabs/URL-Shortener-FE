"use client"

import { useRef, useState } from "react"
import { ApiError, authApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { NewPasswordInput } from "@/components/auth/new-password-input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { toast } from "sonner"
import { useRouter, useParams } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"

export default function SetPasswordPage() {
  const [password, setPassword] = useState("")
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.resetPassword({ token, password })
      toast.success("Password changed. Sign in with the new one.")
      router.push("/login")
    } catch (err) {
      const fieldError = err instanceof ApiError ? err.fields.password : undefined
      if (fieldError) {
        setPasswordError(fieldError)
        passwordRef.current?.focus()
      } else {
        toast.error(err instanceof Error && err.message ? err.message : "Failed to reset password")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-6">
        <Card className="w-full max-w-sm p-8">
          <div className="text-center">
            <h1 className="font-display text-2xl">Set new password</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">Choose a new password for your account</p>
          </div>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
              <NewPasswordInput
                ref={passwordRef}
                id="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(null) }}
                required
                error={passwordError}
                className="mt-2"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Resetting…" : "Reset password"}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  )
}
