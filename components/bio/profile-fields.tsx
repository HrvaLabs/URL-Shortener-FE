"use client"

import { useId } from "react"
import { AccentPicker } from "@/components/bio/accent-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BIO_LIMITS, EMOJI_SUGGESTIONS, isSingleEmoji, type BioDraft, type BioProfileField } from "@/lib/bio"
import type { BioAvatarKind, BioTheme } from "@/lib/types"
import { cn } from "@/lib/utils"

type LabelFor<Items extends readonly string[]> = { [Index in keyof Items]: string }

const EMOJI_LABELS: LabelFor<typeof EMOJI_SUGGESTIONS> = [
  "Sparkles",
  "Artist palette",
  "Camera with flash",
  "Musical note",
  "Video game",
  "Briefcase",
  "Herb",
  "Hot drink",
  "Rocket",
  "Light bulb",
  "Red heart",
  "Paw prints",
]

const AVATAR_OPTIONS: { value: BioAvatarKind; label: string }[] = [
  { value: "INITIALS", label: "Initials" },
  { value: "EMOJI", label: "Emoji" },
]

const THEME_OPTIONS: { value: BioTheme; label: string }[] = [
  { value: "AUTO", label: "Auto" },
  { value: "LIGHT", label: "Light" },
  { value: "DARK", label: "Dark" },
]

export type BioFieldErrors = Partial<Record<BioProfileField, string>>

export const profileFieldId = (prefix: string, field: BioProfileField) => `${prefix}-${field}`

function SegmentedRadios<T extends string>({
  legend,
  hint,
  value,
  options,
  onChange,
}: {
  legend: string
  hint?: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const name = useId()
  const hintId = `${name}-hint`
  return (
    <fieldset aria-describedby={hint ? hintId : undefined}>
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="mt-2 inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1">
        {options.map((option) => (
          <label key={option.value} className="relative cursor-pointer">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="peer sr-only"
            />
            <span className="inline-flex h-8 items-center rounded-md px-3 text-sm text-muted-foreground ring-offset-background transition-[color,background-color,box-shadow] duration-150 hover:text-foreground peer-checked:bg-background peer-checked:font-medium peer-checked:text-foreground peer-checked:shadow-[0_1px_2px_rgb(0_0_0/0.05)] peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2">
              {option.label}
            </span>
          </label>
        ))}
      </div>
      {hint && <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </fieldset>
  )
}

function Counter({ id, length, max }: { id: string; length: number; max: number }) {
  return (
    <p id={id} className={cn("text-xs tabular-nums text-muted-foreground", length >= max && "text-warning")}>
      {length}/{max}
    </p>
  )
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return <p id={id} className="text-sm text-destructive [overflow-wrap:anywhere]">{message}</p>
}

type FieldsProps = {
  idPrefix: string
  draft: BioDraft
  errors: BioFieldErrors
  onChange: (patch: Partial<BioDraft>) => void
}

export function ProfileFields({ idPrefix, draft, errors, onChange }: FieldsProps) {
  const nameId = profileFieldId(idPrefix, "displayName")
  const bioId = profileFieldId(idPrefix, "bio")

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={nameId}>Display name</Label>
          <Counter id={`${nameId}-count`} length={draft.displayName.length} max={BIO_LIMITS.displayName} />
        </div>
        <Input
          id={nameId}
          value={draft.displayName}
          onChange={(event) => onChange({ displayName: event.target.value })}
          maxLength={BIO_LIMITS.displayName}
          autoComplete="off"
          placeholder="Your name, as visitors should see it"
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? `${nameId}-error ${nameId}-count` : `${nameId}-count`}
          className="mt-1.5"
        />
        <div className="mt-1.5">
          <FieldError id={`${nameId}-error`} message={errors.displayName} />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <Label htmlFor={bioId}>Bio</Label>
          <Counter id={`${bioId}-count`} length={draft.bio.length} max={BIO_LIMITS.bio} />
        </div>
        <Textarea
          id={bioId}
          value={draft.bio}
          onChange={(event) => onChange({ bio: event.target.value })}
          maxLength={BIO_LIMITS.bio}
          rows={3}
          aria-invalid={Boolean(errors.bio)}
          aria-describedby={[errors.bio && `${bioId}-error`, `${bioId}-hint`, `${bioId}-count`].filter(Boolean).join(" ")}
          className="mt-1.5"
        />
        <div className="mt-1.5 space-y-1">
          <FieldError id={`${bioId}-error`} message={errors.bio} />
          <p id={`${bioId}-hint`} className="text-xs text-muted-foreground">
            Plain text. Links in your bio aren&apos;t clickable; add them as buttons below.
          </p>
        </div>
      </div>
    </div>
  )
}

export function LookFields({ idPrefix, draft, errors, onChange }: FieldsProps) {
  const emojiId = profileFieldId(idPrefix, "avatarEmoji")
  const emoji = draft.avatarEmoji.trim()
  const emojiLooksWrong = emoji !== "" && !isSingleEmoji(emoji)

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SegmentedRadios legend="Avatar" value={draft.avatarKind} options={AVATAR_OPTIONS} onChange={(avatarKind) => onChange({ avatarKind })} />
        {draft.avatarKind === "EMOJI" && (
          <div className="space-y-2">
            <Label htmlFor={emojiId}>Your emoji</Label>
            <Input
              id={emojiId}
              value={draft.avatarEmoji}
              onChange={(event) => onChange({ avatarEmoji: event.target.value })}
              maxLength={16}
              autoComplete="off"
              aria-invalid={Boolean(errors.avatarEmoji) || emojiLooksWrong}
              aria-describedby={`${emojiId}-hint`}
              className="w-28 text-xl"
            />
            <p
              id={`${emojiId}-hint`}
              className={cn("text-xs text-muted-foreground", (errors.avatarEmoji || emojiLooksWrong) && "text-destructive")}
            >
              {errors.avatarEmoji ?? "Paste or type one emoji."}
            </p>
            <div role="group" aria-label="Suggested emoji" className="flex flex-wrap gap-1.5">
              {EMOJI_SUGGESTIONS.map((suggestion, index) => {
                const pressed = emoji === suggestion
                return (
                  <button
                    key={suggestion}
                    type="button"
                    aria-label={EMOJI_LABELS[index]}
                    aria-pressed={pressed}
                    onClick={() => onChange({ avatarEmoji: pressed ? "" : suggestion })}
                    className={cn(
                      "inline-flex size-10 items-center justify-center rounded-lg border border-input bg-background text-xl transition-colors hover:bg-accent",
                      pressed && "border-ring bg-brand-soft",
                    )}
                  >
                    <span aria-hidden="true">{suggestion}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <AccentPicker value={draft.accent} onChange={(accent) => onChange({ accent })} />

      <SegmentedRadios
        legend="Theme"
        hint="Auto matches each visitor's device."
        value={draft.theme}
        options={THEME_OPTIONS}
        onChange={(theme) => onChange({ theme })}
      />
    </div>
  )
}
