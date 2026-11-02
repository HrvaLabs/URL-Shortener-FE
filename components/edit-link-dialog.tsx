"use client"

import { useId, useRef, useState, type FormEvent } from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { toast } from "sonner"
import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { UtmFields } from "@/components/utm-fields"
import { useDestinationChange, useUpdateUrl } from "@/lib/hooks/useUrls"
import { shortHost } from "@/lib/domains"
import { cn, destinationLengthError, formatDate, opensText, shortHostOf, VISIT_LIMIT_HINT } from "@/lib/utils"
import { CANT_TAKE_UTM, destinationToSend, hasUtm, readUtm, rememberUtm, tooLongMessage, tooLongWithUtm, withScheme, type UtmValues } from "@/lib/utm"
import {
  BLOCKED_ADMIN_LINE,
  BLOCKED_OWNER_LINE,
  INFO_FAILED,
  LOCKED_HEADING,
  SAVE_ANYWAY,
  TURN_ON_LABEL,
  canTurnBackOn,
  changesLeftText,
  destinationLocked,
  editErrorField,
  editLinkBody,
  editLinkPrefill,
  missingOf,
  requirementText,
  turnOnProblem,
  verdictHeading,
  verdictOf,
  type EditErrorField,
  type EditLinkForm,
  type LinkVerdict,
} from "@/lib/link-edit"
import type { MissingRequirement, UrlResponse, UrlUpdateDto } from "@/lib/types"

const emDash = String.fromCodePoint(0x2014)

interface EditLinkDialogProps {
  link: UrlResponse | null
  admin?: boolean
  onOpenChange(open: boolean): void
  onCloseAutoFocus?(event: Event): void
}

