"use client"

import { useEffect, useEffectEvent, useId, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn, plural } from "@/lib/utils"
import {
  CANT_TAKE_UTM,
  QUICK_SOURCES,
  destinationToSend,
  followTags,
  hasUtmValues,
  pickQuickSource,
  readUtm,
  recentUtm,
  tooLongMessage,
  tooLongWithUtm,
  utmSignature,
  valuesNotAdded,
  withScheme,
  withUtm,
  type QuickSource,
  type UtmKey,
  type UtmValues,
} from "@/lib/utm"

interface UtmFieldsProps {
  destination: string
  value: UtmValues
  onChange: (next: UtmValues) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  variant?: "home" | "dialog" | "admin"
}

interface UtmField {
  key: UtmKey
  label: string
  placeholder?: string
}

const SOURCE_FIELD: UtmField = { key: "utm_source", label: "Source", placeholder: "e.g. instagram" }

const OTHER_FIELDS: UtmField[] = [
  { key: "utm_medium", label: "Medium", placeholder: "e.g. social" },
  { key: "utm_campaign", label: "Campaign", placeholder: "e.g. autumn-sale" },
  { key: "utm_term", label: "Term (optional)" },
  { key: "utm_content", label: "Content (optional)" },
]

const chipLabels: Partial<Record<string, string>> = { x: "X (Twitter)" }

export function UtmFields({ destination, value, onChange, open, onOpenChange, variant = "home" }: UtmFieldsProps) {
  const id = useId()
  const panelId = `${id}-panel`
  const toggleRef = useRef<HTMLButtonElement>(null)
  const [chipMedium, setChipMedium] = useState<string | null>(null)
  const inDialog = variant !== "home"
  const noun = variant === "admin" ? "destination" : "long URL"
  const target = withScheme(destination)
  const found = readUtm(target)
  const foundKey = utmSignature(found)
  const lastFound = useRef(found)
  const tagged = withUtm(target, value)
  const preview = tagged && utmSignature(value) === foundKey ? target : tagged
  const previewProblem = target ? CANT_TAKE_UTM : `Type the ${noun} above to see the final link.`
  const tooLong = tooLongWithUtm(destination, destinationToSend(destination, true, value))
  const missingSource = !value.utm_source?.trim() && Boolean(value.utm_medium?.trim() || value.utm_campaign?.trim())
  const notAdded = open ? 0 : valuesNotAdded(value, found)
  const recent = open ? recentUtm() : null
  const canFill = !hasUtmValues(value) && hasUtmValues(found)

  const followFoundTags = useEffectEvent(() => {
    const next = followTags(lastFound.current, found, value)
    lastFound.current = found
    if (!next) return
    onChange(next.value)
    if (next.reveal) onOpenChange(true)
  })

  useEffect(() => {
    followFoundTags()
  }, [foundKey])

  const toggle = () => {
    if (!open && canFill) onChange(found)
    onOpenChange(!open)
  }

  const turnOn = () => {
    onOpenChange(true)
    toggleRef.current?.focus()
  }

  const setField = (key: UtmKey, next: string) => {
    if (key === "utm_medium") setChipMedium(null)
    onChange({ ...value, [key]: next })
  }

  const choose = (pick: QuickSource) => {
    const next = pickQuickSource(value, pick, chipMedium)
    setChipMedium(next.chipMedium)
    onChange(next.value)
  }

  const renderField = ({ key, label, placeholder }: UtmField, aboveInput?: ReactNode) => {
    const suggestions = recent?.[key] ?? []
    const listId = `${id}-${key}-recent`
    return (
      <div key={key}>
        <Label htmlFor={`${id}-${key}`} className={inDialog ? undefined : "text-xs text-muted-foreground"}>{label}</Label>
        {aboveInput}
        <Input
          id={`${id}-${key}`}
          list={suggestions.length > 0 ? listId : undefined}
          placeholder={placeholder}
          value={value[key] ?? ""}
          onChange={(e) => setField(key, e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className={inDialog ? "mt-2" : "mt-1.5 h-9"}
        />
        {suggestions.length > 0 && (
          <datalist id={listId}>
            {suggestions.map((item) => <option key={item} value={item} />)}
          </datalist>
        )}
      </div>
    )
  }

  const quickPicks = (
    <div role="group" aria-label="Quick picks for Source" className={cn("flex flex-wrap gap-1.5", inDialog ? "mt-2" : "mt-1.5")}>
      {QUICK_SOURCES.map((pick) => {
        const picked = value.utm_source?.trim() === pick.source
        return (
          <button
            key={pick.source}
            type="button"
            aria-pressed={picked}
            onClick={() => choose(pick)}
            className={cn(
              "h-7 rounded-md border px-2.5 text-xs font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              picked ? "border-transparent bg-brand-soft text-brand" : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {chipLabels[pick.source] ?? pick.source}
          </button>
        )
      })}
    </div>
  )

  return (
    <div>
      <div className="flex items-center gap-3">
        <button
          ref={toggleRef}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={toggle}
          className="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md py-1 text-left text-sm font-medium ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <span className="min-w-0">
            Campaign tracking (UTM)
            {notAdded > 0 && <span className="font-normal text-muted-foreground"> · off, {plural(notAdded, "value")} not added</span>}
          </span>
          <ChevronDown aria-hidden="true" className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150", open && "rotate-180")} />
        </button>
        {notAdded > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={turnOn} className="h-7 shrink-0 px-2.5 text-xs">
            Turn on
          </Button>
        )}
      </div>

      <div id={panelId} hidden={!open} className="mt-3 space-y-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Adds UTM parameters to the {noun} so your analytics tool can tell where visitors came from. Your analytics tool reads
          them; hrva.cc keeps them in the link and lists them on its analytics page.{" "}
          <Link href="/help/utm" target="_blank" className="text-brand-link font-medium">
            What are UTM tags?<span className="sr-only"> (opens in a new tab)</span>
          </Link>
        </p>

        {renderField(SOURCE_FIELD, quickPicks)}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{OTHER_FIELDS.map((field) => renderField(field))}</div>

        <p className="text-xs text-muted-foreground">Use lowercase and dashes, for example autumn-sale.</p>

        <div className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
          {preview ? (
            <>
              <span className="text-muted-foreground">Your link will open:</span>
              <span className="mt-1 block break-all font-mono text-foreground">{preview}</span>
            </>
          ) : (
            <span aria-hidden="true" className="text-muted-foreground">{previewProblem}</span>
          )}
          <span role="status" className="sr-only">{preview ? "" : previewProblem}</span>
        </div>

        {tooLong && <p className="text-xs text-destructive">{tooLongMessage(noun)}</p>}
        {missingSource && <p className="text-xs text-muted-foreground">Add a Source too. Most analytics tools ignore campaign tags without one.</p>}
      </div>
    </div>
  )
}
