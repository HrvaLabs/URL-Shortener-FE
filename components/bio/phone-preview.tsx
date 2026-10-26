"use client"

import { useId } from "react"
import { BioPageView, type BioPageViewModel } from "@/components/bio/bio-page-view"
import { isSingleEmoji, type BioDraft } from "@/lib/bio"

const collapseSpaces = (value: string): string => value.replace(/[\s\p{Z}]+/gu, " ").trim()

const previewModelOf = (draft: BioDraft, handle: string | null): BioPageViewModel => {
  const emoji = draft.avatarEmoji.trim()
  return {
    handle,
    displayName: collapseSpaces(draft.displayName),
    bio: collapseSpaces(draft.bio),
    avatarKind: draft.avatarKind,
    avatarEmoji: isSingleEmoji(emoji) ? emoji : null,
    accent: draft.accent,
    theme: draft.theme,
    buttons: draft.buttons
      .filter((button) => button.visible && button.linkState === "LIVE")
      .map((button) => ({ key: String(button.urlId), title: button.title, icon: button.icon, href: null })),
  }
}

export function PhonePreview({ draft, handle }: { draft: BioDraft; handle: string | null }) {
  const captionId = useId()
  return (
    <div className="space-y-3">
      <div
        role="region"
        aria-label="Preview of your bio page"
        aria-describedby={captionId}
        tabIndex={0}
        className="mx-auto aspect-[9/19] w-full max-w-[320px] overflow-y-auto rounded-[2rem] border-8 border-foreground/80 bg-background lg:w-[min(100%,320px,calc((100dvh-15rem)*9/19))]"
      >
        <BioPageView page={previewModelOf(draft, handle)} mode="preview" />
      </div>
      <p id={captionId} className="mx-auto max-w-[320px] text-center text-xs text-muted-foreground">
        Preview. Hidden buttons and buttons whose link isn&apos;t working aren&apos;t shown.
      </p>
    </div>
  )
}
