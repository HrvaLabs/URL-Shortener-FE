import Link from "next/link"
import type { Metadata } from "next"
import { JSON_LD_IDS, JsonLdScript, pageBreadcrumbs, reference } from "@/components/json-ld"
import { QrGenerator } from "@/components/qr-generator"
import { StaticPage } from "@/components/static-page"
import { absoluteUrl, pageMetadata } from "@/lib/seo"

const path = "/qr"
const description =
  "Free QR code generator with no signup: type an address, pick colours and size, and download a PNG or SVG. The code is made in your browser and never expires."

export const metadata: Metadata = pageMetadata({ title: "Free QR code generator, no signup", description, path })

const qrJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${absoluteUrl(path)}#app`,
      name: "hrva.cc QR code generator",
      url: absoluteUrl(path),
      description,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser with JavaScript enabled",
      isAccessibleForFree: true,
      inLanguage: "en",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      publisher: reference(JSON_LD_IDS.organization),
      isPartOf: reference(JSON_LD_IDS.website),
    },
    pageBreadcrumbs("QR code generator", path),
  ],
}

const faqs = [
  {
    question: "Is it really free?",
    answer: "Yes. There is no account, no limit on how many codes you make, no watermark and no ads.",
  },
  {
    question: "Do these QR codes expire?",
    answer:
      "No. A code made here holds your address itself, so it works for as long as that address does, whether or not hrva.cc is around.",
  },
  {
    question: "Can I see how often my code was scanned?",
    answer:
      "Only if the code opens a hrva.cc short link made with an account. Then the link's stats count QR scans apart from other clicks, and nothing about the person scanning is stored.",
  },
]

export default function QrPage() {
  return (
    <StaticPage
      wide
      title="Free QR code generator: no signup, nothing uploaded"
      lead={<p>Type an address, pick colours and size, and download a PNG or SVG. The code is drawn in your browser.</p>}
      after={<JsonLdScript data={qrJsonLd} />}
    >
      <QrGenerator />

      <div className="prose-custom mx-auto max-w-3xl">
        <h2 id="static">This QR code is static</h2>
        <p>
          A code made here points straight at the address you typed. Nothing is sent to hrva.cc while you make it, and
          the code doesn&apos;t pass through hrva.cc when someone scans it, so it never expires and needs no account. You
          can&apos;t change where it goes after you print it.
        </p>

        <h2 id="count-scans">Counting scans with a short link</h2>
        <p>
          Select <strong>Use a short link</strong> and the code opens a hrva.cc short link instead, which is shorter and
          makes a simpler code. With a <Link href="/register">free account</Link>, the link&apos;s stats then show QR scans
          apart from other clicks, as daily totals with nothing stored about the person scanning.{" "}
          <Link href="/help/stats#qr-scans">How QR scans are counted</Link>.
        </p>

        <h2 id="print">Before you print</h2>
        <ul>
          <li>
            <strong>Size:</strong> print it at least 2 cm (about 0.8 in) wide, and larger when it will be scanned from
            further away, such as on a poster.
          </li>
          <li>
            <strong>Contrast:</strong> keep a dark code on a light background. Light codes on dark backgrounds and pale
            colours don&apos;t scan everywhere.
          </li>
          <li>
            <strong>Margin:</strong> keep the empty border around the code. On a busy background, leave more.
          </li>
          <li>
            <strong>Quality:</strong> choose High if the code may get scratched or folded; it survives more damage but
            has more dots.
          </li>
          <li>
            <strong>Test:</strong> scan the printed proof with two different phones before you print the whole batch.
          </li>
        </ul>

        <h2 id="questions">Questions</h2>
        {faqs.map((faq) => (
          <div key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </div>
        ))}
        <p>
          How hrva.cc handles the visits it does count: <Link href="/privacy-first-url-shortener">a URL shortener without tracking</Link>.
        </p>
      </div>
    </StaticPage>
  )
}
