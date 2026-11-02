"use client"

import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from "react"
import { flushSync } from "react-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { parseServerDateTime } from "@/lib/analytics"
import { ApiError } from "@/lib/api-client"
import {
  DOMAIN_LIMIT_HIGHEST_LINE,
  DOMAIN_LIMIT_MAX,
  DOMAIN_REQUEST_MIN,
  DOMAIN_REQUEST_STATUS_LABELS,
  REASON_MAX,
  REASON_REQUIRED,
  domainRequestDefaultTotal,
  domainRequestHint,
  domainRequestTitle,
  domainRequestTotalError,
} from "@/lib/domains"
import { useRequestMoreDomains, useWithdrawDomainRequest } from "@/lib/hooks/useDomains"
import type { DomainRequest, DomainRequestStatus, MyDomains } from "@/lib/types"
import { cn, formatDate } from "@/lib/utils"

const FIELD_ORDER = ["requestedTotal", "reason"] as const

type FormField = (typeof FIELD_ORDER)[number]

type FieldErrors = Partial<Record<FormField, string>>

const isFormField = (key: string): key is FormField => (FIELD_ORDER as readonly string[]).includes(key)

const STATUS_BADGES: Record<DomainRequestStatus, "secondary" | "success" | "destructive"> = {
  WAITING: "secondary",
  APPROVED: "success",
  DECLINED: "destructive",
}

const serverDate = (value: string) => formatDate(parseServerDateTime(value))

const errorText = (error: unknown) => (error instanceof Error && error.message ? error.message : "Something went wrong. Try again.")

export function DomainRequestSection({ data }: { data: MyDomains }) {
  const openRef = useRef<HTMLButtonElement>(null)
  const statusRef = useRef<HTMLHeadingElement>(null)
  const focusAfter = useRef<"status" | "open" | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const atHighest = data.used >= data.limit && data.limit >= DOMAIN_LIMIT_MAX
  const request = data.request

  useEffect(() => {
    const wanted = focusAfter.current
    if (wanted === "status" && statusRef.current) {
      focusAfter.current = null
      statusRef.current.focus()
    } else if (wanted === "open" && openRef.current) {
      focusAfter.current = null
      openRef.current.focus()
    }
  }, [data])

  if (!request && !data.canRequest && !atHighest) return null

  return (
    <div className="space-y-4">
      {request && (
        <RequestStatus
          request={request}
          limit={data.limit}
          headingRef={statusRef}
          onWithdrawn={() => { focusAfter.current = "open" }}
        />
      )}
      {atHighest && <p className="text-sm text-muted-foreground">{DOMAIN_LIMIT_HIGHEST_LINE}</p>}
      {data.canRequest &&
        (formOpen ? (
          <RequestForm
            limit={data.limit}
            onCancel={() => {
              focusAfter.current = "open"
              setFormOpen(false)
            }}
            onSent={() => {
              focusAfter.current = "status"
              setFormOpen(false)
            }}
          />
        ) : (
          <Button ref={openRef} type="button" variant="outline" size="sm" onClick={() => setFormOpen(true)}>
            Request more domains
          </Button>
        ))}
    </div>
  )
}

interface RequestStatusProps {
  request: DomainRequest
  limit: number
  headingRef: RefObject<HTMLHeadingElement | null>
  onWithdrawn(): void
}

function RequestStatus({ request, limit, headingRef, onWithdrawn }: RequestStatusProps) {
  const withdraw = useWithdrawDomainRequest()
  const busy = withdraw.isPending

  const withdrawRequest = () => {
    if (busy) return
    withdraw.mutate(request.id, {
      onSuccess: () => {
        onWithdrawn()
        toast.success("Withdrew your request.")
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 404) onWithdrawn()
        toast.error(errorText(error))
      },
    })
  }

  return (
    <section aria-labelledby={`domain-request-${request.id}`} className="space-y-2 rounded-lg border px-4 py-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h4
          ref={headingRef}
          id={`domain-request-${request.id}`}
          tabIndex={-1}
          className="text-sm font-semibold focus-visible:outline-hidden"
        >
          {domainRequestTitle(request)}
        </h4>
        <div role="status">
          <Badge variant={STATUS_BADGES[request.status]} className="whitespace-nowrap">
            {DOMAIN_REQUEST_STATUS_LABELS[request.status]}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{domainRequestHint(request, limit)}</p>
      <p dir="auto" className="text-sm [overflow-wrap:anywhere]">{request.reason}</p>
      <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>Asked {serverDate(request.createdAt)}</span>
        {request.reviewedAt && <span>Reviewed {serverDate(request.reviewedAt)}</span>}
      </p>
      {request.adminNote && <p className="text-sm [overflow-wrap:anywhere]">Note from the admin: {request.adminNote}</p>}
      {request.status === "WAITING" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-disabled={busy}
          aria-busy={busy}
          onClick={withdrawRequest}
          className="h-8 border-destructive/40 px-2.5 text-destructive hover:bg-destructive/10 hover:text-destructive aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          {busy ? "Withdrawing..." : "Withdraw request"}
        </Button>
      )}
    </section>
  )
}

