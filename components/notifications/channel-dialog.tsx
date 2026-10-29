"use client"

import { useId, useRef, useState, type FormEvent } from "react"
import { flushSync } from "react-dom"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ApiError } from "@/lib/api-client"
import { useCreateChannel, useUpdateChannel } from "@/lib/hooks/useNotifications"
import {
  CHANNEL_EVENT_HINTS,
  CHANNEL_EVENT_LABELS,
  CHANNEL_FIELD_LABELS,
  CHANNEL_NAME_MAX,
  CHANNEL_TYPES,
  detectChannelType,
  type ChannelField,
  type ChannelTypeOption,
} from "@/lib/notifications"
import type { ChannelEvent, ChannelType, NotificationChannel, NotificationChannelInput } from "@/lib/types"
import { cn } from "@/lib/utils"

const EVENTS = Object.keys(CHANNEL_EVENT_LABELS) as ChannelEvent[]

const FIELD_ORDER = ["type", "name", "target", "botToken", "chatId", "accessToken"] as const

type FormField = (typeof FIELD_ORDER)[number]

const SAVED_HINT = "Saved. Leave empty to keep it."
const NO_EVENTS_HINT = "Nothing is ticked, so this channel won't get any messages until you tick an event."

const TYPE_HINTS: Record<ChannelType, string> = {
  DISCORD: "In Discord, open the channel's settings, then Integrations, then Webhooks, and copy the webhook URL.",
  SLACK: "In your Slack app's settings, turn on Incoming Webhooks and copy the URL for a channel.",
  TELEGRAM: "Create a bot with @BotFather, add it to your chat, and paste its token and the chat ID.",
  NTFY: "Any ntfy topic URL, on ntfy.sh or your own server. Add an access token if the topic is protected.",
  WEBHOOK: "We send signed JSON to this https address. Check the X-Hrva-Signature header to trust it.",
}

const FIELD_PLACEHOLDERS: Record<Exclude<ChannelField, "target">, string> = {
  botToken: "123456789:AAH4Fq2xYzExample",
  chatId: "-1001234567890 or @mychannel",
  accessToken: "tk_...",
}

const SECRET_FIELDS: ChannelField[] = ["target", "botToken", "accessToken"]

const PASSWORD_FIELDS: ChannelField[] = ["botToken", "accessToken"]

const optionOf = (type: ChannelType): ChannelTypeOption => CHANNEL_TYPES.find((option) => option.type === type) ?? CHANNEL_TYPES[0]

const fieldLabel = (option: ChannelTypeOption, field: ChannelField) =>
  field === "target" ? (option.targetLabel ?? "URL") : CHANNEL_FIELD_LABELS[field]

const isFormField = (key: string): key is FormField => (FIELD_ORDER as readonly string[]).includes(key)

interface ChannelDialogProps {
  mode: "create" | "edit"
  channel?: NotificationChannel
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (secret: string | null, channel: NotificationChannel) => void
  onCloseAutoFocus?: (event: Event) => void
}

