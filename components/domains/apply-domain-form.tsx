"use client"

import { forwardRef, useId, useRef, useState, type FormEvent } from "react"
import { flushSync } from "react-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ApiError } from "@/lib/api-client"
import { HOSTNAME_PLACEHOLDER, REASON_MAX } from "@/lib/domains"
import { useApplyDomain } from "@/lib/hooks/useDomains"
import type { CustomDomain } from "@/lib/types"
import { cn } from "@/lib/utils"

const FIELD_ORDER = ["hostname", "reason"] as const

type FormField = (typeof FIELD_ORDER)[number]

const isFormField = (key: string): key is FormField => (FIELD_ORDER as readonly string[]).includes(key)

interface ApplyDomainFormProps {
  onApplied: (domain: CustomDomain) => void
}

export const ApplyDomainForm = forwardRef<HTMLInputElement, ApplyDomainFormProps>(function ApplyDomainForm({ onApplied }, hostnameRef) {
  const prefix = useId()
  const apply = useApplyDomain()
  const submitting = useRef(false)
  const [hostname, setHostname] = useState("")
  const [reason, setReason] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const fieldId = (field: FormField) => `${prefix}-${field}`
  const errorId = (field: FormField) => `${prefix}-${field}-error`
  const hintId = (field: FormField) => `${prefix}-${field}-hint`

  const describedBy = (field: FormField) => [hintId(field), fieldErrors[field] && errorId(field)].filter(Boolean).join(" ")

  const clearError = (field: FormField) => {
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const showErrors = (error: unknown) => {
    const conflict = error instanceof ApiError && error.status === 409 && Object.keys(error.fields).length === 0
    const fields = error instanceof ApiError ? (conflict ? { hostname: error.message } : error.fields) : {}
    const known = Object.entries(fields).filter(([key]) => isFormField(key))
    if (known.length === 0) {
      flushSync(() => {
        setFieldErrors({})
        setFormError(error instanceof Error && error.message ? error.message : "Something went wrong. Try again.")
      })
      return
    }
    const errors = Object.fromEntries(known) as Partial<Record<FormField, string>>
    flushSync(() => {
      setFieldErrors(errors)
      setFormError(null)
    })
    const first = FIELD_ORDER.find((field) => errors[field])
    if (first) document.getElementById(fieldId(first))?.focus()
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    setFormError(null)
    try {
      const created = await apply.mutateAsync({ hostname: hostname.trim(), reason })
      setHostname("")
      setReason("")
      setFieldErrors({})
      toast.success("Application sent. We'll email you when it's reviewed.")
      onApplied(created)
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
    <form onSubmit={handleSubmit} noValidate aria-labelledby={`${prefix}-heading`} className="space-y-4">
      <h4 id={`${prefix}-heading`} className="text-sm font-semibold">Apply for a domain</h4>
      <div>
        <Label htmlFor={fieldId("hostname")}>Domain</Label>
        <Input
          ref={hostnameRef}
          id={fieldId("hostname")}
          value={hostname}
          onChange={(event) => { setHostname(event.target.value); clearError("hostname") }}
          placeholder={HOSTNAME_PLACEHOLDER}
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={fieldErrors.hostname ? true : undefined}
          aria-describedby={describedBy("hostname")}
          className="mt-2"
        />
        <p id={hintId("hostname")} className="mt-1.5 text-xs text-muted-foreground">
          A subdomain you own. Root domains like example.com aren&apos;t supported yet.
        </p>
        {fieldError("hostname")}
      </div>
      <div>
        <Label htmlFor={fieldId("reason")}>What will you use it for?</Label>
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
      <Button type="submit" aria-disabled={busy} aria-busy={busy} className="aria-disabled:opacity-50">
        {busy ? "Applying..." : "Apply"}
      </Button>
    </form>
  )
})
