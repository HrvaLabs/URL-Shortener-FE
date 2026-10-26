import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { PublicStats } from "@/components/public-stats"

const description =
  "Site-wide totals for hrva.cc: active links, clicks, harmful links blocked and how fast reports are reviewed."

export const metadata: Metadata = {
  title: "hrva.cc in numbers",
  description,
  alternates: { canonical: "https://app.hrva.cc/stats" },
  openGraph: {
    url: "https://app.hrva.cc/stats",
    title: "hrva.cc in numbers — hrva.cc",
    description,
  },
}

export default function StatsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <PublicStats />
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
