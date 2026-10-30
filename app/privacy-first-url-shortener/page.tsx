import Link from "next/link"
import type { Metadata } from "next"
import { JsonLdScript, pageBreadcrumbs, techArticle } from "@/components/json-ld"
import { StaticPage } from "@/components/static-page"
import { CONTENT_UPDATED } from "@/lib/content-dates"
import { pageMetadata } from "@/lib/seo"
import { SALT_GRACE_SOURCE, VISITOR_HASH_SOURCE } from "@/lib/source-links"

const path = "/privacy-first-url-shortener"
const title = "URL shortener without tracking: how hrva.cc counts visits"
const description =
  "A URL shortener without tracking: hrva.cc keeps daily totals, never stores visitors' IP addresses, and counts unique visitors with a one-way hash under a key that changes every day."

export const metadata: Metadata = pageMetadata({ title, description, path, absolute: true })

const articleJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    techArticle({ path, headline: title, description, published: "2026-10-29", modified: CONTENT_UPDATED[path] }),
    pageBreadcrumbs("URL shortener without tracking", path),
  ],
}

const faqs = [
  {
    question: "Does hrva.cc use cookies?",
    answer:
      "Short links set no cookies and run no scripts: your browser is sent straight on. The web app sets no tracking cookies and loads no analytics or advertising scripts; what it keeps in your browser is only what signing in and the app need to work.",
  },
  {
    question: "Can the person who made a link see who clicked it?",
    answer:
      "No. Link owners see daily totals: how many clicks and unique visitors a link had, and how many came from each referring site, country, device type, browser and operating system. Nothing about a single click is recorded, so there is nothing to show.",
  },
  {
    question: "Is it really free?",
    answer:
      "Yes. There are no paid plans and no ads, and personal data is not sold. The code is public under the GPL-3.0 licence.",
  },
  {
    question: "Where is the data kept?",
    answer:
      "The API, its database and its cache run on Oracle Cloud in Frankfurt, Germany (EU). Traffic reaches them through Cloudflare, which also tells hrva.cc which country a click came from.",
  },
]

export default function PrivacyFirstPage() {
  return (
    <StaticPage title="A URL shortener that counts visits without tracking visitors" after={<JsonLdScript data={articleJsonLd} />}>
      <div className="mt-8 rounded-xl border bg-muted/40 p-5">
        <p className="leading-7 text-foreground">
          hrva.cc is a free URL shortener that counts visits without tracking the people who make them. Its source code
          is public on GitHub. When someone opens a hrva.cc short link, that link&apos;s counts for the day go up: clicks,
          unique visitors, clicks from bots, and how many clicks came from each referring site&apos;s domain, country,
          device type, browser and operating system. Nothing is recorded about the individual click. Unique visitors are counted with a one-way hash of the
          visitor&apos;s IP address and browser identifier, the link and a random key that changes every day. The hashes
          and the key are kept only in Redis and expire a few hours after the day ends. Visitors&apos; IP addresses are
          never stored, and short links set no cookies and run no scripts.
        </p>
      </div>

      <div className="prose-custom">
        <h2 id="what-a-shortener-sees">What any URL shortener can see when someone clicks</h2>
        <p>
          A short link works by asking the shortener&apos;s server where to go. That request carries what every web
          request carries: the visitor&apos;s IP address, a browser identifier (the user agent), usually the page the
          visitor came from, and the time. Shorteners differ in what they keep of it, for how long, and whether they tie
          clicks together into a profile of a person.
        </p>
        <p>
          hrva.cc runs behind Cloudflare, which delivers its traffic and tells it which country a request came from.
          hrva.cc doesn&apos;t look up locations itself.
        </p>

        <h2 id="what-is-kept">What hrva.cc keeps, and what it never stores</h2>
        <h3>Kept as daily totals for each link</h3>
        <ul>
          <li>Clicks, and unique visitors (each visitor once a day)</li>
          <li>Clicks from bots and link previews, counted apart</li>
          <li>Clicks per referring site&apos;s domain, such as t.co, not the full address of the page</li>
          <li>Clicks per country, device type (mobile, tablet or desktop), browser family and operating system family</li>
          <li>Whether a click came from a QR code made by hrva.cc</li>
        </ul>
        <h3>Kept for an hour or a few hours, then deleted</h3>
        <ul>
          <li>
            The one-way hashes used to count unique visitors, and the random key of the day. Both live only in Redis,
            never in the database, and expire a few hours after the day ends.
          </li>
          <li>
            Rate-limit counters, such as the one that slows down password guessing on a protected link. They hold a
            hashed IP address, never the plain one, and expire within an hour.
          </li>
          <li>
            For links made without an account, the check behind the phishing-wave alert keeps a one-way hash of the
            creator&apos;s network, together with the link, for one to two hours.
          </li>
        </ul>
        <h3>Never stored</h3>
        <ul>
          <li>Visitors&apos; IP addresses</li>
          <li>Full browser identifiers and full addresses of referring pages</li>
          <li>Anything about an individual click</li>
          <li>Cookies: short links set none</li>
          <li>
            Making a link without an account runs a Cloudflare Turnstile check, which processes browser and network
            signals for that purpose only. hrva.cc stores nothing from it.
          </li>
        </ul>
        <p>
          Because the key changes every day and the link is part of the hash, the same visitor can&apos;t be followed from
          one day to the next or from one link to another. Without the key, the hashes can&apos;t be traced back to anyone.
        </p>

        <h2 id="check-it">Check it yourself</h2>
        <p>
          The code that makes the hash is{" "}
          <a href={VISITOR_HASH_SOURCE}>UniqueVisitorCounter.java, lines 58 to 62</a>, and the few hours the day&apos;s key
          is kept after midnight are set in <a href={SALT_GRACE_SOURCE}>AnalyticsDays.java</a>. The{" "}
          <Link href="/privacy">privacy policy</Link> lists everything hrva.cc collects, why, and for how long.
        </p>

        <h2 id="safety">Link safety</h2>
        <p>
          Every new link and a nightly rescan go through Google Safe Browsing and several blocklists, and every click is
          checked against the blocklists that block outright. Anyone can <Link href="/report">report a link</Link> to a person. How that works, and what it still misses, is in{" "}
          <Link href="/blog/how-hrva-cc-stops-phishing-links">How hrva.cc stops phishing links</Link>.
        </p>
        <p>
          Some links made without an account open a warning page that shows the destination first. It has no scripts and
          sets no cookies.
        </p>

        <h2 id="for-you">The GDPR and your own obligations</h2>
        <p>
          The privacy policy explains hrva.cc&apos;s legal bases and everyone&apos;s rights under the GDPR. This page is not
          legal advice: if you use short links for your own business, your own obligations depend on what you do with
          them.
        </p>

        <h2 id="questions">Questions</h2>
        {faqs.map((faq) => (
          <div key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
        <p>
          Who runs hrva.cc and how it is paid for: <Link href="/about">About hrva.cc</Link>.
        </p>
      </div>
    </StaticPage>
  )
}
