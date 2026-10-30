"use client"

import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { parseServerDateTime } from "@/lib/analytics"
import { errorText } from "@/components/admin/domains/review-domain-dialog"
import { ApiError } from "@/lib/api-client"
import { DOMAIN_LIMIT_MAX, DOMAIN_LIMIT_MIN, REASON_MAX, REASON_REQUIRED, domainLimitError, domainLimitText } from "@/lib/domains"
import { useDomainAllowance, useRemoveDomainAllowance, useSetDomainAllowance } from "@/lib/hooks/useDomains"
import type { DomainAllowance } from "@/lib/types"
import { cn, formatDate, plural } from "@/lib/utils"

interface LimitUser {
  id: number
  email: string
}

interface DomainLimitDialogProps {
  user: LimitUser | null
  returnFocusRef: RefObject<HTMLElement | null>
  onOpenChange(open: boolean): void
}

const serverDate = (value: string) => formatDate(parseServerDateTime(value))

export function DomainLimitDialog({ user, returnFocusRef, onOpenChange }: DomainLimitDialogProps) {
  const [shown, setShown] = useState<LimitUser | null>(user)
  const [busy, setBusy] = useState(false)
  const open = user !== null

  if (user !== null && user.id !== shown?.id) setShown(user)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next || !busy) onOpenChange(next) }}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current
          if (!target?.isConnected) return
          event.preventDefault()
          target.focus()
        }}
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (busy) event.preventDefault() }}
      >
        {shown && <LimitBody key={shown.id} user={shown} open={open} busy={busy} onBusyChange={setBusy} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

interface LimitBodyProps {
  user: LimitUser
  open: boolean
  busy: boolean
  onBusyChange(busy: boolean): void
  onDone(): void
}

function LimitBody({ user, open, busy, onBusyChange, onDone }: LimitBodyProps) {
  const { data, error, isFetching, refetch } = useDomainAllowance(open ? user.id : null)

  return (
    <div className="grid min-w-0 gap-4">
      <DialogHeader>
        <DialogTitle className="leading-snug">Domain limit</DialogTitle>
        <DialogDescription className="[overflow-wrap:anywhere]">How many custom domains {user.email} can have at once.</DialogDescription>
      </DialogHeader>
      {data ? (
        <LimitForm key={`${data.maxDomains}-${data.grantedAt ?? ""}`} user={user} allowance={data} busy={busy} onBusyChange={onBusyChange} onDone={onDone} />
      ) : error ? (
        <div className="space-y-3">
          <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">{errorText(error)}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-disabled={isFetching}
            onClick={() => { if (!isFetching) void refetch() }}
            className="aria-disabled:opacity-50"
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-3" aria-busy="true">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      )}
    </div>
  )
}

interface FieldErrors {
  maxDomains?: string
  reason?: string
  form?: string
}

interface LimitFormProps {
  user: LimitUser
  allowance: DomainAllowance
  busy: boolean
  onBusyChange(busy: boolean): void
  onDone(): void
}

function LimitForm({ user, allowance, busy, onBusyChange, onDone }: LimitFormProps) {
  const id = useId()
  const custom = allowance.grantedBy !== null
  const [maxDomains, setMaxDomains] = useState(String(allowance.maxDomains))
  const [reason, setReason] = useState(custom ? (allowance.reason ?? "") : "")
  const [errors, setErrors] = useState<FieldErrors>({})
  const [pending, setPending] = useState<"save" | "reset" | null>(null)
  const submitting = useRef(false)
  const maxRef = useRef<HTMLInputElement>(null)
  const reasonRef = useRef<HTMLTextAreaElement>(null)
  const setAllowance = useSetDomainAllowance()
  const removeAllowance = useRemoveDomainAllowance()
  const maxId = `${id}-max`
  const reasonId = `${id}-reason`
  const maxErrorId = `${id}-max-error`
  const reasonErrorId = `${id}-reason-error`
  const maxHintId = `${id}-max-hint`

  useEffect(() => {
    maxRef.current?.focus()
    maxRef.current?.select()
  }, [])

  const run = async (kind: "save" | "reset", action: () => Promise<void>) => {
    if (submitting.current) return
    submitting.current = true
    setPending(kind)
    onBusyChange(true)
    try {
      await action()
      onDone()
    } finally {
      submitting.current = false
      setPending(null)
      onBusyChange(false)
    }
  }

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    const next: FieldErrors = {}
    const rangeError = domainLimitError(maxDomains)
    if (rangeError) next.maxDomains = rangeError
    if (!reason.trim()) next.reason = REASON_REQUIRED
    setErrors(next)
    if (next.maxDomains) return maxRef.current?.focus()
    if (next.reason) return reasonRef.current?.focus()
    const value = Number(maxDomains.trim())
    void run("save", async () => {
      try {
        await setAllowance.mutateAsync({ userId: user.id, maxDomains: value, reason: reason.trim() })
        toast.success(`${user.email} can now have ${plural(value, "custom domain")}`)
      } catch (saveError) {
        showError(saveError)
        throw saveError
      }
    }).catch(() => undefined)
  }

  const reset = () => {
    void run("reset", async () => {
      try {
        await removeAllowance.mutateAsync(user.id)
        toast.success(`${user.email} is back to the default domain limit`)
      } catch (resetError) {
        showError(resetError)
        throw resetError
      }
    }).catch(() => undefined)
  }

  const showError = (failure: unknown) => {
    const fields = failure instanceof ApiError ? failure.fields : {}
    if (fields.maxDomains || fields.reason) {
      setErrors({ maxDomains: fields.maxDomains, reason: fields.reason })
      if (fields.maxDomains) maxRef.current?.focus()
      else reasonRef.current?.focus()
      return
    }
    setErrors({ form: errorText(failure) })
  }

  return (
    <form onSubmit={save} noValidate className="grid min-w-0 gap-4">
      <p data-domain-limit-now className="text-sm [overflow-wrap:anywhere]">
        <span className="text-muted-foreground">Now: </span>
        {domainLimitText(allowance, serverDate)}
      </p>

      <div>
        <Label htmlFor={maxId}>Max domains</Label>
        <Input
          ref={maxRef}
          id={maxId}
          type="number"
          inputMode="numeric"
          min={DOMAIN_LIMIT_MIN}
          max={DOMAIN_LIMIT_MAX}
          step={1}
          value={maxDomains}
          readOnly={busy}
          onChange={(event) => {
            setMaxDomains(event.target.value)
            setErrors((previous) => ({ ...previous, maxDomains: undefined, form: undefined }))
          }}
          aria-invalid={!!errors.maxDomains}
          aria-describedby={errors.maxDomains ? `${maxErrorId} ${maxHintId}` : maxHintId}
          className="mt-1.5 w-28"
        />
        <p id={maxHintId} className="mt-1 text-xs text-muted-foreground">From {DOMAIN_LIMIT_MIN} to {DOMAIN_LIMIT_MAX}.</p>
        <p id={maxErrorId} role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">{errors.maxDomains}</p>
      </div>

      <div>
        <Label htmlFor={reasonId}>Reason</Label>
        <Textarea
          ref={reasonRef}
          id={reasonId}
          value={reason}
          readOnly={busy}
          maxLength={REASON_MAX}
          rows={2}
          onChange={(event) => {
            setReason(event.target.value)
            setErrors((previous) => ({ ...previous, reason: undefined, form: undefined }))
          }}
          aria-invalid={!!errors.reason}
          aria-describedby={errors.reason ? reasonErrorId : undefined}
          className="mt-1.5 resize-y"
        />
        <p id={reasonErrorId} role="alert" className="mt-1 text-sm text-destructive [overflow-wrap:anywhere]">{errors.reason}</p>
      </div>

      <p role="alert" className={cn("text-sm text-destructive [overflow-wrap:anywhere]", !errors.form && "sr-only")}>{errors.form}</p>

      <DialogFooter className="gap-2 sm:gap-0">
        {custom && (
          <Button
            type="button"
            variant="outline"
            aria-disabled={busy}
            aria-busy={pending === "reset"}
            onClick={() => { if (!busy) reset() }}
            className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50 sm:mr-auto"
          >
            {pending === "reset" ? "Resetting..." : "Back to default"}
          </Button>
        )}
        <Button
          type="submit"
          aria-disabled={busy}
          aria-busy={pending === "save"}
          className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
        >
          {pending === "save" ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  )
}
