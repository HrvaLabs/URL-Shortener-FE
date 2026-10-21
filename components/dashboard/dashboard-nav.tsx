"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useReviewCount } from "@/lib/hooks/useReviewCount"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { Users, LinkIcon, Shield, LogOut, Activity, History, Mail, LayoutDashboard, ChevronDown, ShieldAlert, ListFilter } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "URLs" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/api-keys", label: "API Keys" },
  { href: "/dashboard/settings", label: "Settings" },
]

const adminItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin", label: "Users", icon: Users },
  { href: "/admin/urls", label: "All URLs", icon: LinkIcon },
  { href: "/admin/review", label: "Review queue", icon: ShieldAlert },
  { href: "/admin/blocklists", label: "Blocklists", icon: ListFilter },
  { href: "/admin/api-keys", label: "All API Keys", icon: Shield },
  { href: "/admin/health", label: "Health", icon: Activity },
  { href: "/admin/audit-log", label: "Audit Log", icon: History },
  { href: "/admin/email-log", label: "Email Log", icon: Mail },
]

const navItemClass = "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 text-sm transition-colors"

function navItemState(isActive: boolean) {
  return isActive
    ? "bg-accent font-medium text-foreground"
    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
}

function AdminMenu({ pathname }: { pathname: string }) {
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/")
  const { data: reviewCount } = useReviewCount()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(navItemClass, navItemState(isAdminRoute), "outline-hidden data-[state=open]:bg-accent data-[state=open]:text-foreground")}>
        Admin
        <ChevronDown className="h-3.5 w-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 focus-visible:ring-0 focus-visible:ring-offset-0">
        {adminItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <DropdownMenuItem
              key={item.href}
              asChild
              className={cn("cursor-pointer gap-2", isActive ? "bg-accent font-medium text-foreground" : "text-muted-foreground focus:text-foreground")}
            >
              <Link href={item.href} aria-current={isActive ? "page" : undefined}>
                <Icon className="h-4 w-4" />
                {item.label}
                {item.href === "/admin/review" && !!reviewCount && (
                  <span className="ml-auto rounded-md bg-warning/10 px-1.5 text-xs font-medium tabular-nums text-warning">
                    {reviewCount > 99 ? "99+" : reviewCount}
                    <span className="sr-only"> waiting</span>
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
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
              {isAdmin && <AdminMenu pathname={pathname} />}
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
          {isAdmin && <AdminMenu pathname={pathname} />}
        </nav>
      </div>
    </header>
  )
}
