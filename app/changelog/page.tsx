"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PageMeta } from "@/components/page-meta"
import { AlertCircle } from "lucide-react"
import { getBackendOrigin } from "@/lib/utils"

interface ChangelogItem {
  title: string
  icon: string
  description?: string
  items: string[]
}

interface Release {
  version: string
  date?: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "outline"
  summary: string
  sections: ChangelogItem[]
}

interface ChangelogData {
  releases: Release[]
}

export default function ChangelogPage() {
  const [data, setData] = useState<ChangelogData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${getBackendOrigin()}/api/changelog`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load changelog (${res.status})`)
        return res.json()
      })
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <PageMeta title="Changelog — hrva.cc" description="What's new in hrva.cc URL shortener." />
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">Changelog</h1>
            <p className="mt-3 text-lg text-muted-foreground">Every release, feature, and fix for hrva.cc.</p>

            {error && (
              <div
                role="alert"
                className="mt-10 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span className="text-foreground">Failed to load changelog: {error}</span>
              </div>
            )}

            {!data && !error && (
              <div className="mt-10 divide-y border-y" aria-hidden="true">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="grid gap-6 py-10 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-10">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="space-y-3">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {data && (
              <ol className="mt-10 divide-y border-y">
                {data.releases.map((release) => (
                  <li
                    key={release.version}
                    className="grid gap-6 py-10 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-10"
                  >
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:flex-col md:items-start">
                      <h2 className="font-mono text-lg font-medium">{release.version}</h2>
                      {release.date && (
                        <p className="text-sm tabular-nums text-muted-foreground">{release.date}</p>
                      )}
                      {release.badge && (
                        <Badge variant={release.badgeVariant ?? "outline"}>{release.badge}</Badge>
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-lg leading-relaxed text-foreground">{release.summary}</p>

                      <div className="mt-8 space-y-8">
                        {release.sections.map((section) => (
                          <section key={section.title}>
                            <h3 className="font-semibold">{section.title}</h3>
                            {section.description && (
                              <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                            )}
                            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-muted-foreground">
                              {section.items.map((item) => (
                                <li key={item} className="pl-1 leading-7 text-foreground/80">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </section>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            {data && (
              <div className="mt-10 space-y-1 text-xs text-muted-foreground">
                <p className="font-mono">{data.releases.length} releases · 1 URL shortener</p>
                <p>hrva.cc — &#x1F648; shaped by you.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
