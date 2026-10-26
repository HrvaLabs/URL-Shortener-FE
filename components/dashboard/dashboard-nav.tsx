"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
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

export const wideContainerClass = "mx-auto max-w-(--breakpoint-2xl) px-5"

export const navItemClass = "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm transition-colors"

/** Scrolls a horizontally scrolling nav row so `item` is in view, without moving focus or the page. */
export function revealInRow(item: HTMLElement | null, margin = 0) {
  const row = item?.parentElement
  if (!item || !row || row.scrollWidth <= row.clientWidth) return
  const itemBox = item.getBoundingClientRect()
  const rowBox = row.getBoundingClientRect()
  if (itemBox.left - margin < rowBox.left) row.scrollLeft -= rowBox.left - itemBox.left + margin
  else if (itemBox.right + margin > rowBox.right) row.scrollLeft += itemBox.right - rowBox.right + margin
}

export function navItemState(isActive: boolean) {
  return isActive
    ? "bg-accent font-medium text-foreground"
    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
}

function AdminLink({ pathname }: { pathname: string }) {
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")
  const { data: reviewCount } = useReviewCount()
  const reviewCountLoaded = reviewCount !== undefined
  const linkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (isAdminRoute) revealInRow(linkRef.current)
  }, [isAdminRoute, reviewCountLoaded])

  return (
    <Link
      ref={linkRef}
      href="/admin/dashboard"
      aria-current={isAdminRoute ? "true" : undefined}
      className={cn(navItemClass, navItemState(isAdminRoute))}
    >
      Admin
      {!!reviewCount && <ReviewCountBadge count={reviewCount} />}
    </Link>
  )
}

export function DashboardNav({ wide = false }: { wide?: boolean }) {
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
      <div className={wide ? wideContainerClass : "container"}>
        <div className="flex min-h-14 items-center justify-between gap-4 py-1">
          <div className="flex min-w-0 items-center gap-6">
            <Logo showText className="shrink-0" />
            <nav aria-label="Dashboard" className="hidden items-center gap-1 md:flex">
              {links}
              {isAdmin && <AdminLink pathname={pathname} />}
            </nav>
          </div>

          <div className="flex min-w-0 items-center gap-1 [&>button]:shrink-0">
            <span className="mr-2 hidden max-w-64 text-sm leading-tight text-muted-foreground [overflow-wrap:anywhere] lg:block">
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
