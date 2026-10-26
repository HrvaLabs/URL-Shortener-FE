"use client"

import { useEffect, useId, useRef, useState, type FormEvent } from "react"
import { errorText } from "@/components/admin/bio-pages/bio-page-reason-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { BIO_LIMITS, displayShareUrl, handleFormatError, normalizeHandle } from "@/lib/bio"
import { cn, getShortBaseUrl } from "@/lib/utils"

const FORMAT_CHECK_DELAY_MS = 400

interface BioPageHandleDialogProps {
  page: { handle: string | null } | null
  open: boolean
  onOpenChange(open: boolean): void
  onConfirm(handle: string): Promise<void>
  onCloseAutoFocus?(event: Event): void
}

export function BioPageHandleDialog({ page, open, onOpenChange, onConfirm, onCloseAutoFocus }: BioPageHandleDialogProps) {
  const [busy, setBusy] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next || !busy) onOpenChange(next) }}>
      <DialogContent
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (busy) event.preventDefault() }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        {page && (
          <HandleForm
            currentHandle={page.handle}
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

interface HandleFormProps {
  currentHandle: string | null
  busy: boolean
  onBusyChange(busy: boolean): void
  onCancel(): void
  onConfirm(handle: string): Promise<void>
}

function HandleForm({ currentHandle, busy, onBusyChange, onCancel, onConfirm }: HandleFormProps) {
  const id = useId()
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const handle = normalizeHandle(value)
  const unchanged = handle === "" || handle === currentHandle
  const [settledHandle, setSettledHandle] = useState(handle)
  const formatError = !error && !unchanged && settledHandle === handle ? handleFormatError(handle) : null
  const shortBase = getShortBaseUrl()
  const inputId = `${id}-handle`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const formatId = `${id}-format`

  useEffect(() => {
    const timer = setTimeout(() => setSettledHandle(handle), FORMAT_CHECK_DELAY_MS)
    return () => clearTimeout(timer)
  }, [handle])

  const refuse = (message: string) => {
    setError(message)
    inputRef.current?.focus()
    inputRef.current?.select()
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current || unchanged) return
    const refusal = handleFormatError(handle)
    if (refusal) {
      refuse(refusal)
      return
    }
    submitting.current = true
    onBusyChange(true)
    setError(null)
    try {
      await onConfirm(handle)
    } catch (confirmError) {
      refuse(errorText(confirmError))
    } finally {
      submitting.current = false
      onBusyChange(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      <DialogHeader>
        <DialogTitle className="leading-snug [overflow-wrap:anywhere]">
          {currentHandle ? `Change handle for @${currentHandle}` : "Change handle for this page"}
        </DialogTitle>
        <DialogDescription className="[overflow-wrap:anywhere]">
          {currentHandle
            ? `${displayShareUrl(currentHandle, shortBase)} stops working right away, and @${currentHandle} is held for this page for 30 days.`
            : "The page gets this address. The owner can change it later."}
        </DialogDescription>
      </DialogHeader>

      <div>
        <Label htmlFor={inputId}>New handle</Label>
        <div
          className={cn(
            "mt-1.5 flex min-h-10 items-stretch overflow-hidden rounded-lg border border-input bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15",
            (error || formatError) && "border-destructive",
          )}
        >
          <span aria-hidden="true" className="flex shrink-0 select-none items-center border-r bg-muted/60 px-2.5 text-sm text-muted-foreground">
            {displayShareUrl("", shortBase)}
          </span>
          <input
            ref={inputRef}
            id={inputId}
            value={value}
            onChange={(event) => {
              if (busy) return
              setValue(event.target.value)
              setError(null)
            }}
            readOnly={busy}
            maxLength={BIO_LIMITS.handleMax + 1}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={!!error || !!formatError}
            aria-describedby={`${error ? errorId : formatId} ${hintId}`}
            className="min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm outline-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
          3 to 30 letters, numbers, hyphens and underscores.
        </p>
        <p id={formatId} aria-live="polite" className="mt-1 text-sm text-destructive [overflow-wrap:anywhere]">
          {formatError}
        </p>
        <p id={errorId} role="alert" className="mt-1 text-sm text-destructive [overflow-wrap:anywhere]">
          {error}
        </p>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={unchanged && !busy}
          aria-disabled={busy}
          aria-busy={busy}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          {busy ? "Changing…" : "Change handle"}
        </Button>
      </DialogFooter>
    </form>
  )
}
