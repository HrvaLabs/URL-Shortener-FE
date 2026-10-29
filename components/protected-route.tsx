"use client"

import { useAuth } from "@/lib/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isLoading, logoutDestination } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(logoutDestination ?? `/login?next=${encodeURIComponent(pathname + window.location.search + window.location.hash)}`)
    }
  }, [user, isLoading, router, pathname, logoutDestination])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
