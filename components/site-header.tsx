"use client"

import Link from "next/link"
import { LayoutDashboard, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { Logo } from "@/components/logo"
import { NavLink } from "@/components/nav-link"
import { useAuth } from "@/lib/auth-context"

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/help/link-in-bio", label: "Bio pages" },
  { href: "/developers", label: "Developers" },
  { href: "/help", label: "Help" },
]

const checkLink = { href: "/validate", label: "Check a link" }

const navLinkClass =
  "rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:bg-accent aria-[current=page]:font-medium aria-[current=page]:text-foreground"

export function SiteHeader() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 border-b bg-background">
      <div className="container flex min-h-16 items-center justify-between gap-4 py-2">
        <div className="flex min-w-0 items-center gap-6">
          <Logo />
          <nav aria-label="Main" className="hidden flex-wrap items-center gap-x-1 lg:flex">
            {navLinks.map((link) => (
              <NavLink key={link.href} href={link.href} className={navLinkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <NavLink href={checkLink.href} className={`hidden lg:inline-flex ${navLinkClass}`}>
            {checkLink.label}
          </NavLink>
          <ThemeToggle />
          {user ? (
            <>
              <Button asChild variant="outline" size="sm" className="relative gap-1.5">
                <NavLink href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="sr-only sm:not-sr-only">Dashboard</span>
                </NavLink>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="relative gap-1.5 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Log out</span>
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden text-muted-foreground hover:text-foreground sm:inline-flex">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/register">Get started</Link>
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="h-9 w-9 text-muted-foreground hover:text-foreground lg:hidden">
                <Menu className="h-[1.15rem] w-[1.15rem]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {navLinks.map((link) => (
                <DropdownMenuItem key={link.href} asChild className="aria-[current=page]:font-medium">
                  <NavLink href={link.href}>{link.label}</NavLink>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="aria-[current=page]:font-medium">
                <NavLink href={checkLink.href}>{checkLink.label}</NavLink>
              </DropdownMenuItem>
              {!user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/login">Sign in</Link>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
