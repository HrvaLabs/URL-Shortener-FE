import {
  AUTHOR_NAME,
  AUTHOR_URL,
  ENTITY_SENTENCE,
  HOME_URL,
  PUBLISHER_NAME,
  PUBLISHER_URL,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo"

export const JSON_LD_IDS = {
  website: `${SITE_URL}/#website`,
  app: `${SITE_URL}/#app`,
  organization: `${SITE_URL}/#organization`,
  person: `${AUTHOR_URL}/#person`,
} as const

export const SOURCE_REPOSITORIES = [
  "https://github.com/HrvaLabs/url-shortener",
  "https://github.com/HrvaLabs/URL-Shortener-FE",
]

const SCRIPT_BREAKING = new RegExp(`[<>&${String.fromCharCode(0x2028, 0x2029)}]`, "g")

const unicodeEscape = (character: string): string =>
  "\\u" + character.charCodeAt(0).toString(16).padStart(4, "0")

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(SCRIPT_BREAKING, unicodeEscape)
}

export function JsonLdScript({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }} />
}

export const reference = (id: string) => ({ "@id": id })

export interface Crumb {
  name: string
  path?: string
}

export const breadcrumbList = (crumbs: Crumb[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((crumb, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: crumb.name,
    ...(crumb.path ? { item: absoluteUrl(crumb.path) } : {}),
  })),
})

export const pageBreadcrumbs = (name: string, path: string) =>
  breadcrumbList([{ name: "Home", path: "/" }, { name, path }])

export const techArticle = ({ path, headline, description, published, modified }: { path: string; headline: string; description: string; published: string; modified: string }) => {
  const url = absoluteUrl(path)
  return {
    "@type": "TechArticle",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    headline,
    description,
    datePublished: published,
    dateModified: modified,
    inLanguage: "en",
    author: reference(JSON_LD_IDS.person),
    publisher: reference(JSON_LD_IDS.organization),
    isPartOf: reference(JSON_LD_IDS.website),
    about: reference(JSON_LD_IDS.app),
  }
}

export function HelpBreadcrumbs({ name, path }: { name: string; path: string }) {
  const trail: Crumb[] = path === "/help" ? [{ name: "Home", path: "/" }, { name, path }] : [{ name: "Home", path: "/" }, { name: "Help", path: "/help" }, { name, path }]
  return <JsonLdScript data={{ "@context": "https://schema.org", ...breadcrumbList(trail) }} />
}

export function SiteJsonLd() {
  return (
    <JsonLdScript
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "WebSite",
            "@id": JSON_LD_IDS.website,
            url: HOME_URL,
            name: SITE_NAME,
            description: ENTITY_SENTENCE,
            inLanguage: "en",
            publisher: reference(JSON_LD_IDS.organization),
          },
          {
            "@type": "WebApplication",
            "@id": JSON_LD_IDS.app,
            name: SITE_NAME,
            url: HOME_URL,
            applicationCategory: "UtilityApplication",
            operatingSystem: "Any",
            offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
            publisher: reference(JSON_LD_IDS.organization),
          },
          {
            "@type": "Organization",
            "@id": JSON_LD_IDS.organization,
            name: PUBLISHER_NAME,
            url: PUBLISHER_URL,
            founder: reference(JSON_LD_IDS.person),
            sameAs: ["https://github.com/HrvaLabs"],
          },
          {
            "@type": "Person",
            "@id": JSON_LD_IDS.person,
            name: AUTHOR_NAME,
            url: AUTHOR_URL,
            sameAs: ["https://github.com/karlohrvacic"],
          },
        ],
      }}
    />
  )
}
