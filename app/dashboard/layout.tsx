"use client"

import { useAuth } from "@/lib/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ServiceUnavailable } from "@/components/service-unavailable"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logoutDestination, unavailable } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading && !user && !unavailable) {
      router.replace(logoutDestination ?? `/login?next=${encodeURIComponent(pathname + window.location.search + window.location.hash)}`)
    }
  }, [user, isLoading, router, pathname, logoutDestination, unavailable])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
          <span className="text-xs text-muted-foreground">Loading…</span>
        </div>
      </div>
    )
  }

  if (!user && !unavailable) return null

  return (
    <div className="min-h-screen bg-background">
      <TooltipProvider delayDuration={300}>
        <DashboardNav />
        <main className="container py-8">
          {user ? children : unavailable && <ServiceUnavailable message={unavailable} />}
        </main>
      </TooltipProvider>
    </div>
  )
}