interface RequestFormProps {
  limit: number
  onCancel(): void
  onSent(): void
}

function RequestForm({ limit, onCancel, onSent }: RequestFormProps) {
  const prefix = useId()
  const send = useRequestMoreDomains()
  const submitting = useRef(false)
  const totalRef = useRef<HTMLInputElement>(null)
  const [total, setTotal] = useState(() => String(domainRequestDefaultTotal(limit)))
  const [reason, setReason] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    totalRef.current?.focus()
  }, [])

  const fieldId = (field: FormField) => `${prefix}-${field}`
  const errorId = (field: FormField) => `${prefix}-${field}-error`
  const hintId = (field: FormField) => `${prefix}-${field}-hint`
  const describedBy = (field: FormField) => [hintId(field), fieldErrors[field] && errorId(field)].filter(Boolean).join(" ")

  const clearError = (field: FormField) => {
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const focusFirst = (errors: FieldErrors) => {
    const first = FIELD_ORDER.find((field) => errors[field])
    if (first) document.getElementById(fieldId(first))?.focus()
  }

  const showErrors = (error: unknown) => {
    const fields = error instanceof ApiError ? error.fields : {}
    const known = Object.entries(fields).filter(([key]) => isFormField(key))
    if (known.length === 0) {
      flushSync(() => {
        setFieldErrors({})
        setFormError(errorText(error))
      })
      return
    }
    const errors = Object.fromEntries(known) as FieldErrors
    flushSync(() => {
      setFieldErrors(errors)
      setFormError(null)
    })
    focusFirst(errors)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    const errors: FieldErrors = {}
    const totalError = domainRequestTotalError(total, limit)
    if (totalError) errors.requestedTotal = totalError
    if (!reason.trim()) errors.reason = REASON_REQUIRED
    else if (reason.trim().length > REASON_MAX) errors.reason = `Keep it to ${REASON_MAX} characters or fewer`
    if (errors.requestedTotal || errors.reason) {
      flushSync(() => {
        setFieldErrors(errors)
        setFormError(null)
      })
      focusFirst(errors)
      return
    }
    submitting.current = true
    setBusy(true)
    setFormError(null)
    try {
      await send.mutateAsync({ requestedTotal: Number(total.trim()), reason })
      toast.success("Request sent. We'll email you when it's reviewed.")
      onSent()
    } catch (error) {
      showErrors(error)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  const fieldError = (field: FormField) =>
    fieldErrors[field] ? (
      <p id={errorId(field)} className="mt-1.5 text-sm text-destructive [overflow-wrap:anywhere]">{fieldErrors[field]}</p>
    ) : null

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby={`${prefix}-heading`} className="space-y-4 rounded-lg border px-4 py-4">
      <h4 id={`${prefix}-heading`} className="text-sm font-semibold">Request more domains</h4>
      <div>
        <Label htmlFor={fieldId("requestedTotal")}>How many custom domains in total?</Label>
        <Input
          ref={totalRef}
          id={fieldId("requestedTotal")}
          value={total}
          onChange={(event) => { setTotal(event.target.value); clearError("requestedTotal") }}
          type="number"
          inputMode="numeric"
          min={Math.max(DOMAIN_REQUEST_MIN, limit + 1)}
          max={DOMAIN_LIMIT_MAX}
          aria-invalid={fieldErrors.requestedTotal ? true : undefined}
          aria-describedby={describedBy("requestedTotal")}
          className="mt-2 w-28"
        />
        <p id={hintId("requestedTotal")} className="mt-1.5 text-xs text-muted-foreground">
          More than your limit of {limit}, up to {DOMAIN_LIMIT_MAX}.
        </p>
        {fieldError("requestedTotal")}
      </div>
      <div>
        <Label htmlFor={fieldId("reason")}>What will you use them for?</Label>
        <Textarea
          id={fieldId("reason")}
          value={reason}
          onChange={(event) => { setReason(event.target.value); clearError("reason") }}
          rows={3}
          aria-invalid={fieldErrors.reason ? true : undefined}
          aria-describedby={describedBy("reason")}
          className="mt-2"
        />
        <p
          id={hintId("reason")}
          className={cn("mt-1.5 text-xs tabular-nums", reason.length > REASON_MAX ? "text-destructive" : "text-muted-foreground")}
        >
          {reason.length}/{REASON_MAX} characters
        </p>
        {fieldError("reason")}
      </div>
      {formError && <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">{formError}</p>}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" aria-disabled={busy} aria-busy={busy} className="aria-disabled:opacity-50">
          {busy ? "Sending..." : "Send request"}
        </Button>
        <Button
          type="button"
          variant="outline"
          aria-disabled={busy}
          onClick={() => { if (!busy) onCancel() }}
          className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
