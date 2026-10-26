"use client"

import { useId, useRef, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { REQUEST_FAILED } from "@/lib/api-client"
import { cn } from "@/lib/utils"

export type BioPageReasonMode = "hide" | "revoke"

export const BIO_PAGE_REASON_MAX = 200

const HIDE_REASON = "Breaks the acceptable use rules in the terms"

const QUICK_REASONS = ["Impersonation", "Phishing or scam", "Spam", "Offensive content"] as const

const REASON_REQUIRED = "Reason is required"

const copy: Record<BioPageReasonMode, { submit: string; busy: string }> = {
  hide: { submit: "Hide page", busy: "Hiding…" },
  revoke: { submit: "Revoke handle", busy: "Revoking…" },
}

const titleFor = (mode: BioPageReasonMode, handle: string | null) => {
  const name = handle ? `@${handle}` : "this bio page"
  return mode === "hide" ? `Hide ${name}?` : `Revoke ${name}?`
}

const descriptionFor = (mode: BioPageReasonMode, handle: string | null) =>
  mode === "hide"
    ? "Visitors get \"This page isn't available.\" until you unhide it, and its open reviews are closed."
    : `The page loses its address and @${handle} is reserved, so nobody can use it. The owner sees the reason and can choose a new handle.`

export const errorText = (error: unknown) => (error instanceof Error && error.message ? error.message : REQUEST_FAILED)

interface BioPageReasonDialogProps {
  mode: BioPageReasonMode
  page: { handle: string | null } | null
  open: boolean
  onOpenChange(open: boolean): void
  onConfirm(reason: string): Promise<void>
  onCloseAutoFocus?(event: Event): void
}

export function BioPageReasonDialog({ mode, page, open, onOpenChange, onConfirm, onCloseAutoFocus }: BioPageReasonDialogProps) {
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next || !busy) onOpenChange(next) }}>
      <DialogContent
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (busy) event.preventDefault() }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {page && (
          <ReasonForm
            mode={mode}
            handle={page.handle}
            busy={busy}
            onBusyChange={setBusy}
            onCancel={() => onOpenChange(false)}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ReasonFormProps {
  mode: BioPageReasonMode
  handle: string | null
  busy: boolean
  onBusyChange(busy: boolean): void
  onCancel(): void
  onConfirm(reason: string): Promise<void>
}

function ReasonForm({ mode, handle, busy, onBusyChange, onCancel, onConfirm }: ReasonFormProps) {
  const id = useId()
  const [reason, setReason] = useState(mode === "hide" ? HIDE_REASON : "")
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const fieldId = `${id}-reason`
  const countId = `${id}-count`
  const errorId = `${id}-error`
  const atLimit = reason.length >= BIO_PAGE_REASON_MAX

  const change = (next: string) => {
    if (busy) return
    setReason(next.replace(/[\r\n]+/g, " "))
    setError(null)
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    const trimmed = reason.trim()
    if (!trimmed) {
      setError(REASON_REQUIRED)
      fieldRef.current?.focus()
      return
    }
    submitting.current = true
    onBusyChange(true)
    setError(null)
    try {
      await onConfirm(trimmed)
    } catch (confirmError) {
      setError(errorText(confirmError))
    } finally {
      submitting.current = false
      onBusyChange(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="leading-snug [overflow-wrap:anywhere]">{titleFor(mode, handle)}</DialogTitle>
        <DialogDescription className="[overflow-wrap:anywhere]">{descriptionFor(mode, handle)}</DialogDescription>
      </DialogHeader>

      {mode === "hide" && (
        <div role="group" aria-label="Quick reasons" className="flex flex-wrap gap-1.5">
          {QUICK_REASONS.map((quick) => {
            const picked = reason === quick
            return (
              <button
                key={quick}
                type="button"
                aria-pressed={picked}
                aria-disabled={busy}
                onClick={() => change(quick)}
                className={cn(
                  "min-h-8 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background aria-disabled:cursor-not-allowed aria-disabled:opacity-50",
                  picked && "border-brand bg-brand-soft text-brand hover:bg-brand-soft",
                )}
              >
                {quick}
              </button>
            )
          })}
        </div>
      )}

      <div>
        <Label htmlFor={fieldId}>Reason (shown to the owner)</Label>
        <Textarea
          ref={fieldRef}
          id={fieldId}
          value={reason}
          onChange={(event) => change(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }}
          readOnly={busy}
          maxLength={BIO_PAGE_REASON_MAX}
          rows={3}
          aria-invalid={error === REASON_REQUIRED}
          aria-describedby={error ? `${errorId} ${countId}` : countId}
          className="mt-1.5 resize-y"
        />
        <div className="mt-1.5 flex items-start gap-3">
          <p id={errorId} role="alert" className="min-w-0 flex-1 text-sm text-destructive [overflow-wrap:anywhere]">
            {error}
          </p>
          <p id={countId} className={cn("shrink-0 text-xs tabular-nums text-muted-foreground", atLimit && "text-warning")}>
            {reason.length}/{BIO_PAGE_REASON_MAX}
            <span className="sr-only"> characters</span>
          </p>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="destructive"
          aria-disabled={busy}
          aria-busy={busy}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          {busy ? copy[mode].busy : copy[mode].submit}
        </Button>
      </DialogFooter>
    </form>
  )
}
