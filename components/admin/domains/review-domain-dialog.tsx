"use client"

import { useId, useRef, useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { REQUEST_FAILED } from "@/lib/api-client"
import { NOTE_MAX } from "@/lib/domains"
import { cn } from "@/lib/utils"

export type ReviewMode = "approve" | "reject"

const copy: Record<ReviewMode, { title: (hostname: string) => string; description: string; submit: string; busy: string }> = {
  approve: {
    title: (hostname) => `Approve ${hostname}?`,
    description: "We add it to Cloudflare, which uses one of the slots, and email the owner the CNAME record to add.",
    submit: "Approve",
    busy: "Approving...",
  },
  reject: {
    title: (hostname) => `Reject ${hostname}?`,
    description: "The owner gets an email, with your note if you add one, and can apply again.",
    submit: "Reject",
    busy: "Rejecting...",
  },
}

export const errorText = (error: unknown) => (error instanceof Error && error.message ? error.message : REQUEST_FAILED)

interface ReviewDomainDialogProps {
  mode: ReviewMode
  hostname: string | null
  open: boolean
  onOpenChange(open: boolean): void
  onConfirm(note: string | null): Promise<void>
  onCloseAutoFocus(event: Event): void
}

export function ReviewDomainDialog({ mode, hostname, open, onOpenChange, onConfirm, onCloseAutoFocus }: ReviewDomainDialogProps) {
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next || !busy) onOpenChange(next) }}>
      <DialogContent
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (busy) event.preventDefault() }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {hostname !== null && (
          <ReviewForm
            key={`${mode}-${hostname}`}
            mode={mode}
            hostname={hostname}
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

interface ReviewFormProps {
  mode: ReviewMode
  hostname: string
  busy: boolean
  onBusyChange(busy: boolean): void
  onCancel(): void
  onConfirm(note: string | null): Promise<void>
}

function ReviewForm({ mode, hostname, busy, onBusyChange, onCancel, onConfirm }: ReviewFormProps) {
  const id = useId()
  const [note, setNote] = useState("")
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  const fieldId = `${id}-note`
  const countId = `${id}-count`
  const errorId = `${id}-error`
  const text = copy[mode]

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    onBusyChange(true)
    setError(null)
    try {
      await onConfirm(note.trim() || null)
    } catch (confirmError) {
      setError(errorText(confirmError))
    } finally {
      submitting.current = false
      onBusyChange(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid min-w-0 gap-4">
      <DialogHeader>
        <DialogTitle className="leading-snug [overflow-wrap:anywhere]">{text.title(hostname)}</DialogTitle>
        <DialogDescription className="[overflow-wrap:anywhere]">{text.description}</DialogDescription>
      </DialogHeader>

      <div>
        <Label htmlFor={fieldId}>Note to the user (optional)</Label>
        <Textarea
          id={fieldId}
          value={note}
          onChange={(event) => { if (!busy) setNote(event.target.value) }}
          readOnly={busy}
          maxLength={NOTE_MAX}
          rows={3}
          aria-describedby={error ? `${errorId} ${countId}` : countId}
          className="mt-1.5 resize-y"
        />
        <div className="mt-1.5 flex items-start gap-3">
          <p id={errorId} role="alert" className="min-w-0 flex-1 text-sm text-destructive [overflow-wrap:anywhere]">
            {error}
          </p>
          <p id={countId} className={cn("shrink-0 text-xs tabular-nums text-muted-foreground", note.length >= NOTE_MAX && "text-warning")}>
            {note.length}/{NOTE_MAX}
            <span className="sr-only"> characters</span>
          </p>
        </div>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          aria-disabled={busy}
          onClick={() => { if (!busy) onCancel() }}
          className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant={mode === "reject" ? "destructive" : "default"}
          aria-disabled={busy}
          aria-busy={busy}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          {busy ? text.busy : text.submit}
        </Button>
      </DialogFooter>
    </form>
  )
}