/** The Edit form for a link: the owner's on the dashboard, an admin's on All URLs (no destination rules, a "Save anyway" for the link checks' verdict). */
export function EditLinkDialog({ link, admin = false, onOpenChange, onCloseAutoFocus }: EditLinkDialogProps) {
  const [shown, setShown] = useState<UrlResponse | null>(link)
  const [busy, setBusy] = useState(false)
  const open = link !== null

  if (link !== null && link !== shown) setShown(link)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next || !busy) onOpenChange(next) }}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        onCloseAutoFocus={onCloseAutoFocus}
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (busy) event.preventDefault() }}
      >
        <DialogHeader>
          <DialogTitle className="leading-snug [overflow-wrap:anywhere]">
            Edit link {emDash} {shortHost(shown?.domain, shortHostOf())}/{shown?.shortUrl}
          </DialogTitle>
          <DialogDescription>
            {admin ? "Change any field. A new destination gets the link checks first." : "Change where the link points, its visit limit, expiry, password and tags."}
          </DialogDescription>
        </DialogHeader>
        {shown && <EditLinkFormBody key={shown.id} link={shown} admin={admin} busy={busy} onBusyChange={setBusy} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

interface EditLinkFormBodyProps {
  link: UrlResponse
  admin: boolean
  busy: boolean
  onBusyChange(busy: boolean): void
  onDone(): void
}

type FieldErrors = Partial<Record<EditErrorField | "turnOn", string>>

interface PendingVerdict extends LinkVerdict {
  detail: string
  body: UrlUpdateDto
}

function EditLinkFormBody({ link, admin, busy, onBusyChange, onDone }: EditLinkFormBodyProps) {
  const id = useId()
  const [form, setForm] = useState<EditLinkForm>(() => editLinkPrefill(link))
  const [utm, setUtm] = useState<UtmValues>(() => readUtm(withScheme(link.longUrl)))
  const [utmOpen, setUtmOpen] = useState(() => hasUtm(withScheme(link.longUrl)))
  const [errors, setErrors] = useState<FieldErrors>({})
  const [verdict, setVerdict] = useState<PendingVerdict | null>(null)
  const [refusedMissing, setRefusedMissing] = useState<MissingRequirement[] | null>(null)
  const submitting = useRef(false)
  const updateUrl = useUpdateUrl()
  const info = useDestinationChange(admin ? null : link.id)
  const locked = refusedMissing !== null || destinationLocked(admin, info.data)
  const missing = refusedMissing ?? info.data?.missing ?? []
  const leftText = refusedMissing ? null : changesLeftText(info.data)
  const lengthError = locked ? null : destinationLengthError(form.destination.trim())
  const ids = {
    destination: `${id}-destination`,
    locked: `${id}-locked`,
    destinationHint: `${id}-destination-hint`,
    visitLimit: `${id}-visit-limit`,
    expiry: `${id}-expiry`,
    tags: `${id}-tags`,
    password: `${id}-password`,
    turnOn: `${id}-turn-on`,
    verdict: `${id}-verdict`,
    form: `${id}-form-error`,
  }

  const change = (patch: Partial<EditLinkForm>, clear: (EditErrorField | "turnOn")[]) => {
    setVerdict(null)
    setForm((previous) => ({ ...previous, ...patch }))
    setErrors((previous) => {
      const next = { ...previous, form: undefined }
      for (const field of clear) next[field] = undefined
      return next
    })
  }

  const showError = (field: EditErrorField | "turnOn", message: string) => {
    flushSync(() => setErrors({ [field]: message }))
    const target = field === "form" ? ids.form : field === "turnOn" ? ids.turnOn : ids[field]
    document.getElementById(target)?.focus()
  }

  const save = async (body: UrlUpdateDto) => {
    if (submitting.current) return
    submitting.current = true
    onBusyChange(true)
    try {
      const saved = await updateUrl.mutateAsync({ id: link.id, data: body })
      if (utmOpen && body.longUrl !== undefined) rememberUtm(utm)
      toast.success(body.active && saved.active ? "Link saved and turned back on" : "Link saved")
      onDone()
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : "Couldn't save the link."
      const checks = admin ? verdictOf(error) : null
      if (checks) {
        flushSync(() => {
          setErrors({})
          setVerdict({ ...checks, detail: message, body })
        })
        document.getElementById(ids.verdict)?.focus()
        return
      }
      const refused = admin ? null : missingOf(error)
      if (refused) {
        flushSync(() => {
          setErrors({})
          setRefusedMissing(refused)
          setForm((previous) => ({ ...previous, destination: link.longUrl }))
        })
        document.getElementById(ids.locked)?.focus()
        return
      }
      showError(editErrorField(error, body.longUrl !== undefined), message)
    } finally {
      submitting.current = false
      onBusyChange(false)
    }
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    setVerdict(null)
    let destination = link.longUrl
    if (!locked) {
      const typed = form.destination.trim()
      if (!typed) return showError("destination", "Enter where the link should point.")
      if (lengthError) return showError("destination", lengthError)
      const withTags = destinationToSend(typed, utmOpen, utm)
      if (withTags === null) return showError("destination", `${CANT_TAKE_UTM} Collapse Campaign tracking (UTM) to save it as typed.`)
      if (tooLongWithUtm(typed, withTags)) return showError("destination", tooLongMessage(admin ? "destination" : "long URL"))
      destination = withTags
    }
    const turnOn = turnOnProblem(link, form)
    if (turnOn) return showError("turnOn", turnOn)
    void save(editLinkBody(link, form, { destination }))
  }

  const describedBy = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ") || undefined

  return (
    <form onSubmit={submit} noValidate className="min-w-0 space-y-4">
      {!link.active && <OffState link={link} admin={admin} form={form} error={errors.turnOn} inputId={ids.turnOn} busy={busy} onChange={(turnOn) => change({ turnOn }, ["turnOn"])} />}

      <div>
        <Label htmlFor={ids.destination}>Destination</Label>
        <Textarea
          id={ids.destination}
          rows={2}
          inputMode="url"
          spellCheck={false}
          autoCapitalize="off"
          placeholder="https://example.com/page"
          value={form.destination}
          readOnly={locked || busy}
          onChange={(event) => {
            setVerdict(null)
            change({ destination: event.target.value.replace(/[\r\n]+/g, "") }, ["destination"])
          }}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }}
          aria-invalid={errors.destination || lengthError ? true : undefined}
          aria-describedby={describedBy(
            (errors.destination || lengthError) && `${ids.destination}-error`,
            locked && missing.length > 0 && ids.locked,
            ids.destinationHint,
          )}
          className={cn("mt-2 min-h-0 resize-y [overflow-wrap:anywhere]", locked && "bg-muted/60 text-muted-foreground")}
        />
        {(errors.destination || lengthError) && (
          <p id={`${ids.destination}-error`} role="alert" className="mt-2 text-sm text-destructive [overflow-wrap:anywhere]">{errors.destination ?? lengthError}</p>
        )}
        <DestinationStatus
          admin={admin}
          loading={!admin && info.isPending}
          failed={!admin && info.isError && refusedMissing === null}
          retrying={info.isFetching}
          onRetry={() => { void info.refetch() }}
          locked={locked}
          missing={missing}
          lockedId={ids.locked}
          hintId={ids.destinationHint}
          leftText={leftText}
        />
      </div>

      {!locked && (
        <UtmFields
          destination={form.destination}
          value={utm}
          onChange={(next) => {
            setVerdict(null)
            setUtm(next)
          }}
          open={utmOpen}
          onOpenChange={setUtmOpen}
          variant={admin ? "admin" : "dialog"}
        />
      )}

      {verdict && (
        <div id={ids.verdict} tabIndex={-1} role="alert" className="space-y-2 rounded-lg border border-warning/40 bg-warning/5 p-3 text-sm outline-hidden">
          <p className="flex items-start gap-1.5 font-medium">
            <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <span className="[overflow-wrap:anywhere]">{verdictHeading(verdict)}</span>
          </p>
          {verdict.reasons.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 [overflow-wrap:anywhere]">
              {verdict.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          ) : (
            <p className="[overflow-wrap:anywhere]">{verdict.detail}</p>
          )}
          <p className="text-muted-foreground">Nothing was saved. {SAVE_ANYWAY} saves it without sending it to review, and the history marks it as saved anyway.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="destructive"
              aria-disabled={busy}
              aria-busy={busy}
              onClick={() => { if (!busy) void save({ ...verdict.body, force: true }) }}
              className="aria-disabled:opacity-50"
            >
              {busy ? "Saving..." : SAVE_ANYWAY}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => {
              setVerdict(null)
              document.getElementById(ids.destination)?.focus()
            }}>
              Change the destination
            </Button>
          </div>
        </div>
      )}

      <div>
        <Label htmlFor={ids.visitLimit}>Visit limit</Label>
        <Input
          id={ids.visitLimit}
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="No limit"
          value={form.visitLimit}
          readOnly={busy}
          onChange={(event) => change({ visitLimit: event.target.value }, ["visitLimit", "turnOn"])}
          aria-invalid={errors.visitLimit ? true : undefined}
          aria-describedby={describedBy(errors.visitLimit && `${ids.visitLimit}-error`, `${ids.visitLimit}-hint`)}
          className="mt-2"
        />
        <p id={`${ids.visitLimit}-hint`} className="mt-1.5 text-xs text-muted-foreground">
          {VISIT_LIMIT_HINT} Leave it empty for no limit.{link.visitLimit > 0 && ` Now: ${opensText(link)}.`}
        </p>
        {errors.visitLimit && <p id={`${ids.visitLimit}-error`} role="alert" className="mt-2 text-sm text-destructive [overflow-wrap:anywhere]">{errors.visitLimit}</p>}
      </div>

      <div>
        <Label htmlFor={ids.expiry}>Expires</Label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Input
            id={ids.expiry}
            type="datetime-local"
            value={form.expiry}
            readOnly={busy}
            onChange={(event) => change({ expiry: event.target.value }, ["expiry", "turnOn"])}
            aria-invalid={errors.expiry ? true : undefined}
            aria-describedby={describedBy(errors.expiry && `${ids.expiry}-error`, `${ids.expiry}-hint`)}
            className="w-auto min-w-0 flex-1"
          />
          {form.expiry && (
            <Button type="button" variant="outline" size="sm" onClick={() => { if (!busy) change({ expiry: "" }, ["expiry", "turnOn"]) }}>
              Remove expiry
            </Button>
          )}
        </div>
        <p id={`${ids.expiry}-hint`} className="mt-1.5 text-xs text-muted-foreground">Leave it empty for no expiry.</p>
        {errors.expiry && <p id={`${ids.expiry}-error`} role="alert" className="mt-2 text-sm text-destructive [overflow-wrap:anywhere]">{errors.expiry}</p>}
      </div>

      <div>
        <Label htmlFor={ids.tags}>Tags (comma-separated)</Label>
        <Input id={ids.tags} placeholder="work, personal" value={form.tags} readOnly={busy} onChange={(event) => change({ tags: event.target.value }, [])} className="mt-2" />
      </div>

      <div>
        <Label htmlFor={ids.password}>
          Password {link.passwordProtected && <span className="font-normal text-muted-foreground">(currently set)</span>}
        </Label>
        <Input
          id={ids.password}
          type="password"
          placeholder={link.passwordProtected ? "Enter a new password to replace it" : "Protect this link"}
          value={form.password}
          readOnly={busy}
          disabled={form.removePassword}
          onChange={(event) => change({ password: event.target.value }, ["password"])}
          autoComplete="new-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? `${ids.password}-error` : undefined}
          className="mt-2"
        />
        {errors.password && <p id={`${ids.password}-error`} role="alert" className="mt-2 text-sm text-destructive [overflow-wrap:anywhere]">{errors.password}</p>}
        {link.passwordProtected && (
          <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={form.removePassword}
              onChange={(event) => change({ removePassword: event.target.checked, password: "" }, ["password"])}
              className="h-4 w-4 accent-brand"
            />
            Remove password
          </label>
        )}
      </div>

      <p id={ids.form} tabIndex={-1} role="alert" className={cn("text-sm text-destructive outline-hidden [overflow-wrap:anywhere]", !errors.form && "sr-only")}>{errors.form}</p>

      <Button type="submit" aria-disabled={busy} aria-busy={busy} className="w-full aria-disabled:opacity-50">
        {busy ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}

