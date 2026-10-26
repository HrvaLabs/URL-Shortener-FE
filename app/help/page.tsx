import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

const description = "Short guides to hrva.cc features."

export const metadata: Metadata = {
  title: "Help",
  description,
  alternates: { canonical: "https://app.hrva.cc/help" },
  openGraph: {
    url: "https://app.hrva.cc/help",
    title: "Help — hrva.cc",
    description,
  },
}

const guides = [
  {
    href: "/help/utm",
    title: "Campaign tracking (UTM)",
    description: "Add UTM tags to a link so your analytics tool can see where visitors came from.",
  },
  {
    href: "/help/passkeys",
    title: "Passkeys and security keys",
    description: "Sign in without a password, and use a passkey or security key as your second step.",
  },
  {
    href: "/help/stats",
    title: "hrva.cc in numbers",
    description: "What the public numbers mean: active links, clicks, harmful links blocked and review times.",
  },
  {
    href: "/help/stats#qr-scans",
    title: "QR scans and direct clicks",
    description: "How hrva.cc counts scans of its QR codes, and why older printed codes count as direct.",
  },
]

export default function HelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">Help</h1>
            <p className="mt-3 text-muted-foreground">{description}</p>

            <ul className="mt-8 divide-y rounded-xl border bg-card">
              {guides.map((guide) => (
                <li key={guide.href}>
                  <Link
                    href={guide.href}
                    className="group flex items-center justify-between gap-4 p-5 transition-colors hover:bg-muted/40"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold">{guide.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{guide.description}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
