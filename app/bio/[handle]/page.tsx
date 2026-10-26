import type { Metadata, Viewport } from "next"
import { notFound, permanentRedirect } from "next/navigation"
import { BioPageView, type BioPageViewModel } from "@/components/bio/bio-page-view"
import { BioRetryFocus } from "@/components/bio/bio-retry-focus"
import { BioViewBeacon } from "@/components/bio/bio-view-beacon"
import { BIO_PAGE_COLORS, BIO_PAGE_NAME_ID, handleFormatError, normalizeHandle } from "@/lib/bio"
import { loadPublicBioPage } from "@/lib/bio-server"
import type { BioTheme, PublicBioPage } from "@/lib/types"
import { formatShortUrl } from "@/lib/utils"

export const dynamic = "force-dynamic"

type BioRouteProps = { params: Promise<{ handle: string }> }

const UNAVAILABLE_METADATA: Metadata = {
  title: "This page isn't available",
  robots: { index: false, follow: false },
}

const THEME_VIEWPORTS: Record<BioTheme, Viewport> = {
  LIGHT: { themeColor: BIO_PAGE_COLORS.light.bg, colorScheme: "light" },
  DARK: { themeColor: BIO_PAGE_COLORS.dark.bg, colorScheme: "dark" },
  AUTO: {
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: BIO_PAGE_COLORS.light.bg },
      { media: "(prefers-color-scheme: dark)", color: BIO_PAGE_COLORS.dark.bg },
    ],
    colorScheme: "light dark",
  },
}

const decodeSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

const canonicalHandleOf = (segment: string): string | null => {
  const canonical = normalizeHandle(decodeSegment(segment))
  return handleFormatError(canonical) ? null : canonical
}

const toViewModel = (page: PublicBioPage): BioPageViewModel => ({
  handle: page.handle,
  displayName: page.displayName,
  bio: page.bio,
  avatarKind: page.avatarKind,
  avatarEmoji: page.avatarEmoji,
  accent: page.accent,
  theme: page.theme,
  buttons: page.buttons.map((button) => ({
    key: button.shortUrl,
    title: button.title,
    icon: button.icon,
    href: formatShortUrl(button.shortUrl),
  })),
})

export async function generateViewport({ params }: BioRouteProps): Promise<Viewport> {
  const { handle: segment } = await params
  const canonical = canonicalHandleOf(segment)
  if (!canonical || canonical !== segment) return {}
  const page = await loadPublicBioPage(canonical).catch(() => null)
  return page ? (THEME_VIEWPORTS[page.theme] ?? {}) : {}
}

export async function generateMetadata({ params }: BioRouteProps): Promise<Metadata> {
  const { handle: segment } = await params
  const canonical = canonicalHandleOf(segment)
  if (!canonical || canonical !== segment) return UNAVAILABLE_METADATA
  const page = await loadPublicBioPage(canonical)
  if (!page) return UNAVAILABLE_METADATA
  const handleLabel = `@${page.handle}`
  const name = page.displayName || handleLabel
  const title = page.displayName ? `${page.displayName} (${handleLabel})` : handleLabel
  const description = page.bio || `Links from ${name} on hrva.cc.`
  const url = `https://app.hrva.cc/bio/${page.handle}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "profile", siteName: "hrva.cc", locale: "en_US", title, description, url },
    twitter: { card: "summary_large_image", title, description, images: [`/bio/${page.handle}/opengraph-image`] },
    robots: page.indexable ? { index: true, follow: true } : { index: false, follow: false },
  }
}

export default async function BioRoutePage({ params }: BioRouteProps) {
  const { handle: segment } = await params
  const canonical = canonicalHandleOf(segment)
  if (!canonical) notFound()
  if (canonical !== segment) permanentRedirect(`/bio/${canonical}`)

  const page = await loadPublicBioPage(canonical)
  if (!page) notFound()

  return (
    <>
      <BioPageView
        page={toViewModel(page)}
        mode="public"
        reportHref={`/report?s=${encodeURIComponent(`@${page.handle}`)}`}
      />
      <BioViewBeacon handle={page.handle} />
      <BioRetryFocus targetId={BIO_PAGE_NAME_ID} />
    </>
  )
}
