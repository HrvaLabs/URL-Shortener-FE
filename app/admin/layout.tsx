"use client"

import { useAuth } from "@/lib/auth-context"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardNav, wideContainerClass } from "@/components/dashboard/dashboard-nav"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, logoutDestination } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.replace(logoutDestination ?? `/login?next=${encodeURIComponent(pathname + window.location.search + window.location.hash)}`)
      else if (!isAdmin) router.push("/dashboard")
    }
  }, [user, isLoading, isAdmin, router, pathname, logoutDestination])

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

  if (!user || !isAdmin) return null

  return (
    <div className="min-h-screen bg-background">
      <TooltipProvider delayDuration={300}>
        <DashboardNav wide />
        <div className={cn(wideContainerClass, "py-8 md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8")}>
          <AdminSidebar />
          <main className="@container min-w-0">
            {children}
          </main>
        </div>
      </TooltipProvider>
    </div>
  )
}
