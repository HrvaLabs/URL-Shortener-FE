"use client"

import { Suspense, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { urlApi } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { PageMeta } from "@/components/page-meta"
import { Lock } from "lucide-react"
import { shortHostOf } from "@/lib/utils"
import { isHostnameShaped } from "@/lib/domains"

const ELLIPSIS = String.fromCodePoint(0x2026)

function ProtectedHeading({ children }: { children?: React.ReactNode }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
      <h1 className="mt-4 font-display text-2xl">Protected link</h1>
      {children}
      <p className="mt-1.5 text-sm text-muted-foreground">Enter the password to continue</p>
    </div>
  )
}

function ProtectedLinkForm() {
  const params = useParams()
  const short = params.short as string
  const domain = useSearchParams().get("domain")?.trim() || null
  const host = domain === null ? shortHostOf() : isHostnameShaped(domain) ? domain : null
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await urlApi.unlock(short, password, domain)
      window.location.assign(res.longUrl)
    } catch (err: unknown) {
      setError((err instanceof Error && err.message) || "Incorrect password")
      setLoading(false)
    }
  }

  return (
    <>
      <ProtectedHeading>
        {host && (
          <p className="mt-1.5 font-mono text-sm font-medium text-brand [overflow-wrap:anywhere]">
            <span className="font-normal text-muted-foreground">{host}/</span>{short}
          </p>
        )}
      </ProtectedHeading>
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={error ? true : undefined}
            required
            autoFocus
            className="mt-2"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading || !password}>
          {loading ? `Unlocking${ELLIPSIS}` : "Unlock & continue"}
        </Button>
      </form>
    </>
  )
}

export default function ProtectedLinkPage() {
  return (
    <div className="flex min-h-screen flex-col bg-muted/40">
      <PageMeta title="Protected link" description="This link is password protected." />
      <header className="container flex h-16 items-center justify-between">
        <Logo />
        <ThemeToggle />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-6">
        <Card className="w-full max-w-sm p-8">
          <Suspense fallback={<ProtectedHeading />}>
            <ProtectedLinkForm />
          </Suspense>
        </Card>
      </main>
    </div>
  )
}
