import { ImageResponse } from "next/og"
import { notFound } from "next/navigation"
import { BIO_ACCENTS, ogInitials, ogSafeText } from "@/lib/bio"
import { loadPublicBioPage } from "@/lib/bio-server"

export const alt = "Bio page on hrva.cc"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const TEXT_COLOR = "#0e0e11"
const MUTED_COLOR = "#5c5c66"

type BioShareImageProps = { params: Promise<{ handle: string }> }

export default async function BioShareImage({ params }: BioShareImageProps) {
  const { handle: segment } = await params
  const page = await loadPublicBioPage(segment)
  if (!page) notFound()

  const handleLabel = `@${page.handle}`
  const name = ogSafeText(page.displayName)
  const initials = ogInitials(page.displayName, page.handle)
  const accent = BIO_ACCENTS[page.accent] ?? BIO_ACCENTS.BLUE

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: "100%",
          padding: 80,
          background: "#ffffff",
          color: TEXT_COLOR,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 200,
            height: 200,
            flexShrink: 0,
            borderRadius: 100,
            background: accent.light,
            color: "#ffffff",
            fontSize: 80,
          }}
        >
          {initials}
        </div>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, flexShrink: 1, minWidth: 0, marginLeft: 56 }}>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.15, wordBreak: "break-word" }}>{name || handleLabel}</div>
          {name ? (
            <div style={{ display: "flex", marginTop: 16, fontSize: 36, color: MUTED_COLOR, wordBreak: "break-word" }}>
              {handleLabel}
            </div>
          ) : null}
        </div>
        <div style={{ position: "absolute", right: 80, bottom: 56, display: "flex", fontSize: 28 }}>
          <span>hrva</span>
          <span style={{ color: MUTED_COLOR }}>.cc</span>
        </div>
      </div>
    ),
    { ...size, headers: { "Cache-Control": "public, max-age=300" } },
  )
}
