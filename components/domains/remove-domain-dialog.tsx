"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LINK_MODE_HINTS, LINK_MODE_LABELS } from "@/lib/domains"
import type { DomainLinkMode } from "@/lib/types"

const LINK_MODES: DomainLinkMode[] = ["DEACTIVATE", "MOVE"]

export interface RemovableDomain {
  id: number
  hostname: string
  links: number
  withdraw: boolean
}

interface RemoveDomainDialogProps {
  domain: RemovableDomain | null
  busy: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (links: DomainLinkMode) => void
  onCloseAutoFocus: (event: Event) => void
  hints?: Record<DomainLinkMode, string>
  note?: string
}

export function RemoveDomainDialog({ domain, busy, onOpenChange, onConfirm, onCloseAutoFocus, hints = LINK_MODE_HINTS, note }: RemoveDomainDialogProps) {
  const prefix = useId()
  const [shown, setShown] = useState<RemovableDomain | null>(domain)
  const [mode, setMode] = useState<DomainLinkMode>("DEACTIVATE")

  if (domain !== null && domain.id !== shown?.id) {
    setShown(domain)
    setMode("DEACTIVATE")
  }

  const hostname = shown?.hostname ?? ""
  const withdraw = shown?.withdraw ?? false
  const withLinks = !withdraw && (shown?.links ?? 0) > 0

  return (
    <AlertDialog open={domain !== null} onOpenChange={(next) => { if (next || !busy) onOpenChange(next) }}>
      <AlertDialogContent
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onCloseAutoFocus={(event) => {
          setShown(null)
          onCloseAutoFocus(event)
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="[overflow-wrap:anywhere]">
            {withdraw ? `Withdraw your application for ${hostname}?` : `Remove ${hostname}?`}
          </AlertDialogTitle>
          <AlertDialogDescription className="[overflow-wrap:anywhere]">
            {withdraw
              ? "You can apply again later."
              : `${withLinks ? `Its links stop working on ${hostname} at once. ` : ""}This can't be undone.`}
            {!withdraw && note ? ` ${note}` : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {withLinks && (
          <fieldset className="space-y-2.5">
            <legend className="text-sm font-medium">What happens to its links?</legend>
            {LINK_MODES.map((option) => {
              const id = `${prefix}-${option}`
              return (
                <div key={option} className="flex items-start gap-2.5">
                  <input
                    id={id}
                    type="radio"
                    name={`${prefix}-links`}
                    value={option}
                    checked={mode === option}
                    onChange={() => setMode(option)}
                    aria-describedby={`${id}-hint`}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                  />
                  <div className="min-w-0">
                    <label htmlFor={id} className="text-sm leading-none">{LINK_MODE_LABELS[option]}</label>
                    <p id={`${id}-hint`} className="text-xs text-muted-foreground">{hints[option]}</p>
                  </div>
                </div>
              )
            })}
          </fieldset>
        )}
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel
            aria-disabled={busy}
            onClick={(event) => { if (busy) event.preventDefault() }}
            className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          >
            Cancel
          </AlertDialogCancel>
          <Button
            type="button"
            variant="destructive"
            onClick={() => { if (!busy) onConfirm(withLinks ? mode : "DEACTIVATE") }}
            aria-disabled={busy}
            aria-busy={busy}
            className="aria-disabled:opacity-50"
          >
            {withdraw ? (busy ? "Withdrawing..." : "Withdraw") : busy ? "Removing..." : "Remove domain"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
