"use client"

import { useEffect, useEffectEvent, useId, useRef } from "react"
import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { QUICK_SOURCES, UTM_KEYS, hasUtmValues, readUtm, recentUtm, withScheme, withUtm, type UtmKey, type UtmValues } from "@/lib/utm"

interface UtmFieldsProps {
  destination: string
  value: UtmValues
  onChange: (next: UtmValues) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UtmField {
  key: UtmKey
  label: string
  placeholder?: string
}

const SOURCE_FIELD: UtmField = { key: "utm_source", label: "Source", placeholder: "instagram" }

const OTHER_FIELDS: UtmField[] = [
  { key: "utm_medium", label: "Medium", placeholder: "social" },
  { key: "utm_campaign", label: "Campaign", placeholder: "autumn-sale" },
  { key: "utm_term", label: "Term (optional)" },
  { key: "utm_content", label: "Content (optional)" },
]

const signature = (values: UtmValues) => UTM_KEYS.map((key) => values[key]?.trim() ?? "").join("\n")

export function UtmFields({ destination, value, onChange, open, onOpenChange }: UtmFieldsProps) {
  const id = useId()
  const panelId = `${id}-panel`
  const target = withScheme(destination)
  const found = readUtm(target)
  const foundKey = signature(found)
  const lastFoundKey = useRef(foundKey)
  const preview = withUtm(target, value)
  const recent = open ? recentUtm() : null
  const canFill = !hasUtmValues(value) && hasUtmValues(found)

  const followFoundTags = useEffectEvent(() => {
    const mirroring = !hasUtmValues(value) || signature(value) === lastFoundKey.current
    lastFoundKey.current = foundKey
    if (!mirroring) return
    if (hasUtmValues(found)) {
      onChange(found)
      onOpenChange(true)
    } else if (hasUtmValues(value)) {
      onChange({})
    }
  })

  useEffect(() => {
    followFoundTags()
  }, [foundKey])

  const toggle = () => {
    if (!open && canFill) onChange(found)
    onOpenChange(!open)
  }

  const setField = (key: UtmKey, next: string) => onChange({ ...value, [key]: next })

  const pickSource = (source: string, medium: string) =>
    onChange({ ...value, utm_source: source, utm_medium: value.utm_medium?.trim() ? value.utm_medium : medium })

  const renderField = ({ key, label, placeholder }: UtmField) => {
    const suggestions = recent?.[key] ?? []
    const listId = `${id}-${key}-recent`
    return (
      <div key={key}>
        <Label htmlFor={`${id}-${key}`} className="text-xs text-muted-foreground">{label}</Label>
        <Input
          id={`${id}-${key}`}
          list={suggestions.length > 0 ? listId : undefined}
          placeholder={placeholder}
          value={value[key] ?? ""}
          onChange={(e) => setField(key, e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className="mt-1.5 h-9"
        />
        {suggestions.length > 0 && (
          <datalist id={listId}>
            {suggestions.map((item) => <option key={item} value={item} />)}
          </datalist>
        )}
      </div>
    )
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={toggle}
        className="flex w-full items-center justify-between gap-2 rounded-md py-1 text-left text-sm font-medium ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Campaign tracking (UTM)
        <ChevronDown aria-hidden="true" className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150", open && "rotate-180")} />
      </button>

      <div id={panelId} hidden={!open} className="mt-3 space-y-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Adds tags to the destination so your analytics tool can tell where visitors came from. hrva.cc doesn&apos;t read them.{" "}
          <Link href="/help/utm" target="_blank" className="text-brand-link font-medium">
            What are UTM tags?<span className="sr-only"> (opens in a new tab)</span>
          </Link>
        </p>

        <div>
          {renderField(SOURCE_FIELD)}
          <div role="group" aria-label="Quick picks for Source" className="mt-2 flex flex-wrap gap-1.5">
            {QUICK_SOURCES.map(({ source, medium }) => {
              const picked = value.utm_source?.trim() === source
              return (
                <button
                  key={source}
                  type="button"
                  aria-pressed={picked}
                  onClick={() => pickSource(source, medium)}
                  className={cn(
                    "h-7 rounded-md border px-2.5 text-xs font-medium ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    picked ? "border-transparent bg-brand-soft text-brand" : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  {source}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{OTHER_FIELDS.map(renderField)}</div>

        <div aria-live="polite" aria-atomic="true" className="rounded-lg bg-muted/60 px-3 py-2 text-xs">
          {preview ? (
            <>
              <span className="text-muted-foreground">Your link will open:</span>
              <span className="mt-1 block break-all font-mono text-foreground">{preview}</span>
            </>
          ) : (
            <span className="text-muted-foreground">Add a valid destination first</span>
          )}
        </div>
      </div>
    </div>
  )
}
