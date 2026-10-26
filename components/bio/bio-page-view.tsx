import type { CSSProperties } from "react"
import Link from "next/link"
import { BioIconGlyph } from "@/components/bio/bio-icons"
import { BIO_ACCENTS, BIO_ICON_LABELS, BIO_PAGE_NAME_ID, initialsOf, isBioIcon } from "@/lib/bio"
import type { BioAccent, BioAvatarKind, BioIcon, BioTheme } from "@/lib/types"

export type BioPageViewModel = {
  handle: string | null
  displayName: string
  bio: string
  avatarKind: BioAvatarKind
  avatarEmoji: string | null
  accent: BioAccent
  theme: BioTheme
  buttons: { key: string; title: string; icon: BioIcon | null; href: string | null }[]
}

const FOCUS_OUTLINE =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-[var(--bio-fg)] focus-visible:ring-0 focus-visible:ring-offset-0"

const BUTTON_CLASSES = `flex min-h-12 w-full items-center gap-3 rounded-xl px-4 py-3 font-medium bg-[var(--bio-accent)] text-[var(--bio-on-accent)] [overflow-wrap:anywhere] ${FOCUS_OUTLINE}`

const FOOTER_LINK_CLASSES = `rounded-sm underline-offset-4 hover:underline ${FOCUS_OUTLINE}`

const platformLabelFor = (title: string, icon: BioIcon | null): string | null => {
  if (!icon || icon === "WEBSITE") return null
  const label = BIO_ICON_LABELS[icon]
  return title.trim().toLowerCase() === label.toLowerCase() ? null : label
}

function ButtonContent({ title, icon }: { title: string; icon: BioIcon | null }) {
  const knownIcon = isBioIcon(icon) ? icon : null
  const platformLabel = platformLabelFor(title, knownIcon)
  return (
    <>
      {knownIcon && <BioIconGlyph icon={knownIcon} className="size-5 shrink-0" />}
      <span className="min-w-0 flex-1 text-center">
        {platformLabel && <span className="sr-only">{platformLabel}: </span>}
        <span dir="auto">{title}</span>
      </span>
      {knownIcon && <span className="size-5 shrink-0" aria-hidden="true" />}
    </>
  )
}

export function BioPageView({
  page,
  mode,
  reportHref,
}: {
  page: BioPageViewModel
  mode: "public" | "preview"
  reportHref?: string
}) {
  const accent = BIO_ACCENTS[page.accent] ?? BIO_ACCENTS.BLUE
  const accentStyle = { "--bio-accent-light": accent.light, "--bio-accent-dark": accent.dark } as CSSProperties
  const isPublic = mode === "public"
  const Content = isPublic ? "main" : "div"
  const Footer = isPublic ? "footer" : "div"
  const Name = isPublic ? "h1" : "p"
  const handleLabel = page.handle ? `@${page.handle}` : ""
  const name = page.displayName || handleLabel
  const showsEmoji = page.avatarKind === "EMOJI" && Boolean(page.avatarEmoji)

  return (
    <div
      className={`bio-theme-${page.theme.toLowerCase()} ${isPublic ? "bio-public min-h-dvh" : "min-h-full"} w-full`}
      style={accentStyle}
    >
      <Content className="mx-auto w-full max-w-[34rem] px-4 py-10">
        <div className="flex flex-col items-center text-center">
          <div
            aria-hidden="true"
            className="flex size-24 shrink-0 items-center justify-center rounded-full bg-[var(--bio-accent)] text-[var(--bio-on-accent)]"
          >
            {showsEmoji ? (
              <span className="text-5xl leading-none">{page.avatarEmoji}</span>
            ) : (
              <span className="text-3xl font-semibold">{initialsOf(page.displayName, page.handle)}</span>
            )}
          </div>
          <Name
            id={isPublic ? BIO_PAGE_NAME_ID : undefined}
            tabIndex={isPublic ? -1 : undefined}
            dir="auto"
            className={`mt-5 w-full text-2xl font-semibold [overflow-wrap:anywhere] focus-visible:ring-0 focus-visible:ring-offset-0 ${name ? "" : "text-[var(--bio-muted)]"}`}
          >
            {name || "Your name"}
          </Name>
          {page.displayName && handleLabel && (
            <p className="mt-1 w-full text-[var(--bio-muted)] [overflow-wrap:anywhere]">{handleLabel}</p>
          )}
          {page.bio && (
            <p dir="auto" className="mt-4 w-full [overflow-wrap:anywhere]">
              {page.bio}
            </p>
          )}
        </div>

        {page.buttons.length > 0 ? (
          <ul className="mt-8 flex flex-col gap-3">
            {page.buttons.map((button) => (
              <li key={button.key}>
                {isPublic && button.href ? (
                  <a href={button.href} rel="ugc nofollow" className={BUTTON_CLASSES}>
                    <ButtonContent title={button.title} icon={button.icon} />
                  </a>
                ) : (
                  <span className={BUTTON_CLASSES}>
                    <ButtonContent title={button.title} icon={button.icon} />
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-center text-[var(--bio-muted)]">No links yet.</p>
        )}
      </Content>

      <Footer className="mx-auto flex w-full max-w-[34rem] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 pb-10 text-sm text-[var(--bio-muted)]">
        {isPublic && reportHref && (
          <Link href={reportHref} className={FOOTER_LINK_CLASSES}>
            Report this page
          </Link>
        )}
        {isPublic ? (
          <Link href="/" className={FOOTER_LINK_CLASSES}>
            Made with hrva.cc
          </Link>
        ) : (
          <span>Made with hrva.cc</span>
        )}
      </Footer>
    </div>
  )
}
