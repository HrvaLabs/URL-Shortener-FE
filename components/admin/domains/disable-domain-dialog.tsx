"use client"

import { useId, useRef, useState, type FormEvent } from "react"
import { errorText } from "@/components/admin/domains/review-domain-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api-client"
import { NOTE_MAX, REASON_REQUIRED } from "@/lib/domains"
import { cn } from "@/lib/utils"

interface DisableDomainDialogProps {
  hostname: string | null
  open: boolean
  onOpenChange(open: boolean): void
  onConfirm(note: string): Promise<void>
  onCloseAutoFocus(event: Event): void
}

export function DisableDomainDialog({ hostname, open, onOpenChange, onConfirm, onCloseAutoFocus }: DisableDomainDialogProps) {
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next || !busy) onOpenChange(next) }}>
      <DialogContent
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (busy) event.preventDefault() }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {hostname !== null && (
          <DisableForm
            key={hostname}
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

interface DisableFormProps {
  hostname: string
  busy: boolean
  onBusyChange(busy: boolean): void
  onCancel(): void
  onConfirm(note: string): Promise<void>
}

function DisableForm({ hostname, busy, onBusyChange, onCancel, onConfirm }: DisableFormProps) {
  const id = useId()
  const [note, setNote] = useState("")
  const [error, setError] = useState<{ text: string; field: boolean } | null>(null)
  const submitting = useRef(false)
  const fieldRef = useRef<HTMLTextAreaElement>(null)
  const fieldId = `${id}-note`
  const countId = `${id}-count`
  const errorId = `${id}-error`

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    const trimmed = note.trim()
    if (!trimmed) {
      setError({ text: REASON_REQUIRED, field: true })
      fieldRef.current?.focus()
      return
    }
    submitting.current = true
    onBusyChange(true)
    setError(null)
    try {
      await onConfirm(trimmed)
    } catch (confirmError) {
      const fieldText = confirmError instanceof ApiError ? confirmError.fields.note : undefined
      setError(fieldText ? { text: fieldText, field: true } : { text: errorText(confirmError), field: false })
      if (fieldText) fieldRef.current?.focus()
    } finally {
      submitting.current = false
      onBusyChange(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid min-w-0 gap-4">
      <DialogHeader>
        <DialogTitle className="leading-snug [overflow-wrap:anywhere]">Turn off {hostname}?</DialogTitle>
        <DialogDescription className="[overflow-wrap:anywhere]">
          Its links stop opening at once. It keeps its links and its Cloudflare slot until you turn it on or remove it. The owner gets an email with your reason.
        </DialogDescription>
      </DialogHeader>

      <div>
        <Label htmlFor={fieldId}>Reason (shown to the owner)</Label>
        <Textarea
          ref={fieldRef}
          id={fieldId}
          value={note}
          onChange={(event) => {
            if (busy) return
            setNote(event.target.value)
            setError(null)
          }}
          readOnly={busy}
          maxLength={NOTE_MAX}
          rows={3}
          aria-invalid={error?.field ?? false}
          aria-describedby={error ? `${errorId} ${countId}` : countId}
          className="mt-1.5 resize-y"
        />
        <div className="mt-1.5 flex items-start gap-3">
          <p id={errorId} role="alert" className="min-w-0 flex-1 text-sm text-destructive [overflow-wrap:anywhere]">
            {error?.text}
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
          variant="destructive"
          aria-disabled={busy}
          aria-busy={busy}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          {busy ? "Turning off..." : "Turn off"}
        </Button>
      </DialogFooter>
    </form>
  )
}
