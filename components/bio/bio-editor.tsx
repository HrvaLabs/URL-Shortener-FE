"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react"
import { flushSync } from "react-dom"
import { toast } from "sonner"
import { ChangeHandleDialog, ChooseHandleForm } from "@/components/bio/change-handle-dialog"
import { DeleteBioPage } from "@/components/bio/delete-bio-page"
import { errorText } from "@/components/bio/handle-field"
import { PhonePreview } from "@/components/bio/phone-preview"
import { ProfileFields, profileFieldId, type BioFieldErrors } from "@/components/bio/profile-fields"
import { SaveBar } from "@/components/bio/save-bar"
import { ShareBar } from "@/components/bio/share-bar"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ApiError } from "@/lib/api-client"
import {
  AVATAR_EMOJI_REQUIRED,
  LINK_STATE_LABELS,
  bioDraftOf,
  bioSaveFieldErrors,
  bioUpdateOf,
  isSingleEmoji,
  rebaseBioDraft,
  rebaseSavedBioDraft,
  sameBioDraft,
  type BioDraft,
  type BioProfileField,
} from "@/lib/bio"
import { useRefreshBioPage, useSaveBioPage } from "@/lib/hooks/useBioPage"
import type { BioLinkState, BioPage, BioPageButton } from "@/lib/types"

const LARGE_SCREEN_QUERY = "(min-width: 64rem)"

const LEAVE_WARNING = "You have unsaved changes. Leave this page without saving them?"

const SAVE_BAR_ROOM = "8rem"

const PROFILE_FIELD_ORDER: BioProfileField[] = ["displayName", "bio", "avatarEmoji"]

const LINK_STATE_VARIANTS: Record<Exclude<BioLinkState, "LIVE">, BadgeProps["variant"]> = {
  IN_REVIEW: "warning",
  DEACTIVATED: "secondary",
  EXPIRED: "secondary",
  LIMIT_REACHED: "secondary",
  BLOCKED: "destructive",
}

const SECTION_CLASS = "rounded-xl border bg-card p-6 shadow-[0_1px_2px_rgb(0_0_0/0.04)]"

const SECTION_TITLE_CLASS = "text-base font-semibold leading-tight tracking-tight"

const subscribeToLargeScreen = (onChange: () => void) => {
  const query = window.matchMedia(LARGE_SCREEN_QUERY)
  query.addEventListener("change", onChange)
  return () => query.removeEventListener("change", onChange)
}

const useLargeScreen = () =>
  useSyncExternalStore(subscribeToLargeScreen, () => window.matchMedia(LARGE_SCREEN_QUERY).matches, () => false)

function useLeaveWarning(active: boolean) {
  useEffect(() => {
    if (!active) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ""
    }
    const confirmLinkClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return
      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin !== window.location.origin) return
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return
      if (window.confirm(LEAVE_WARNING)) return
      event.preventDefault()
      event.stopPropagation()
    }
    window.addEventListener("beforeunload", warnBeforeUnload)
    document.addEventListener("click", confirmLinkClick, true)
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload)
      document.removeEventListener("click", confirmLinkClick, true)
    }
  }, [active])
}

function useRoomForSaveBar(active: boolean) {
  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    const previous = root.style.scrollPaddingBottom
    root.style.scrollPaddingBottom = SAVE_BAR_ROOM
    return () => {
      root.style.scrollPaddingBottom = previous
    }
  }, [active])
}

