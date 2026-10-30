"use client"

import { useLayoutEffect, useRef, useState, type HTMLAttributes, type MouseEvent, type RefCallback } from "react"
import { GripVertical, Plus, Trash2 } from "lucide-react"
import { LinkPickerDialog, ignoreKeyRepeat } from "@/components/bio/link-picker-dialog"
import { LinkStateBadge, LinkStateHint, UrlsPageText } from "@/components/bio/link-state-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  BIO_ICON_LABELS,
  BIO_LIMITS,
  bioButtonLabel,
  isBioIcon,
  isLinkNotWorkingError,
  newBioButton,
  type BioButtonError,
  type BioButtonErrors,
} from "@/lib/bio"
import { useReorder } from "@/lib/hooks/useReorder"
import type { BioIcon, BioPageButton, UrlResponse } from "@/lib/types"
import { cn, shortHostOf } from "@/lib/utils"

export const BUTTON_LIMIT_TEXT = "You've added 30 buttons, the most a page can have."

const NO_ICON = "NONE"

const ICON_OPTIONS = Object.entries(BIO_ICON_LABELS) as [BioIcon, string][]

const DISABLED_CLASSES = "aria-disabled:pointer-events-none aria-disabled:opacity-50"

const SELECT_CLASSES =
  "h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[border-color,box-shadow] duration-150 focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

type ButtonField = "title" | "icon" | "visible" | "remove" | "handle" | "hint" | "error"

export const bioButtonFieldId = (prefix: string, urlId: number, field: ButtonField) => `${prefix}-button-${urlId}-${field}`

type HandleProps = HTMLAttributes<HTMLButtonElement>

