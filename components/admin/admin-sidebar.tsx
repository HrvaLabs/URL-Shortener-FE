"use client"

import { Fragment, useCallback, useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Activity, Bookmark, History, LayoutDashboard, LinkIcon, ListFilter, Mail, Shield, ShieldAlert, Users, type LucideIcon } from "lucide-react"
import { useReviewCount } from "@/lib/hooks/useReviewCount"
import { ReviewCountBadge } from "@/components/admin/review-count-badge"
import { navItemClass, navItemState, revealInRow } from "@/components/dashboard/dashboard-nav"
import { cn } from "@/lib/utils"

export type AdminNavItem = { href: string; label: string; icon: LucideIcon; badge?: "review" }

export type AdminNavGroup = { title: string; items: AdminNavItem[] }

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Stats", icon: LayoutDashboard },
      { href: "/admin/health", label: "Health", icon: Activity },
    ],
  },
  {
    title: "Moderation",
    items: [
      { href: "/admin/review", label: "Review queue", icon: ShieldAlert, badge: "review" },
      { href: "/admin/blocklists", label: "Blocklists", icon: ListFilter },
      { href: "/admin/reserved", label: "Reserved aliases", icon: Bookmark },
    ],
  },
  {
    title: "Links and accounts",
    items: [
      { href: "/admin/urls", label: "All URLs", icon: LinkIcon },
      { href: "/admin", label: "Users", icon: Users },
      { href: "/admin/api-keys", label: "All API keys", icon: Shield },
    ],
  },
  {
    title: "Logs",
    items: [
      { href: "/admin/audit-log", label: "Audit log", icon: History },
      { href: "/admin/email-log", label: "Email log", icon: Mail },
    ],
  },
]

const fadePx = 32

const fadeWidth = `${fadePx}px`

function chipRowMask({ start, end }: { start: boolean; end: boolean }): string | undefined {
  if (!start && !end) return undefined
  const left = start ? `transparent, black ${fadeWidth}` : "black"
  const right = end ? `black calc(100% - ${fadeWidth}), transparent` : "black"
  return `linear-gradient(to right, ${left}, ${right})`
}

export function AdminSidebar() {
  const pathname = usePathname()
  const { data: reviewCount } = useReviewCount()
  const headingId = useId()
  const activeChipRef = useRef<HTMLAnchorElement>(null)
  const chipRowRef = useRef<HTMLElement>(null)
  const [hidden, setHidden] = useState({ start: false, end: false })
  const reviewCountLoaded = reviewCount !== undefined

  const measureChipRow = useCallback(() => {
    const row = chipRowRef.current
    if (!row) return
    const start = row.scrollLeft > 1
    const end = row.scrollLeft + row.clientWidth < row.scrollWidth - 1
    setHidden((previous) => (previous.start === start && previous.end === end ? previous : { start, end }))
  }, [])

  useEffect(() => {
    revealInRow(activeChipRef.current, fadePx)
    measureChipRow()
  }, [pathname, reviewCountLoaded, measureChipRow])

  useEffect(() => {
    const row = chipRowRef.current
    if (!row) return
    const observer = new ResizeObserver(measureChipRow)
    observer.observe(row)
    return () => observer.disconnect()
  }, [measureChipRow])

  const badgeFor = (item: AdminNavItem, className?: string) =>
    item.badge === "review" && !!reviewCount && <ReviewCountBadge count={reviewCount} className={className} />

  return (
    <>
      <aside className="hidden md:block">
        <nav aria-label="Admin" className="sticky top-22 -mx-1 max-h-[calc(100dvh-6.5rem)] space-y-5 overflow-y-auto px-1 pb-1">
          {adminNavGroups.map((group, groupIndex) => (
            <div key={group.title}>
              <p id={`${headingId}-${groupIndex}`} className="mb-1.5 px-3 text-xs font-medium text-muted-foreground">
                {group.title}
              </p>
              <ul aria-labelledby={`${headingId}-${groupIndex}`} className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn("flex min-h-8 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors", navItemState(isActive))}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 break-words">{item.label}</span>
                        {badgeFor(item, "ml-auto")}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <nav
        ref={chipRowRef}
        aria-label="Admin"
        onScroll={measureChipRow}
        style={{ maskImage: chipRowMask(hidden), WebkitMaskImage: chipRowMask(hidden) }}
        className="-mx-1 mb-6 flex items-center gap-1 overflow-x-auto scroll-px-1 px-1 py-1 scrollbar-none md:hidden [&::-webkit-scrollbar]:hidden"
      >
        {adminNavGroups.map((group, groupIndex) => (
          <Fragment key={group.title}>
            {groupIndex > 0 && <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />}
            {group.items.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  ref={isActive ? activeChipRef : undefined}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  onFocus={(event) => revealInRow(event.currentTarget, fadePx)}
                  className={cn(navItemClass, "border", navItemState(isActive))}
                >
                  {item.label}
                  {badgeFor(item)}
                </Link>
              )
            })}
          </Fragment>
        ))}
      </nav>
    </>
  )
}
