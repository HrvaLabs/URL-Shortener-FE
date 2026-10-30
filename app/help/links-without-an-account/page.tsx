import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HelpBreadcrumbs } from "@/components/json-ld"
import { pageMetadata } from "@/lib/seo"

const description =
  "What happens when you make a short link on hrva.cc without signing in, and when making them is paused."

export const metadata: Metadata = pageMetadata({ title: "Links without an account", description, path: "/help/links-without-an-account" })

export default function LinksWithoutAnAccountHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">Links without an account</h1>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: you can paste a long URL on the home page and get a short link without signing
                in. Such a link has no stats page and no dashboard. Making these links is sometimes
                paused, and the forms say so before you type.
              </p>
            </div>

            <div className="prose-custom">
              <h2 id="what-you-get">What you get</h2>
              <p>
                Paste a long URL into the form on the <Link href="/">home page</Link> and select{" "}
                <strong>Shorten</strong>. You get a short link on hrva.cc that opens your URL, and a QR
                code for it. The <Link href="/qr">QR code generator</Link> and the{" "}
                <Link href="/utm">UTM builder</Link> can make the same kind of link.
              </p>

              <h2 id="what-you-dont-get">What you don&apos;t get</h2>
              <p>
                A link made without an account isn&apos;t in any dashboard, so it has no stats page. Custom
                aliases, visit limits, expiry dates and analytics come with a free account, which you can{" "}
                <Link href="/register">create</Link> whenever new accounts are open. When hrva.cc sets an end date
                or a visit limit for these links, the form says so.
              </p>

              <h2 id="limits">Limits</h2>
              <p>
                Each network can make a limited number of links without an account per hour. hrva.cc can
                also give these links an end date or a visit limit. When it does, the form says so, for
                example &quot;Links made without an account stop working after 30 days.&quot; You can&apos;t
                change these in the forms. With an account you choose your own.
              </p>

              <h2 id="human-check">The human check</h2>
              <p>
                Before a link is made without an account, a Cloudflare Turnstile check makes sure a person is using the
                page. Usually you see nothing; sometimes you&apos;re asked to tick a box. It processes browser and network
                signals for this check only, and hrva.cc stores nothing from it. Signed-in users, API keys and the MCP
                connector are never checked.
              </p>

              <h2 id="checks">Safety checks</h2>
              <p>
                Links made without an account are checked too, and only the admin sees the result. The{" "}
                <Link href="/privacy">Privacy Policy</Link> describes what hrva.cc keeps about them.
              </p>

              <h2 id="warning-page">Warning page</h2>
              <p>
                Some links made without an account open an hrva.cc page first instead of going straight to the
                destination. It shows the full address the link goes to, a Continue button and a{" "}
                <Link href="/report">Report this link</Link> link. It appears when the destination&apos;s domain
                was registered recently or looks machine-made. The page has no scripts and sets no cookies, and
                showing it counts as the click.
              </p>

              <h2 id="paused">When it&apos;s paused</h2>
              <p>
                Making links without an account is sometimes paused, for example during a spam wave. The
                forms then say so before you type. Links made earlier keep working.
              </p>
              <p>
                While it&apos;s paused, <Link href="/login">sign in</Link> to make links. The QR code
                generator and the UTM builder still make QR codes and tagged links in your browser; only
                the step that shortens a link is paused. If new accounts are paused too, the sign-up page
                says so.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
      <HelpBreadcrumbs name="Links without an account" path="/help/links-without-an-account" />
    </div>
  )
}
