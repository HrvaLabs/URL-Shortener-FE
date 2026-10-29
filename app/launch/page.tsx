"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export default function LaunchPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    router.replace(user ? "/dashboard" : "/")
  }, [isLoading, user, router])

  return (
    <div role="status" className="flex min-h-screen items-center justify-center bg-background">
      <div aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      <span className="sr-only">Opening hrva.cc</span>
    </div>
  )
}
