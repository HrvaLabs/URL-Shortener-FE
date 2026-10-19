import Link from "next/link"
import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Privacy Policy — hrva.cc",
  description:
    "How hrva.cc handles your data: what we collect, why, how long we keep it, and your rights under the GDPR.",
  alternates: { canonical: "https://app.hrva.cc/privacy" },
  openGraph: {
    url: "https://app.hrva.cc/privacy",
    title: "Privacy Policy — hrva.cc",
    description:
      "How hrva.cc handles your data: what we collect, why, how long we keep it, and your rights under the GDPR.",
  },
}

const LAST_UPDATED = "June 10, 2026"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <div className="container py-16 sm:py-20">
          <article className="mx-auto max-w-3xl">
            <h1 className="font-display text-3xl leading-tight sm:text-4xl">Privacy Policy</h1>
            <p className="mt-3 text-sm tabular-nums text-muted-foreground">Last updated: {LAST_UPDATED}</p>

            <div className="mt-8 rounded-xl border bg-muted/40 p-5">
              <p className="leading-7 text-foreground">
                In short: we collect only what the service needs to work. No ads, no tracking
                cookies, no third-party analytics. Visitor IP addresses are hashed immediately and
                deleted within 48 hours.
              </p>
            </div>

            <div className="prose-custom">
              <h2>Who we are</h2>
              <p>
                hrva.cc is a non-commercial hobby project of{" "}
                <a href="https://hrvalabs.net/" target="_blank" rel="noopener noreferrer">HrvaLabs</a>,
                operated by Karlo Hrvačić, who is the data controller within the meaning of
                Art. 4(7) of the General Data Protection Regulation (GDPR). The service is provided
                free of charge and as is — see the <Link href="/terms">Terms of Use</Link>. For
                anything related to your personal data, contact{" "}
                <a href="mailto:privacy@hrvalabs.net">privacy@hrvalabs.net</a>.
              </p>

              <h2>What we collect and why</h2>

              <h3>Account data</h3>
              <p>
                When you register, we process your email address, an optional display name, and your
                password, which is stored only as a salted one-way hash. If you sign in with Google,
                we receive your name and email address from your Google account instead of a
                password. If you enable two-factor authentication, we store the shared secret and
                recovery codes needed to verify your codes. We also record when your account was
                created and when you last logged in.
              </p>
              <p>
                Legal basis: performance of a contract (Art. 6(1)(b) GDPR) — this data is required to
                provide your account.
              </p>

              <h3>Link statistics (visitors who open short links)</h3>
              <p>
                When someone opens a short link, we count the visit and check whether it is a unique
                visitor. To do this, the visitor&apos;s IP address is hashed with a salted one-way
                function the moment it is received — the plain IP address is never written to our
                database. Each hashed record is used for unique-visitor detection for 2 hours and is
                permanently deleted within 48 hours. Link owners only ever see aggregate numbers
                (visit counts and daily unique visitors), never anything about an individual visitor.
              </p>
              <p>
                Legal basis: legitimate interest (Art. 6(1)(f) GDPR) — providing link owners with
                basic, privacy-preserving usage statistics and protecting the service from abuse.
              </p>

              <h3>Storage in your browser</h3>
              <p>
                After you log in, we keep a single authentication token in your browser&apos;s{" "}
                <em>localStorage</em> so you stay signed in. It is strictly necessary to provide the
                service you requested, which is why no consent banner is required for it (Art. 5(3)
                of the ePrivacy Directive, implemented in Croatia by the Electronic Communications
                Act). We set no tracking cookies and use no analytics or advertising scripts. Fonts
                are self-hosted — your browser does not contact third-party font services.
              </p>

              <h3>Emails we send</h3>
              <p>
                We send transactional emails only: address verification, password reset, and
                notifications about your expiring links. We keep a log of emails sent to operate and
                troubleshoot delivery. We do not send marketing email.
              </p>

              <h3>Security and audit logs</h3>
              <p>
                We keep internal audit logs of security-relevant events (such as logins and
                administrative actions) to protect the service and its users. Legal basis:
                legitimate interest (Art. 6(1)(f) GDPR).
              </p>

              <h3>AI connectors</h3>
              <p>
                If you connect an AI app to your account through the hrva.cc MCP server, we store the
                app&apos;s registration and your authorization of it (token records) in the hrva.cc
                database until you disconnect the app in Settings → Connected apps or the
                authorization lapses. We don&apos;t store the URLs and messages the app sends us
                beyond the links it creates.
              </p>

              <h2>Who else receives data</h2>
              <ul>
                <li>
                  <strong>Google Sign-In</strong> — only if you choose to log in with Google; Google
                  acts as your identity provider under its own privacy policy.
                </li>
                <li>
                  <strong>Google Safe Browsing</strong> — destination URLs you shorten are checked
                  against Google&apos;s threat database to protect visitors from malicious sites. Only
                  the URL is sent, never information about you or your visitors.
                </li>
                <li>
                  <strong>Cloudflare</strong> — delivers the web application (hosting/CDN). Your IP
                  address reaches Cloudflare as part of normal traffic delivery.
                </li>
                {/* TODO: name the email delivery provider (and its location/safeguards) */}
                <li>
                  <strong>Email delivery</strong> — transactional emails are sent via
                  [email provider].
                </li>
                {/* TODO: name the backend hosting provider and hosting location */}
                <li>
                  <strong>Backend hosting</strong> — the API and database are hosted by
                  [hosting provider] in [location].
                </li>
                <li>
                  <strong>AI apps you connect</strong> — an AI app you connect to your account
                  receives the results of the tools it uses (short links, link lists and visit stats)
                  and handles them under its own terms.
                </li>
              </ul>
              <p>
                We do not sell personal data and we do not share it with anyone beyond the
                processors listed above.
              </p>

              <h2>How long we keep data</h2>
              <ul>
                <li>
                  <strong>Hashed visitor IPs</strong> — deleted within 48 hours of the visit.
                </li>
                <li>
                  <strong>Account data</strong> — kept until you delete your account; unused
                  accounts are deactivated automatically after a period of inactivity.
                </li>
                <li>
                  <strong>Password reset tokens</strong> — deleted as soon as they expire.
                </li>
                <li>
                  <strong>Your links and their statistics</strong> — kept while your account exists;
                  deleting a link also deletes its visit records.
                </li>
                {/* TODO: confirm email/audit log retention period with the backend */}
                <li>
                  <strong>Email and audit logs</strong> — kept for [retention period].
                </li>
              </ul>

              <h2>Your rights</h2>
              <p>
                Under the GDPR you can request access to, correction of, or deletion of your
                personal data, ask us to restrict or object to processing, and receive your data in
                a portable format (Arts. 15–21 GDPR). Write to{" "}
                <a href="mailto:privacy@hrvalabs.net">privacy@hrvalabs.net</a> and we will respond
                within one month. You also have the right to lodge a complaint with the Croatian
                Personal Data Protection Agency (
                <a href="https://azop.hr" target="_blank" rel="noopener noreferrer">AZOP</a>) or
                your local supervisory authority.
              </p>

              <h2>Changes to this policy</h2>
              <p>
                If we change how we process personal data, we will update this page and the date at
                the top. Substantial changes affecting registered users will also be announced by
                email or in the app.
              </p>

              <h2>Contact</h2>
              <p>
                Questions about privacy at hrva.cc:{" "}
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
