"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (!user) router.push("/login")
      else if (!isAdmin) router.push("/dashboard")
    }
  }, [user, isLoading, isAdmin, router])

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
        <DashboardNav />
        <div className="container py-8 md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:gap-8">
          <AdminSidebar />
          <main className="min-w-0">
            {children}
          </main>
        </div>
      </TooltipProvider>
    </div>
  )
}