interface OffStateProps {
  link: UrlResponse
  admin: boolean
  form: EditLinkForm
  error: string | undefined
  inputId: string
  busy: boolean
  onChange(turnOn: boolean): void
}

function OffState({ link, admin, form, error, inputId, busy, onChange }: OffStateProps) {
  const line =
    link.status === "EXPIRED" ? `This link expired on ${formatDate(link.expirationDate)}. Set a later expiry date or remove it.`
    : link.status === "LIMIT_REACHED" ? `This link used all its clicks (${opensText(link)}). Raise or remove its visit limit.`
    : link.status === "BLOCKED" ? (admin ? BLOCKED_ADMIN_LINE : BLOCKED_OWNER_LINE)
    : "This link is turned off."

  return (
    <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
      <p className="[overflow-wrap:anywhere]">{line}</p>
      {canTurnBackOn(link) && (
        <label className="flex cursor-pointer items-start gap-2">
          <input
            id={inputId}
            type="checkbox"
            checked={form.turnOn}
            onChange={(event) => { if (!busy) onChange(event.target.checked) }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
          />
          <span>{TURN_ON_LABEL}</span>
        </label>
      )}
      {error && <p id={`${inputId}-error`} role="alert" className="text-destructive [overflow-wrap:anywhere]">{error}</p>}
    </div>
  )
}

interface DestinationStatusProps {
  admin: boolean
  loading: boolean
  failed: boolean
  retrying: boolean
  onRetry(): void
  locked: boolean
  missing: MissingRequirement[]
  lockedId: string
  hintId: string
  leftText: string | null
}

function DestinationStatus({ admin, loading, failed, retrying, onRetry, locked, missing, lockedId, hintId, leftText }: DestinationStatusProps) {
  if (admin) return <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">Saving a new destination runs the link checks first.</p>
  if (loading) return <p id={hintId} role="status" className="mt-1.5 text-xs text-muted-foreground">Checking whether the destination can change...</p>
  if (failed) {
    return (
      <div id={hintId} className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        <span role="alert" className="text-destructive [overflow-wrap:anywhere]">{INFO_FAILED}</span>
        <Button type="button" variant="outline" size="sm" aria-disabled={retrying} onClick={() => { if (!retrying) onRetry() }} className="aria-disabled:opacity-50">
          Retry
        </Button>
      </div>
    )
  }
  if (locked && missing.length > 0) {
    return (
      <div className="mt-2 space-y-1.5 rounded-lg border bg-muted/40 p-3 text-sm">
        <div id={lockedId} tabIndex={-1} className="outline-hidden">
          <p className="font-medium">{LOCKED_HEADING}</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 [overflow-wrap:anywhere]">
            {missing.map((item) => <li key={item.code}>{requirementText(item)}</li>)}
          </ul>
        </div>
        <p id={hintId} className="text-muted-foreground">
          The rest of the link can still be edited.{" "}
          <Link href="/help/links#destination" target="_blank" className="underline underline-offset-2 hover:text-foreground">How changing a destination works</Link>
        </p>
      </div>
    )
  }
  if (locked) return <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">The destination can&apos;t change right now.</p>
  return <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">{leftText ?? "A new destination gets the same checks as a new link."}</p>
}
