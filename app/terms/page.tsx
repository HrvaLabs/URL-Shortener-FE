import Link from "next/link"
import type { Metadata } from "next"
import { pageMetadata } from "@/lib/seo"
import { CONTENT_UPDATED, formatContentDate } from "@/lib/content-dates"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = pageMetadata({
  title: "Terms of Use",
  description:
    "Terms of use for hrva.cc: a free, non-commercial URL shortener provided as is, without warranties.",
  path: "/terms",
})

const LAST_UPDATED = formatContentDate(CONTENT_UPDATED["/terms"])

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">Terms of Use</h1>
            <p className="mt-3 text-sm tabular-nums text-muted-foreground">Last updated: {LAST_UPDATED}</p>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: hrva.cc is a free, non-commercial hobby project. It is provided as is,
                with no guarantees. You are responsible for the links you create and for what you
                do with the service.
              </p>
            </div>

            <div className="prose-custom">
              <h2>The service</h2>
              <p>
                hrva.cc is a URL-shortening service and a hobby project of{" "}
                <a href="https://hrvalabs.net/" target="_blank" rel="noopener noreferrer">HrvaLabs</a>,
                operated by{" "}
                <a href="https://karlo.cc" target="_blank" rel="noopener noreferrer">Karlo Hrvačić</a>.
                It is offered free of charge, for personal and
                non-critical use. By using the service or creating an account you accept these
                terms.
              </p>

              <h2>No warranty, no liability</h2>
              <p>
                The service is provided <strong>as is</strong> and <strong>as available</strong>,
                without warranties of any kind — no guaranteed uptime, durability of links, accuracy
                of statistics, or fitness for any particular purpose. Links, accounts, or the entire
                service may change, break, or be discontinued at any time without notice. To the
                maximum extent permitted by law, the operator accepts no liability for any damage
                arising from the use of, or inability to use, the service. Do not rely on hrva.cc
                for anything critical.
              </p>

              <h2>Your responsibility</h2>
              <p>
                You are solely responsible for the URLs you shorten, the content they lead to, and
                anywhere you share them. Shortening a URL does not change who is responsible for the
                destination content — that remains you and the destination site, never the operator
                of this service.
              </p>

              <h2>Acceptable use</h2>
              <p>It is not allowed to use the service to link to or facilitate:</p>
              <ul>
                <li>malware, phishing, or other fraudulent or harmful content,</li>
                <li>content that is illegal in Croatia or the European Union,</li>
                <li>spam or abusive automated traffic that degrades the service for others.</li>
              </ul>
              <p>
                Destination URLs are screened with Google Safe Browsing and public blocklists, and
                links or accounts that violate these rules may be disabled or deleted at any time,
                without notice and at the operator&apos;s sole discretion.
              </p>

              <h2>Bio pages</h2>
              <p>
                A bio page is public. Don&apos;t use it to pretend to be another person, a company or
                hrva.cc, to collect passwords or payment details, or for anything the acceptable use
                rules above forbid. Handles that imitate a person, a brand or hrva.cc may be refused or
                taken back. The operator may hide a bio page or revoke its handle at any time, with or
                without notice; you&apos;ll see the reason in the editor.
              </p>

              <h2>Custom domains</h2>
              <p>
                You may only use a domain you own or are allowed to use. hrva.cc may refuse an application,
                and may turn off or remove a custom domain that&apos;s used for abuse, phishing, spam or
                anything the acceptable use rules forbid. Custom domains are free and come with no
                guarantee: we may limit how many we offer or stop offering them.
              </p>

              <h2>Reporting abuse</h2>
              <p>
                To report a short link that leads to phishing, malware, scams or spam, use the{" "}
                <Link href="/report">report form</Link> (it also takes a bio page, as hrva.cc/@name) or email{" "}
                <a href="mailto:abuse@hrva.cc">abuse@hrva.cc</a> with the short link. The operator may
                disable links that lead to phishing, malware, scams or spam, and may block the accounts
                that create them.
              </p>

              <h2>Accounts</h2>
              <p>
                Keep your credentials to yourself; you are responsible for activity under your
                account. Unused accounts may be deactivated automatically. You can delete your
                account at any time, which removes your data as described in the{" "}
                <Link href="/privacy">Privacy Policy</Link>.
              </p>

              <h2>Changes</h2>
              <p>
                These terms may change as the project evolves. The current version is always on this
                page, with the date above. Continued use of the service after a change means you
                accept the updated terms.
              </p>

              <h2>Contact</h2>
              <p>
                Questions about these terms:{" "}
                <a href="mailto:privacy@hrvalabs.net">privacy@hrvalabs.net</a>.
              </p>
            </div>
          </article>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
