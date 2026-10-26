"use client"

import { useId } from "react"
import { BIO_ACCENTS } from "@/lib/bio"
import type { BioAccent } from "@/lib/types"

const ACCENT_KEYS = Object.keys(BIO_ACCENTS) as BioAccent[]

export function AccentPicker({ value, onChange }: { value: BioAccent; onChange: (accent: BioAccent) => void }) {
  const name = useId()
  const selected = BIO_ACCENTS[value] ?? BIO_ACCENTS.BLUE

  return (
    <fieldset>
      <legend className="text-sm font-medium">Accent colour</legend>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex flex-wrap gap-2">
          {ACCENT_KEYS.map((key) => {
            const accent = BIO_ACCENTS[key]
            return (
              <label key={key} className="relative cursor-pointer">
                <input
                  type="radio"
                  name={name}
                  value={key}
                  checked={value === key}
                  onChange={() => onChange(key)}
                  aria-label={accent.label}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="block size-9 rounded-full border border-foreground/15 ring-offset-2 ring-offset-background transition-shadow peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[6px] peer-focus-visible:outline-ring"
                  style={{ background: `linear-gradient(135deg, ${accent.light} 50%, ${accent.dark} 50%)` }}
                />
              </label>
            )
          })}
        </div>
        <span aria-hidden="true" className="text-sm text-muted-foreground">{selected.label}</span>
      </div>
    </fieldset>
  )
}
