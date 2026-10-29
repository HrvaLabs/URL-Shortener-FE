import Link from "next/link"
import type { ReactNode } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { cn } from "@/lib/utils"

interface StaticPageProps {
  title: ReactNode
  parent?: { href: string; label: string }
  lead?: ReactNode
  wide?: boolean
  children: ReactNode
  after?: ReactNode
}

export function StaticPage({ title, parent, lead, wide = false, children, after }: StaticPageProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className={cn("mx-auto", wide ? "max-w-4xl" : "max-w-3xl")}>
            {parent && (
              <p className="text-sm text-muted-foreground">
                <Link href={parent.href} className="transition-colors hover:text-foreground">{parent.label}</Link>
              </p>
            )}
            <h1 className={cn("font-display text-3xl leading-tight sm:text-4xl", parent && "mt-2")}>{title}</h1>
            {lead && <div className="mt-4 text-lg leading-relaxed text-muted-foreground">{lead}</div>}
            {children}
          </article>
        </div>
      </main>

      <SiteFooter />
      {after}
    </div>
  )
}

export function SummaryBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-8 rounded-xl border bg-muted/40 p-5">
      <p className="leading-7 text-foreground">{children}</p>
    </div>
  )
}
