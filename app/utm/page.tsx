import Link from "next/link"
import type { Metadata } from "next"
import { JSON_LD_IDS, JsonLdScript, pageBreadcrumbs, reference } from "@/components/json-ld"
import { StaticPage } from "@/components/static-page"
import { UtmBuilder } from "@/components/utm-builder"
import { absoluteUrl, pageMetadata } from "@/lib/seo"

const path = "/utm"
const description =
  "UTM builder with no signup: add utm_source, utm_medium and utm_campaign to any link, copy the tagged URL, and shorten it if you like. Built in your browser."

export const metadata: Metadata = pageMetadata({ title: "UTM builder: tag a link for your analytics", description, path })

const utmJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": `${absoluteUrl(path)}#app`,
      name: "hrva.cc UTM builder",
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
    pageBreadcrumbs("UTM builder", path),
  ],
}

const fields = [
  { name: "utm_source", label: "Source", text: "where you share the link", example: "instagram, newsletter" },
  { name: "utm_medium", label: "Medium", text: "the kind of channel", example: "social, email, qr" },
  { name: "utm_campaign", label: "Campaign", text: "the campaign's name", example: "autumn-sale" },
  { name: "utm_term", label: "Term", text: "optional, such as a paid keyword", example: "running-shoes" },
  { name: "utm_content", label: "Content", text: "optional, which version or button was clicked", example: "header-button" },
]

export default function UtmPage() {
  return (
    <StaticPage
      wide
      title="UTM builder: tag a link for your analytics"
      lead={
        <p>
          Add UTM tags to any link so Google Analytics, Plausible or Matomo can tell where visitors came from. Free, with
          no signup: the link is built in your browser.
        </p>
      }
      after={<JsonLdScript data={utmJsonLd} />}
    >
      <UtmBuilder />

      <div className="prose-custom mx-auto max-w-3xl">
        <h2 id="shorten">Shorten the tagged link</h2>
        <p>
          Tagged links get long. Select <strong>Shorten it</strong> to turn one into a hrva.cc short link that opens the
          tagged address. With a <Link href="/register">free account</Link>, the short link also gets its own stats, and its
          analytics page lists the campaign tags it carries.
        </p>

        <h2 id="fields">What each UTM field does</h2>
        <p>
          A UTM tag is a name and a value added to a link&apos;s address. The analytics tool on the site the link opens reads
          them when someone arrives, and files the visit under that source, medium and campaign. Source, Medium and
          Campaign are the ones most reports use; most analytics tools ignore campaign tags without a Source.
        </p>
        <ul>
          {fields.map((field) => (
            <li key={field.name}>
              <strong>{field.label}</strong> (<code>{field.name}</code>): {field.text}, for example {field.example}.
            </li>
          ))}
        </ul>
        <p>
          Use lowercase and dashes, and the same spelling every time: most analytics tools count Instagram and instagram
          as two different sources. A space in a value is saved as <code>%20</code>.
        </p>

        <h2 id="privacy">What hrva.cc does with your tags</h2>
        <p>
          The tagged address is built in your browser, and nothing is sent to hrva.cc until you select{" "}
          <strong>Shorten it</strong>. Then hrva.cc saves the tagged address as the link&apos;s
          destination and sends visitors there; it doesn&apos;t store the tags separately or send them anywhere else.
        </p>
        <p>
          More about the fields, quick picks and removing tags: <Link href="/help/utm">Campaign tracking (UTM)</Link>.
        </p>
      </div>
    </StaticPage>
  )
}
