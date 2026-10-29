import type { Metadata } from "next"
import { HomePage } from "@/components/home/home-page"
import { JSON_LD_IDS, JsonLdScript, SOURCE_REPOSITORIES, reference } from "@/components/json-ld"
import { HOME_FAQS, faqAnswerText } from "@/lib/home-faq"
import { ENTITY_SENTENCE, HOME_DESCRIPTION, HOME_TITLE, HOME_URL, SITE_NAME, pageMetadata } from "@/lib/seo"

export const metadata: Metadata = {
  ...pageMetadata({ title: HOME_TITLE, description: HOME_DESCRIPTION, path: "/", socialTitle: HOME_TITLE }),
  title: { absolute: HOME_TITLE },
}

const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": JSON_LD_IDS.app,
      name: SITE_NAME,
      url: HOME_URL,
      description: ENTITY_SENTENCE,
      applicationCategory: "UtilityApplication",
      operatingSystem: "Any",
      browserRequirements: "Requires a modern web browser with JavaScript enabled",
      isAccessibleForFree: true,
      inLanguage: "en",
      featureList: [
        "Short links without an account",
        "Custom aliases, visit limits, expiry dates and passwords",
        "Tags and search",
        "QR codes that count their scans",
        "Campaign tracking (UTM) builder",
        "Link analytics without storing visitor IP addresses",
        "Link-in-bio pages",
        "Dead-link checks and notifications",
        "API keys and an MCP server for AI assistants",
      ],
      offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
      author: reference(JSON_LD_IDS.person),
      publisher: reference(JSON_LD_IDS.organization),
      isPartOf: reference(JSON_LD_IDS.website),
      sameAs: SOURCE_REPOSITORIES,
    },
    {
      "@type": "FAQPage",
      "@id": `${HOME_URL}#faq`,
      isPartOf: reference(JSON_LD_IDS.website),
      mainEntity: HOME_FAQS.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faqAnswerText(faq) },
      })),
    },
  ],
}

export default function Page() {
  return (
    <>
      <HomePage />
      <JsonLdScript data={homeJsonLd} />
    </>
  )
}
