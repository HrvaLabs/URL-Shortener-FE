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

const LAST_UPDATED = "October 26, 2026"

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
                cookies, no third-party analytics. Link statistics are daily counts and never store
                visitors&apos; IP addresses.
              </p>
            </div>

            <div className="prose-custom">
              <h2>Who we are</h2>
              <p>
                hrva.cc is a non-commercial hobby project of{" "}
                <a href="https://hrvalabs.net/" target="_blank" rel="noopener noreferrer">HrvaLabs</a>,
                operated by{" "}
                <a href="https://karlo.cc" target="_blank" rel="noopener noreferrer">Karlo Hrvačić</a>,
                who is the data controller within the meaning of
                Art. 4(7) of the General Data Protection Regulation (GDPR). The service is provided
                free of charge and as is — see the <Link href="/terms">Terms of Use</Link>. For
                anything related to your personal data, contact{" "}
                <a href="mailto:privacy@hrvalabs.net">privacy@hrvalabs.net</a>.
              </p>

              <h2>What we collect and why</h2>

              <h3>Account data</h3>
              <p>
                When you register, we process your email address, an optional display name, and your
                password, which is stored only as a salted one-way hash. If you sign in with Google or
                GitHub, we receive your name and email address from that account instead of a
                password. Two-step verification is available whether you sign in with a password,
                Google or GitHub. If you turn it on, we store the shared secret of your authenticator
                app, if you use one, and one-way hashes of your recovery codes, so we can verify your
                codes. If you add a passkey or security key, we store its public key and a few
                details: the name you give it, when it was added and last used, which connection types
                it supports (such as USB or NFC), whether it&apos;s synced between your devices, and its
                model identifier when the device shares one. We also keep the technical data needed to
                check it when you sign in, such as its credential ID, a sign-in counter and the data
                your device sent when you added it. We also store a random identifier that
                links your passkeys to your account. Your fingerprint, face or PIN never leaves your
                device, and hrva.cc never receives it. When you add a passkey, we email you a security
                notice. We also record when your account was created and when you last logged in.
              </p>
              <p>
                Legal basis: performance of a contract (Art. 6(1)(b) GDPR) — this data is required to
                provide your account.
              </p>

              <h3>Link statistics (visitors who open short links)</h3>
              <p>
                When someone opens a short link, hrva.cc adds to that link&apos;s counts for the day.
                For each link and day it keeps only totals: clicks, unique visitors, clicks from bots
                and link previews, and how many clicks came from each referring site&apos;s domain
                (for example t.co), each country, each device type (mobile, tablet or desktop), and
                each browser and operating system family. The country comes from Cloudflare, which
                carries our traffic; we don&apos;t look up locations ourselves. Full addresses of
                referring pages, full browser identifiers and IP addresses are never stored, and
                nothing is recorded about an individual click. Short links set no cookies and run no
                scripts.
              </p>
              <p>
                To count unique visitors, the visitor&apos;s IP address and browser identifier are
                combined with the link and a random key that changes every day, and turned into a
                one-way hash. The hashes and the day&apos;s key are kept only in Redis, never in our
                database, and expire a few hours after the day ends. Without the key the hashes
                can&apos;t be traced back to anyone, and because the key changes every day and the
                link is part of the hash, the same visitor can&apos;t be followed across days or
                across links. Link owners see only the daily totals.
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
                We send transactional emails only: address verification, password reset, security
                notices (for example when a passkey is added to your account), and notifications about
                your expiring links. We keep a log of emails sent to operate and
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
                database until you disconnect the app in Settings → Connected apps or it goes
                unused for 30 days. We don&apos;t store the URLs and messages the app sends us
                beyond the links it creates.
              </p>
              <p>
                To limit abuse, anonymous links created through the MCP server and new AI app
                registrations are rate-limited per network. For this we keep a hash of your IP
                address (for IPv6, of its network prefix) in our cache for at most an hour. The
                plain IP address is not stored.
              </p>
              <p>
                Legal basis: performance of a contract (Art. 6(1)(b) GDPR) — this is required to
                provide the connection you requested.
              </p>

              <h2>Keeping links safe</h2>
              <p>
                To protect visitors from phishing, malware and scams, we check where links lead when
                they are created or changed, and again later.
              </p>
              <ul>
                <li>
                  <strong>Blocklists</strong> — destinations are checked against public blocklists of
                  harmful domains and links. We download these lists and store them on hrva.cc&apos;s
                  own server, so this check sends nothing to anyone.
                </li>
                <li>
                  <strong>Domain age</strong> — to learn when a destination&apos;s domain was
                  registered, we send the domain name to the domain registries (RDAP). Only the
                  domain name is sent.
                </li>
                <li>
                  <strong>Spamhaus</strong> — when this check is enabled, the domain name may be
                  looked up in Spamhaus&apos;s domain blocklist through DNS. Only the domain name is
                  sent.
                </li>
                <li>
                  <strong>Google Safe Browsing</strong> — receives the destination URL, as described
                  under <em>Who else receives data</em>.
                </li>
                <li>
                  <strong>Redirects</strong> — the hrva.cc server may request a destination to follow
                  its redirects and check where they lead. The destination&apos;s server sees a request
                  from hrva.cc, never from the visitor, and no visitor data is sent.
                </li>
              </ul>
              <p>
                Links that lead to known or very likely harmful sites are refused or disabled
                automatically. Automated checks can also flag a link for review, or mark an account
                as a possible scammer. The admin reviews flagged links and decides what happens to
                them, and the checks never block an account on their own.
              </p>
              <p>
                The admin can also moderate through the hrva.cc MCP connector in an AI app. The
                connector only receives masked user data, such as a partly hidden email address, and
                never IP addresses or visit details.
              </p>
              <p>
                If you <Link href="/report">report a link</Link>, we store the short link, the
                category and the details you write, and nothing about you beyond a rate-limit
                counter for your network, which expires after an hour. Reports are also posted to
                the admin&apos;s Discord channel, as described under <em>Who else receives data</em>.
              </p>
              <p>
                Legal basis: legitimate interest (Art. 6(1)(f) GDPR) — protecting visitors and the
                service from abuse.
              </p>

              <h2>Who else receives data</h2>
              <ul>
                <li>
                  <strong>Google Sign-In</strong> — only if you choose to log in with Google; Google
                  acts as your identity provider under its own privacy policy.
                </li>
                <li>
                  <strong>Google Safe Browsing</strong> — destination URLs you shorten, and the
                  addresses they redirect to, are checked against Google&apos;s threat database to
                  protect visitors from malicious sites. Only the URL is sent, never information
                  about you or your visitors.
                </li>
                <li>
                  <strong>Domain registries and Spamhaus</strong> — receive only the domain name of a
                  destination, as described under <em>Keeping links safe</em>.
                </li>
                <li>
                  <strong>Cloudflare</strong> — delivers the web application and short links
                  (hosting/CDN). Your IP address reaches Cloudflare as part of normal traffic
                  delivery, and Cloudflare tells us which country it belongs to, which we keep only
                  as a daily count.
                </li>
                <li>
                  <strong>Discord</strong> — so the admin sees moderation events quickly, hrva.cc
                  posts short alerts to a private Discord channel that only the admin reads: when a
                  link is flagged for review, reported by a visitor or blocked automatically, when
                  someone signs up, and when a blocklist fails to load or loads again. An alert can
                  include the short link, the domain it points to (never the full address), the
                  owner&apos;s account number (not their email address or name), the reasons for the
                  flag or block, and for a visitor report its category and up to 200 characters
                  of the details, with anything that looks like an email or IP address removed. A
                  sign-up alert shows only the account number and whether the account uses email,
                  Google or GitHub. Discord Inc., based in the United States, processes these
                  messages under its own terms, and they stay in the channel until the admin
                  deletes them.
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
              </ul>
              <p>
                We do not sell personal data and we do not share it with anyone beyond the
                processors listed above.
              </p>
              <p>
                Separately, if you connect an AI app to your account, that app receives the results
                of the tools it uses (short links, link lists and visit stats). It is not our
                processor; it handles that data under its own terms.
              </p>

              <h2>How long we keep data</h2>
              <ul>
                <li>
                  <strong>Unique-visitor hashes and the daily key</strong> — kept only in Redis and
                  deleted a few hours after the day ends.
                </li>
                <li>
                  <strong>Rate-limit counters</strong> — hold a hashed IP address and expire within
                  an hour.
                </li>
                <li>
                  <strong>Account data</strong> — kept until you delete your account; unused
                  accounts are deactivated automatically after a period of inactivity.
                </li>
                <li>
                  <strong>Passkeys</strong> — until you remove them or delete your account.
                </li>
                <li>
                  <strong>Password reset tokens</strong> — deleted as soon as they expire.
                </li>
                <li>
                  <strong>Your links and their statistics</strong> — kept while your account exists;
                  deleting a link also deletes its daily counts.
                </li>
                <li>
                  <strong>Connected-app token records</strong>{" "}
                  — deleted when you disconnect the app in Settings → Connected apps, or automatically
                  once the app&apos;s refresh token has gone unused for 30 days.
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
                within one month. You can also download a copy of your data yourself in Settings → Your
                data; the export includes your passkeys&apos; names, types, sync state and dates, never key
                material.
                You also have the right to lodge a complaint with the Croatian
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
