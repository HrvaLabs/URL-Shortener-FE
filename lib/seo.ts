import type { Metadata } from "next"

export const SITE_URL = "https://app.hrva.cc"
export const SITE_NAME = "hrva.cc"
export const HOME_URL = `${SITE_URL}/`

const EM_DASH = String.fromCodePoint(0x2014)
const MIDDLE_DOT = String.fromCodePoint(0xb7)

export const TITLE_SUFFIX = ` ${EM_DASH} ${SITE_NAME}`
export const AUTHOR_NAME = `Karlo Hrva${String.fromCodePoint(0x10d)}i${String.fromCodePoint(0x107)}`
export const AUTHOR_URL = "https://karlo.cc"
export const PUBLISHER_NAME = "HrvaLabs"
export const PUBLISHER_URL = "https://hrvalabs.net"

export const HOME_HEADLINE = "Free URL shortener that counts visits, not visitors"
export const HOME_TITLE = `${HOME_HEADLINE} ${MIDDLE_DOT} ${SITE_NAME}`
export const HOME_DESCRIPTION =
  "Free, ad-free URL shortener from Croatia. Visits are counted without storing IPs. Open source, with link-in-bio pages, QR codes and an MCP server for Claude and ChatGPT."
export const ENTITY_SENTENCE =
  "hrva.cc is a free, privacy-first, open-source URL shortener from HrvaLabs, with link-in-bio pages and an MCP server for AI assistants."

export const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: `${HOME_HEADLINE}. hrva.cc`,
  type: "image/png",
}

export const absoluteUrl = (path: string): string => (path === "/" ? HOME_URL : `${SITE_URL}${path}`)

interface PageMetadataInput {
  title: string
  description: string
  path: string
  socialTitle?: string
  article?: { publishedTime: string; modifiedTime?: string; tags?: string[] }
}

export function pageMetadata({ title, description, path, socialTitle, article }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path)
  const shareTitle = socialTitle ?? `${title}${TITLE_SUFFIX}`
  const shared = { siteName: SITE_NAME, locale: "en_US", url, title: shareTitle, description, images: [OG_IMAGE] }

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: article
      ? {
          ...shared,
          type: "article",
          publishedTime: article.publishedTime,
          modifiedTime: article.modifiedTime ?? article.publishedTime,
          authors: [AUTHOR_URL],
          tags: article.tags,
        }
      : { ...shared, type: "website" },
    twitter: { card: "summary_large_image", title: shareTitle, description, images: [OG_IMAGE.url] },
  }
}

export const noIndex = (title: string): Metadata => ({
  title,
  robots: { index: false, follow: false },
})
