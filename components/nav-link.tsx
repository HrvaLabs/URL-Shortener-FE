"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavLinkProps = Omit<React.ComponentPropsWithoutRef<typeof Link>, "href"> & { href: string }

export function useIsCurrentPage(href: string) {
  const pathname = usePathname()
  return !href.includes("#") && pathname === href
}

export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(({ href, ...props }, ref) => {
  const current = useIsCurrentPage(href)
  return <Link ref={ref} href={href} aria-current={current ? "page" : undefined} {...props} />
})
NavLink.displayName = "NavLink"
