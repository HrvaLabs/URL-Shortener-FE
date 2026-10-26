import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { QR_SCANS_START, analyticsDay } from "@/lib/analytics"

const description = "What the public numbers mean, and how hrva.cc tells QR scans from direct clicks."

export const metadata: Metadata = {
  title: "hrva.cc in numbers: help",
  description,
  alternates: { canonical: "https://app.hrva.cc/help/stats" },
  openGraph: {
    url: "https://app.hrva.cc/help/stats",
    title: "hrva.cc in numbers: help — hrva.cc",
    description,
  },
}

const qrScansStart = analyticsDay(QR_SCANS_START).toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
})

export default function StatsHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">hrva.cc in numbers</h1>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: the hrva.cc in numbers page shows site-wide totals for the last 30 full days. Link
                analytics show QR scans apart from direct clicks.
              </p>
            </div>

            <div className="prose-custom">
              <h2 id="numbers">What the public numbers mean</h2>
              <p>
                <strong>Active links</strong>: how many hrva.cc links work right now.
              </p>
              <p>
                <strong>Links created</strong>: new links made in the last 30 full days.
              </p>
              <p>
                <strong>Clicks</strong>: visits to hrva.cc links in the last 30 full days. Bots and link
                previews aren&apos;t counted. The chart shows clicks per day and ends yesterday, and the
                numbers are refreshed every hour.
              </p>
              <p>
                <strong>Harmful links blocked</strong>: the number counts every link that is still blocked,
                since hrva.cc started. The line under it says how many were blocked in the last 30 days.
                Links refused before they were created aren&apos;t counted, because they were never saved.
              </p>
              <p>
                <strong>Visitor reports handled</strong>: reported links a person reviewed in the last 30
                days. Anyone can <Link href="/report">report a link</Link>.
              </p>
              <p>
                <strong>Average review time</strong>: how long it took, on average, from a link being
                flagged or reported to a decision, for reviews finished in the last 30 days. Without any, it
                says <strong>No reviews in the last 30 days</strong>.
              </p>
              <p>
                <strong>Blocklists in use</strong>: the blocklists hrva.cc checks links against. Each row
                gives the list&apos;s name, whether it blocks links (<strong>Blocks links</strong>) or sends
                them for review (<strong>Sends links for review</strong>), and how many entries it has.
              </p>
              <p>
                Nothing on the page is about a single link, person, country or referrer.{" "}
                <Link href="/stats">Open hrva.cc in numbers</Link>.
              </p>

              <h2 id="qr-scans">QR scans and direct clicks</h2>
              <ol>
                <li>
                  Get a QR code from hrva.cc: in <strong>Dashboard</strong>, select{" "}
                  <strong>Show QR code</strong> next to a link, then <strong>PNG</strong> or{" "}
                  <strong>SVG</strong>. The home page and the create dialog show one too.
                </li>
                <li>
                  The code opens your short link with <code className="whitespace-nowrap">?qr</code> added,
                  such as <code className="[overflow-wrap:anywhere]">hrva.cc/menu?qr</code>. hrva.cc
                  removes <code className="whitespace-nowrap">?qr</code> before sending the visitor on, so
                  the destination never sees it.
                </li>
                <li>
                  Open the link&apos;s analytics (<strong>View stats</strong>) and look at{" "}
                  <strong>QR scans and direct clicks</strong>.
                </li>
              </ol>
              <p>
                QR codes made before {qrScansStart} don&apos;t carry the marker, so their scans count as
                direct. To count scans from a printed code, download it again and replace the print.
              </p>
              <p>Codes made by other QR generators, and scans of password-protected links, count as direct.</p>
              <p>Bots and link previews are never counted as scans or clicks.</p>

              <h2 id="privacy">Privacy</h2>
              <p>
                QR scans are a daily total per link, like referrers and countries. Nothing about the person
                scanning is stored. The <Link href="/privacy">Privacy Policy</Link> describes everything
                hrva.cc stores.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
