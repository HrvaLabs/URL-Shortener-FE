import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HelpBreadcrumbs } from "@/components/json-ld"
import { pageMetadata } from "@/lib/seo"

const description = "How random aliases, visit limits, query strings and API keys work on hrva.cc."

export const metadata: Metadata = pageMetadata({ title: "Short links and API keys", description, path: "/help/links" })

export default function LinksHelpPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-muted-foreground">
              <Link href="/help" className="transition-colors hover:text-foreground">Help</Link>
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight sm:text-4xl">Short links and API keys</h1>

            <div className="prose-custom">
              <h2 id="aliases">Random aliases</h2>
              <p>
                When you don&apos;t choose an alias, hrva.cc picks one from letters and digits without 0, O, 1, l and
                I, so it&apos;s easier to read out and type. Aliases are case-sensitive: hrva.cc/Ab3 and hrva.cc/ab3 are
                different links. Links made before this rule keep their aliases.
              </p>

              <h2 id="visit-limits">Visit limits</h2>
              <p>
                A visit limit counts every click on the link, repeat clicks from the same person included. Bots and
                link previews don&apos;t count, and neither do HEAD requests from link checkers. Each click is counted
                before the visitor is sent on, so clicks at the same moment can&apos;t go past the limit. Once the limit
                is reached, the link stops working and says so.
              </p>
              <p>
                Your dashboard shows how many clicks have counted, for example &quot;3 of 5 clicks used&quot;. The
                Visits number counts unique visitors per day, so it can be lower than the clicks used.
              </p>

              <h2 id="query-strings">Query strings</h2>
              <p>
                A short link passes its query string on to the destination. hrva.cc/abc?ref=mail opens the
                destination with ref=mail added after the destination&apos;s own parameters, and before its #fragment,
                which stays. When both have a parameter with the same name, the destination&apos;s value is used.
                hrva.cc&apos;s own qr marker, which its QR codes add, isn&apos;t passed on. Only the query is added: the
                site the link opens never changes. A link with a password opens its destination as saved.
              </p>

              <h2 id="api-keys">API keys</h2>
              <p>
                Revoking an API key is final. A revoked or expired key can&apos;t be turned back on or given a new
                expiry; it can only be deleted. Make a new key on your{" "}
                <Link href="/dashboard/api-keys">API keys</Link> page instead. The{" "}
                <Link href="/developers">API quickstart</Link> shows how to use one.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
      <HelpBreadcrumbs name="Short links and API keys" path="/help/links" />
    </div>
  )
}