function ButtonRow({
  idPrefix,
  button,
  error,
  busy,
  dragging,
  rowRef,
  handleProps,
  onUpdate,
  onRemove,
}: {
  idPrefix: string
  button: BioPageButton
  error: BioButtonError | undefined
  busy: boolean
  dragging: boolean
  rowRef: RefCallback<HTMLElement>
  handleProps: HandleProps
  onUpdate: (patch: Partial<Pick<BioPageButton, "title" | "icon" | "visible">>) => void
  onRemove: (event: MouseEvent<HTMLButtonElement>) => void
}) {
  const fieldId = (field: ButtonField) => bioButtonFieldId(idPrefix, button.urlId, field)
  const label = bioButtonLabel(button)
  const titleError = error?.field === "title" ? error.text : null
  const linkError = error?.field === "link" ? error.text : null
  const forButton = <span className="sr-only"> for {shortHostOf(button.domain)}/{button.shortUrl}</span>

  return (
    <li
      ref={rowRef}
      className={cn(
        "rounded-lg border bg-background p-3 sm:p-4",
        dragging && "relative z-10 border-ring shadow-[0_8px_24px_-12px_rgb(0_0_0/0.15)]",
      )}
    >
      <div className="flex flex-wrap items-start gap-x-2 gap-y-2 sm:gap-x-3">
        <button
          type="button"
          id={fieldId("handle")}
          {...handleProps}
          aria-label={`Move ${label}`}
          aria-describedby={fieldId("hint")}
          aria-disabled={busy || undefined}
          className={cn(
            "peer -ml-1 mt-6 inline-flex size-9 shrink-0 cursor-grab select-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
            dragging && "cursor-grabbing bg-accent text-foreground",
          )}
        >
          <GripVertical className="size-4" aria-hidden="true" />
        </button>
        <p id={fieldId("hint")} className="order-last hidden basis-full text-xs text-muted-foreground peer-focus-visible:block">
          Drag, or use the arrow keys
        </p>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
            <div>
              <Label htmlFor={fieldId("title")}>Title{forButton}</Label>
              <Input
                id={fieldId("title")}
                value={button.title}
                onChange={(event) => onUpdate({ title: event.target.value })}
                maxLength={BIO_LIMITS.buttonTitle}
                readOnly={busy}
                autoComplete="off"
                aria-invalid={Boolean(titleError)}
                aria-describedby={titleError ? fieldId("error") : undefined}
                className="mt-1.5"
              />
              {titleError && (
                <p id={fieldId("error")} className="mt-1.5 text-sm text-destructive [overflow-wrap:anywhere]">{titleError}</p>
              )}
            </div>
            <div>
              <Label htmlFor={fieldId("icon")}>Icon{forButton}</Label>
              <select
                id={fieldId("icon")}
                value={isBioIcon(button.icon) ? button.icon : NO_ICON}
                onChange={(event) => onUpdate({ icon: isBioIcon(event.target.value) ? event.target.value : null })}
                aria-disabled={busy || undefined}
                className={cn(SELECT_CLASSES, "mt-1.5")}
              >
                <option value={NO_ICON}>No icon</option>
                {ICON_OPTIONS.map(([value, text]) => (
                  <option key={value} value={value}>{text}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="font-mono text-[13px] font-medium [overflow-wrap:anywhere]">
            <span className="text-brand"><span className="font-normal text-muted-foreground">{shortHostOf(button.domain)}/</span>{button.shortUrl}</span>
            {button.destinationHost && (
              <>
                <span aria-hidden="true" className="text-muted-foreground"> → </span>
                <span className="sr-only"> goes to </span>
                <span className="text-muted-foreground">{button.destinationHost}</span>
              </>
            )}
          </p>
          {linkError && (
            <p id={fieldId("error")} className="text-sm text-destructive [overflow-wrap:anywhere]">
              {linkError}
              {isLinkNotWorkingError(linkError) && (
                <>
                  {" "}
                  <UrlsPageText text="Remove it, or turn it back on on the URLs page." />
                </>
              )}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2">
              <Switch
                id={fieldId("visible")}
                checked={button.visible}
                onCheckedChange={(visible) => onUpdate({ visible })}
                aria-disabled={busy || undefined}
              />
              <Label htmlFor={fieldId("visible")}>Show on page{forButton}</Label>
            </div>
            <LinkStateBadge state={button.linkState} />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              id={fieldId("remove")}
              aria-label={`Remove ${label}`}
              aria-describedby={linkError ? fieldId("error") : undefined}
              aria-disabled={busy || undefined}
              onClick={onRemove}
              onKeyDown={ignoreKeyRepeat}
              className={cn("ml-auto gap-1.5 text-destructive hover:text-destructive", DISABLED_CLASSES)}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Remove
            </Button>
          </div>
          <LinkStateHint state={button.linkState} shortUrl={button.shortUrl} />
        </div>
      </div>
    </li>
  )
}

export function ButtonsEditor({
  idPrefix,
  buttons,
  onChange,
  errors,
  onClearError,
  busy,
}: {
  idPrefix: string
  buttons: BioPageButton[]
  onChange: (next: BioPageButton[]) => void
  errors: BioButtonErrors
  onClearError: (urlId: number) => void
  busy: boolean
}) {
  const limitId = `${idPrefix}-buttons-limit`
  const addRef = useRef<HTMLButtonElement>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [removal, setRemoval] = useState({ text: "", id: 0 })
  const lastAdded = useRef<number | null>(null)
  const focusAfterRemove = useRef<{ urlId: number | null } | null>(null)
  const full = buttons.length >= BIO_LIMITS.buttons
  const reorder = useReorder({ items: buttons, onChange, label: bioButtonLabel, disabled: busy })

  useLayoutEffect(() => {
    const pending = focusAfterRemove.current
    if (!pending) return
    focusAfterRemove.current = null
    const next = pending.urlId === null ? null : document.getElementById(bioButtonFieldId(idPrefix, pending.urlId, "remove"))
    ;(next ?? addRef.current)?.focus()
  })

  const update = (urlId: number, patch: Partial<Pick<BioPageButton, "title" | "icon" | "visible">>) => {
    if (busy) return
    onChange(buttons.map((button) => (button.urlId === urlId ? { ...button, ...patch } : button)))
    if ("title" in patch) onClearError(urlId)
  }

  const remove = (index: number, event: MouseEvent<HTMLButtonElement>) => {
    if (busy || event.detail > 1) return
    const removed = buttons[index]
    if (!removed) return
    const neighbour = buttons[index + 1] ?? buttons[index - 1]
    focusAfterRemove.current = { urlId: neighbour?.urlId ?? null }
    setRemoval((current) => ({ text: `Removed ${bioButtonLabel(removed)}`, id: current.id + 1 }))
    onClearError(removed.urlId)
    onChange(buttons.filter((_, position) => position !== index))
  }

  const pick = (url: UrlResponse): string | null => {
    if (busy || buttons.length >= BIO_LIMITS.buttons || buttons.some((button) => button.urlId === url.id)) return null
    const button = { ...newBioButton(url), domain: url.domain?.hostname ?? null }
    lastAdded.current = button.urlId
    onChange([...buttons, button])
    return bioButtonLabel(button)
  }

  const openPicker = (open: boolean) => {
    if (open) lastAdded.current = null
    setPickerOpen(open)
  }

  const focusAfterPicker = (event: Event) => {
    const added = lastAdded.current
    if (added === null) return
    const title = document.getElementById(bioButtonFieldId(idPrefix, added, "title"))
    if (!title) return
    event.preventDefault()
    title.focus()
  }

  return (
    <div className="space-y-4">
      {buttons.length === 0 ? (
        <p className="text-sm text-muted-foreground">No buttons yet. Add one from your short links.</p>
      ) : (
        <ol className={cn("space-y-3", reorder.draggingIndex !== null && "select-none")}>
          {buttons.map((button, index) => (
            <ButtonRow
              key={button.urlId}
              idPrefix={idPrefix}
              button={button}
              error={errors[button.urlId]}
              busy={busy}
              dragging={reorder.draggingIndex === index}
              rowRef={reorder.rowRef(index)}
              handleProps={reorder.handleProps(index)}
              onUpdate={(patch) => update(button.urlId, patch)}
              onRemove={(event) => remove(index, event)}
            />
          ))}
        </ol>
      )}

      <div className="space-y-2">
        <LinkPickerDialog
          open={pickerOpen}
          onOpenChange={openPicker}
          exclude={new Set(buttons.map((button) => button.urlId))}
          full={full}
          limitText={BUTTON_LIMIT_TEXT}
          onPick={pick}
          onCloseAutoFocus={focusAfterPicker}
        >
          <Button
            ref={addRef}
            type="button"
            variant="outline"
            size="sm"
            aria-disabled={full || busy || undefined}
            aria-describedby={full ? limitId : undefined}
            onClick={(event) => {
              if (full || busy) event.preventDefault()
            }}
            className={cn("gap-1.5", DISABLED_CLASSES)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add from my links
          </Button>
        </LinkPickerDialog>
        {full && <p id={limitId} className="text-sm text-muted-foreground">{BUTTON_LIMIT_TEXT}</p>}
      </div>

      <p aria-live="assertive" className="sr-only">
        <span key={reorder.announcementId}>{reorder.announcement}</span>
      </p>
      <p aria-live="polite" className="sr-only">
        <span key={removal.id}>{removal.text}</span>
      </p>
    </div>
  )
}