export function ChannelDialog({ mode, channel, open, onOpenChange, onCreated, onCloseAutoFocus }: ChannelDialogProps) {
  const prefix = useId()
  const editing = mode === "edit" && channel !== undefined
  const create = useCreateChannel()
  const update = useUpdateChannel()
  const submitting = useRef(false)
  const [type, setType] = useState<ChannelType>(channel?.type ?? CHANNEL_TYPES[0].type)
  const [name, setName] = useState(channel?.name ?? "")
  const [values, setValues] = useState<Record<ChannelField, string>>({
    target: "",
    botToken: "",
    chatId: channel?.chatId ?? "",
    accessToken: "",
  })
  const [shown, setShown] = useState<ChannelField[]>([])
  const [events, setEvents] = useState<ChannelEvent[]>(channel?.events ?? [])
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [suggestedType, setSuggestedType] = useState<ChannelType | null>(null)
  const [busy, setBusy] = useState(false)

  const option = optionOf(type)
  const fieldId = (field: FormField) => `${prefix}-${field}`
  const errorId = (field: FormField) => `${prefix}-${field}-error`
  const hintId = (field: string) => `${prefix}-${field}-hint`

  const describedBy = (field: FormField, ...extra: (string | false | undefined)[]) =>
    [...extra, fieldErrors[field] && errorId(field)].filter(Boolean).join(" ") || undefined

  const clearError = (field: FormField) => {
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const isSaved = (field: ChannelField) => {
    if (!editing || !SECRET_FIELDS.includes(field)) return false
    return field === "accessToken" ? channel.hasAccessToken : true
  }

  const changeType = (next: ChannelType) => {
    setType(next)
    setSuggestedType(null)
    setFieldErrors({})
  }

  const switchToSuggested = () => {
    if (!suggestedType) return
    const next = optionOf(suggestedType)
    flushSync(() => changeType(suggestedType))
    document.getElementById(fieldId(next.fields[0]))?.focus()
  }

  const inputOf = (): NotificationChannelInput => {
    const value = (field: ChannelField) => (option.fields.includes(field) && values[field].trim() ? values[field].trim() : null)
    return {
      name,
      type,
      enabled: editing ? channel.enabled : true,
      events: EVENTS.filter((event) => events.includes(event)),
      target: value("target"),
      botToken: value("botToken"),
      chatId: value("chatId"),
      accessToken: value("accessToken"),
    }
  }

  const showErrors = (error: unknown) => {
    const fields = error instanceof ApiError ? error.fields : {}
    const known = Object.entries(fields).filter(([key]) => isFormField(key) && (key === "name" || key === "type" || option.fields.includes(key as ChannelField)))
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
      if (editing) {
        await update.mutateAsync({ id: channel.id, input: inputOf() })
        toast.success("Changes saved")
        onOpenChange(false)
      } else {
        const created = await create.mutateAsync(inputOf())
        onOpenChange(false)
        if (!created.signingSecret) toast.success("Channel added. Use Send test to check it.")
        onCreated(created.signingSecret ?? null, created)
      }
    } catch (error) {
      showErrors(error)
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  const toggleEvent = (event: ChannelEvent, checked: boolean) =>
    setEvents((current) => (checked ? [...current, event] : current.filter((candidate) => candidate !== event)))

  const fieldError = (field: FormField) =>
    fieldErrors[field] ? (
      <p id={errorId(field)} className="mt-1.5 text-sm text-destructive [overflow-wrap:anywhere]">{fieldErrors[field]}</p>
    ) : null

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next || !busy) onOpenChange(next) }}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (busy) event.preventDefault() }}
        onCloseAutoFocus={onCloseAutoFocus}
      >
        <DialogHeader>
          <DialogTitle className="[overflow-wrap:anywhere]">{editing ? `Edit ${channel.name}` : "Add channel"}</DialogTitle>
          <DialogDescription>Choose where notifications go and what they tell you.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <Label htmlFor={fieldId("type")}>Type</Label>
            <Select value={type} onValueChange={(next) => changeType(next as ChannelType)} disabled={editing}>
              <SelectTrigger
                id={fieldId("type")}
                className="mt-2"
                aria-invalid={fieldErrors.type ? true : undefined}
                aria-describedby={describedBy("type", editing && hintId("type"))}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNEL_TYPES.map((candidate) => (
                  <SelectItem key={candidate.type} value={candidate.type}>{candidate.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {editing && <p id={hintId("type")} className="mt-1.5 text-xs text-muted-foreground">To change the type, add a new channel.</p>}
            {fieldError("type")}
          </div>

          <div>
            <Label htmlFor={fieldId("name")}>Name</Label>
            <Input
              id={fieldId("name")}
              value={name}
              onChange={(event) => { setName(event.target.value); clearError("name") }}
              placeholder="Team alerts"
              autoComplete="off"
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={describedBy("name", hintId("name"))}
              className="mt-2"
            />
            <p
              id={hintId("name")}
              className={cn("mt-1.5 text-xs tabular-nums", name.length > CHANNEL_NAME_MAX ? "text-destructive" : "text-muted-foreground")}
            >
              {name.length}/{CHANNEL_NAME_MAX} characters
            </p>
            {fieldError("name")}
          </div>

          <div className="space-y-4">
            {option.fields.map((field) => {
              const saved = isSaved(field)
              const password = PASSWORD_FIELDS.includes(field)
              const visible = shown.includes(field)
              const savedMask = saved && field !== "accessToken" ? channel?.maskedTarget : undefined
              return (
                <div key={field}>
                  <Label htmlFor={fieldId(field)}>{fieldLabel(option, field)}</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id={fieldId(field)}
                      type={password && !visible ? "password" : field === "target" ? "url" : "text"}
                      inputMode={field === "target" ? "url" : undefined}
                      spellCheck={false}
                      autoComplete={password ? "new-password" : "off"}
                      data-1p-ignore={password || undefined}
                      data-lpignore={password ? "true" : undefined}
                      data-bwignore={password || undefined}
                      data-protonpass-ignore={password ? "true" : undefined}
                      value={values[field]}
                      onChange={(event) => {
                        const next = event.target.value
                        setValues((current) => ({ ...current, [field]: next }))
                        clearError(field)
                        if (field === "target") {
                          const detected = detectChannelType(next)
                          setSuggestedType(detected && detected !== type ? detected : null)
                        }
                      }}
                      placeholder={saved ? undefined : field === "target" ? option.targetPlaceholder : FIELD_PLACEHOLDERS[field]}
                      aria-invalid={fieldErrors[field] ? true : undefined}
                      aria-describedby={describedBy(field, saved && hintId(`${field}-keep`), savedMask && hintId(`${field}-saved`))}
                      className="font-mono text-[13px] placeholder:font-sans"
                    />
                    {password && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 shrink-0"
                        aria-pressed={visible}
                        aria-label={`Show ${fieldLabel(option, field).toLowerCase()}`}
                        onClick={() => setShown((current) => (visible ? current.filter((candidate) => candidate !== field) : [...current, field]))}
                      >
                        Show
                      </Button>
                    )}
                  </div>
                  {saved && (
                    <p id={hintId(`${field}-keep`)} className="mt-1.5 text-xs text-muted-foreground">
                      {SAVED_HINT}
                    </p>
                  )}
                  {savedMask && (
                    <p id={hintId(`${field}-saved`)} className="mt-1.5 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">
                      {savedMask}
                    </p>
                  )}
                  {fieldError(field)}
                  {field === "target" && suggestedType && (
                    <div role="status" className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                      <span>This looks like a {optionOf(suggestedType).label} URL.</span>
                      <Button type="button" variant="outline" size="sm" className="h-8 px-2.5" onClick={switchToSuggested}>
                        Switch to {optionOf(suggestedType).label}
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
            <p className="text-xs text-muted-foreground">
              {TYPE_HINTS[type]}{" "}
              <Link href={`/help/notifications${option.helpAnchor}`} className="text-brand-link">How to get this</Link>
            </p>
          </div>

          <fieldset aria-describedby={events.length === 0 ? hintId("no-events") : undefined}>
            <legend className="text-sm font-medium">Send me</legend>
            <div className="mt-2 space-y-2.5">
              {EVENTS.map((eventType) => {
                const id = `${prefix}-event-${eventType}`
                return (
                  <div key={eventType} className="flex items-start gap-2.5">
                    <input
                      id={id}
                      type="checkbox"
                      checked={events.includes(eventType)}
                      onChange={(event) => toggleEvent(eventType, event.target.checked)}
                      aria-describedby={hintId(`event-${eventType}`)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
                    />
                    <div className="min-w-0">
                      <Label htmlFor={id} className="font-normal">{CHANNEL_EVENT_LABELS[eventType]}</Label>
                      <p id={hintId(`event-${eventType}`)} className="text-xs text-muted-foreground">{CHANNEL_EVENT_HINTS[eventType]}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            {events.length === 0 && (
              <p id={hintId("no-events")} className="mt-2.5 text-xs text-muted-foreground">{NO_EVENTS_HINT}</p>
            )}
          </fieldset>

          {formError && <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">{formError}</p>}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" aria-disabled={busy} aria-busy={busy} className="aria-disabled:opacity-50">
              {busy ? (editing ? "Saving..." : "Adding...") : editing ? "Save changes" : "Add channel"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
