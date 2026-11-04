"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useFullPageNotice } from "@/lib/reconnecting"

export const NOT_SIGNED_OUT = "You haven't been signed out. This page tries again every 30 seconds."

export function ServiceUnavailable({ message }: { message: string }) {
  const { refreshUser } = useAuth()
  const [checking, setChecking] = useState(false)
  useFullPageNotice()

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
      <p className="mt-1 text-sm text-muted-foreground">{NOT_SIGNED_OUT}</p>
      <Button variant="outline" size="sm" className="mt-4" onClick={retry} disabled={checking}>
        Retry
      </Button>
    </div>
  )
}
