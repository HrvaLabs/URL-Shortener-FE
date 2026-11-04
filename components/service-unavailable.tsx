"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"

export const STILL_SIGNED_IN = "You're still signed in. This page tries again every 30 seconds."

export function ServiceUnavailable({ message }: { message: string }) {
  const { refreshUser } = useAuth()
  const [checking, setChecking] = useState(false)

  const retry = async () => {
    setChecking(true)
    try {
      await refreshUser()
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="rounded-xl border bg-card px-6 py-12 text-center">
      <p role="status" className="text-sm font-medium text-destructive [overflow-wrap:anywhere]">
        {message}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">{STILL_SIGNED_IN}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={retry} disabled={checking}>
        Retry
      </Button>
    </div>
  )
}
