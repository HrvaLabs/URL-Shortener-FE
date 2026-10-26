"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useReviewCount } from "@/lib/hooks/useReviewCount"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { ReviewCountBadge } from "@/components/admin/review-count-badge"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "URLs" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/api-keys", label: "API Keys" },
  { href: "/dashboard/settings", label: "Settings" },
]

export const navItemClass = "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm transition-colors"

export function navItemState(isActive: boolean) {
  return isActive
    ? "bg-accent font-medium text-foreground"
    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
}

function AdminLink({ pathname }: { pathname: string }) {
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")
  const { data: reviewCount } = useReviewCount()

  return (
    <Link
      href="/admin/dashboard"
      aria-current={isAdminRoute ? "true" : undefined}
      className={cn(navItemClass, navItemState(isAdminRoute))}
    >
      Admin
      {!!reviewCount && <ReviewCountBadge count={reviewCount} />}
    </Link>
  )
}

export function DashboardNav() {
  const pathname = usePathname()
  const { user, logout, isAdmin } = useAuth()

  const links = navItems.map((item) => {
    const isActive = pathname === item.href
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(navItemClass, navItemState(isActive))}
      >
        {item.label}
      </Link>
    )
  })

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="container">
        <div className="flex h-14 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-6">
            <Logo showText className="shrink-0" />
            <nav aria-label="Dashboard" className="hidden items-center gap-1 md:flex">
              {links}
              {isAdmin && <AdminLink pathname={pathname} />}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-2 hidden max-w-[180px] truncate text-sm text-muted-foreground lg:block">
              {user?.email}
            </span>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              aria-label="Log out"
              className="h-9 w-9 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav
          aria-label="Dashboard"
          className="-mx-1 flex items-center gap-1 overflow-x-auto px-1 pb-2 scrollbar-none md:hidden [&::-webkit-scrollbar]:hidden"
        >
          {links}
          {isAdmin && <AdminLink pathname={pathname} />}
        </nav>
      </div>
    </header>
  )
}