function Section({ title, titleRef, children }: { title: string; titleRef?: RefObject<HTMLHeadingElement | null>; children: ReactNode }) {
  return (
    <section className={SECTION_CLASS}>
      <h2
        ref={titleRef}
        tabIndex={titleRef ? -1 : undefined}
        className={`${SECTION_TITLE_CLASS} focus-visible:ring-0 focus-visible:ring-offset-0`}
      >
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function SavedButtons({ buttons }: { buttons: BioPageButton[] }) {
  if (buttons.length === 0) return <p className="text-sm text-muted-foreground">No buttons yet.</p>
  return (
    <ul className="divide-y">
      {buttons.map((button) => {
        const state = button.linkState === "LIVE" ? null : LINK_STATE_LABELS[button.linkState]
        return (
          <li key={button.urlId} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-medium [overflow-wrap:anywhere]">{button.title}</p>
              <p className="font-mono text-[13px] font-medium text-brand [overflow-wrap:anywhere]">/{button.shortUrl}</p>
              {state && <p className="text-xs text-muted-foreground">{state.hint}</p>}
            </div>
            {(state || !button.visible) && (
              <div className="flex shrink-0 flex-wrap gap-1.5">
                {!button.visible && <Badge variant="outline">Hidden</Badge>}
                {state && button.linkState !== "LIVE" && (
                  <Badge variant={LINK_STATE_VARIANTS[button.linkState]}>{state.badge}</Badge>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}

function Banners({ page }: { page: BioPage }) {
  return (
    <>
      {page.hidden && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <p className="font-medium text-warning [overflow-wrap:anywhere]">
            {page.hiddenReason ? `An admin hid this page: ${page.hiddenReason}` : "An admin hid this page."}
          </p>
          <p className="mt-1">
            {`Visitors see "This page isn't available". You can still edit it. If you think this is a mistake, email `}
            <a href="mailto:abuse@hrva.cc" className="text-brand-link">abuse@hrva.cc</a>.
          </p>
        </div>
      )}
      {page.handle === null && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
          <p className="font-medium text-warning [overflow-wrap:anywhere]">
            {page.handleRevokedReason ? `An admin removed your handle: ${page.handleRevokedReason}` : "An admin removed your handle."}
          </p>
          <p className="mt-1">Your page has no address until you choose a new handle.</p>
          <div className="max-w-md">
            <ChooseHandleForm />
          </div>
        </div>
      )}
    </>
  )
}

export function BioEditor({ page, headingRef }: { page: BioPage; headingRef: RefObject<HTMLHeadingElement | null> }) {
  const idPrefix = useId()
  const indexableId = useId()
  const largeScreen = useLargeScreen()
  const [draft, setDraft] = useState(() => bioDraftOf(page))
  const [synced, setSynced] = useState(page)
  const [fieldErrors, setFieldErrors] = useState<BioFieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState("edit")
  const submitting = useRef(false)
  const lastEdited = useRef<HTMLElement | null>(null)
  const handleTitleRef = useRef<HTMLHeadingElement>(null)
  const hadHandle = useRef(page.handle !== null)
  const save = useSaveBioPage()
  const refresh = useRefreshBioPage()

  if (synced !== page) {
    setSynced(page)
    setDraft((current) => rebaseBioDraft(current, synced, page))
  }

  const dirty = !sameBioDraft(draft, bioDraftOf(page))

  useLeaveWarning(dirty)
  useRoomForSaveBar(dirty)

  useLayoutEffect(() => {
    const hasHandle = page.handle !== null
    if (!hadHandle.current && hasHandle) handleTitleRef.current?.focus()
    hadHandle.current = hasHandle
  }, [page.handle])

  const change = (patch: Partial<BioDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setFieldErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch)) delete next[key as BioProfileField]
      if ("avatarKind" in patch) delete next.avatarEmoji
      return next
    })
  }

  const rememberFocus = (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.target)) lastEdited.current = event.target
  }

  const focusAfterSaveBar = () => {
    const target = lastEdited.current
    const usable = target?.isConnected && target.getClientRects().length > 0
    ;(usable ? target : headingRef.current)?.focus({ preventScroll: true })
  }

  const focusField = (field: BioProfileField) => {
    if (!largeScreen && tab !== "edit") flushSync(() => setTab("edit"))
    document.getElementById(profileFieldId(idPrefix, field))?.focus()
  }

  const showFieldErrors = (errors: BioFieldErrors) => {
    setFieldErrors(errors)
    const first = PROFILE_FIELD_ORDER.find((field) => errors[field])
    if (first) focusField(first)
  }

  const handleSave = async () => {
    if (submitting.current) return
    if (draft.avatarKind === "EMOJI" && !isSingleEmoji(draft.avatarEmoji.trim())) {
      showFieldErrors({ avatarEmoji: AVATAR_EMOJI_REQUIRED })
      return
    }
    submitting.current = true
    setSaving(true)
    const sent = draft
    try {
      const saved = await save.mutateAsync(bioUpdateOf(sent))
      flushSync(() => {
        setDraft((current) => rebaseSavedBioDraft(current, sent, saved))
        setFieldErrors({})
        setSaving(false)
      })
      submitting.current = false
      focusAfterSaveBar()
      toast.success("Bio page saved")
    } catch (error) {
      submitting.current = false
      setSaving(false)
      const message = errorText(error)
      const errors = error instanceof ApiError && error.status === 400 ? bioSaveFieldErrors(message) : null
      if (errors) {
        showFieldErrors(errors)
        return
      }
      toast.error(message)
      if (error instanceof ApiError && (error.status === 404 || error.status === 409)) void refresh()
    }
  }

  const handleDiscard = () => {
    flushSync(() => {
      setDraft(bioDraftOf(page))
      setFieldErrors({})
    })
    focusAfterSaveBar()
  }

  const sections = (
    <div className="space-y-6" onFocusCapture={rememberFocus}>
      <ShareBar handle={page.handle} />

      <Section title="Profile">
        <ProfileFields idPrefix={idPrefix} draft={draft} errors={fieldErrors} onChange={change} />
      </Section>

      <Section title="Buttons">
        <SavedButtons buttons={draft.buttons} />
      </Section>

      <Section title="Search engines">
        <div className="flex items-start gap-3">
          <Switch
            id={indexableId}
            checked={draft.indexable}
            onCheckedChange={(indexable) => change({ indexable })}
            aria-describedby={`${indexableId}-hint`}
            className="mt-0.5"
          />
          <div className="space-y-1">
            <Label htmlFor={indexableId} className="leading-snug">Allow search engines to index this page</Label>
            <p id={`${indexableId}-hint`} className="text-xs text-muted-foreground">
              Off by default. While it&apos;s off, search engines are asked not to list your page.
            </p>
          </div>
        </div>
      </Section>

      {page.handle !== null && (
        <Section title="Handle" titleRef={handleTitleRef}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 font-mono text-sm font-medium [overflow-wrap:anywhere]">@{page.handle}</p>
            <ChangeHandleDialog handle={page.handle} />
          </div>
        </Section>
      )}

      <DeleteBioPage handle={page.handle} hidden={page.hidden} />
    </div>
  )

  const preview = <PhonePreview draft={draft} handle={page.handle} />

  return (
    <div className="space-y-6">
      <Banners page={page} />
      {largeScreen ? (
        <div className="grid grid-cols-[minmax(0,1fr)_22rem] items-start gap-8">
          {sections}
          <div className="sticky top-[4.5rem]">{preview}</div>
        </div>
      ) : (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="edit">{sections}</TabsContent>
          <TabsContent value="preview">{preview}</TabsContent>
        </Tabs>
      )}
      {dirty && <SaveBar saving={saving} onSave={handleSave} onDiscard={handleDiscard} />}
    </div>
  )
}
