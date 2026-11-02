"use client"

import { useId, useRef, useState, type FormEvent, type RefObject } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useDestinationStanding, useSetDestinationOverride } from "@/lib/hooks/useUsers"
import { OVERRIDES, OVERRIDE_HINTS, OVERRIDE_LABELS, goodStandingText, requirementText } from "@/lib/link-edit"
import { ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"
import type { DestinationChangeOverride, DestinationChangeStanding } from "@/lib/types"

interface StandingUser {
  id: number
  email: string
}

interface DestinationChangesDialogProps {
  user: StandingUser | null
  returnFocusRef: RefObject<HTMLElement | null>
  onOpenChange(open: boolean): void
}

const errorText = (error: unknown) => (error instanceof Error && error.message ? error.message : "Couldn't load the account's standing.")

/** Admin Users: whether an account can change where its links point, why, and the admin's override (Automatic, Always allowed, Never allowed). */
export function DestinationChangesDialog({ user, returnFocusRef, onOpenChange }: DestinationChangesDialogProps) {
  const [shown, setShown] = useState<StandingUser | null>(user)
  const [busy, setBusy] = useState(false)
  const open = user !== null

  if (user !== null && user.id !== shown?.id) setShown(user)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (next || !busy) onOpenChange(next) }}>
      <DialogContent
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        onCloseAutoFocus={(event) => {
          const target = returnFocusRef.current
          if (!target?.isConnected) return
          event.preventDefault()
          target.focus()
        }}
        onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }}
        onInteractOutside={(event) => { if (busy) event.preventDefault() }}
      >
        <DialogHeader>
          <DialogTitle className="leading-snug">Destination changes</DialogTitle>
          <DialogDescription className="[overflow-wrap:anywhere]">Whether {shown?.email} can change where their links point. Admins always can.</DialogDescription>
        </DialogHeader>
        {shown && <StandingBody key={shown.id} user={shown} open={open} busy={busy} onBusyChange={setBusy} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  )
}

interface StandingBodyProps {
  user: StandingUser
  open: boolean
  busy: boolean
  onBusyChange(busy: boolean): void
  onDone(): void
}

function StandingBody({ user, open, busy, onBusyChange, onDone }: StandingBodyProps) {
  const { data, error, isFetching, refetch } = useDestinationStanding(open ? user.id : null)

  if (data) return <StandingForm key={data.override} user={user} standing={data} busy={busy} onBusyChange={onBusyChange} onDone={onDone} />
  if (error) {
    return (
      <div className="space-y-3">
        <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">{errorText(error)}</p>
        <Button type="button" variant="outline" size="sm" aria-disabled={isFetching} onClick={() => { if (!isFetching) void refetch() }} className="aria-disabled:opacity-50">
          Retry
        </Button>
      </div>
    )
  }
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

interface StandingFormProps {
  user: StandingUser
  standing: DestinationChangeStanding
  busy: boolean
  onBusyChange(busy: boolean): void
  onDone(): void
}

function StandingForm({ user, standing, busy, onBusyChange, onDone }: StandingFormProps) {
  const id = useId()
  const [override, setOverride] = useState<DestinationChangeOverride>(standing.override)
  const [formError, setFormError] = useState<string | null>(null)
  const submitting = useRef(false)
  const setDestinationOverride = useSetDestinationOverride()

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    if (override === standing.override) return onDone()
    submitting.current = true
    onBusyChange(true)
    setFormError(null)
    try {
      await setDestinationOverride.mutateAsync({ userId: user.id, override })
      toast.success(`Destination changes for ${user.email}: ${OVERRIDE_LABELS[override]}`)
      onDone()
    } catch (saveError) {
      setFormError(saveError instanceof ApiError ? (saveError.fields.override ?? saveError.message) : errorText(saveError))
    } finally {
      submitting.current = false
      onBusyChange(false)
    }
  }

  return (
    <form onSubmit={save} noValidate className="grid min-w-0 gap-4">
      <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3 text-sm">
        <p className="font-medium [overflow-wrap:anywhere]">{standing.allowed ? "Can change destinations" : "Can't change destinations"} on hrva.cc links now</p>
        <p className="text-muted-foreground">{goodStandingText(standing)}{standing.missing.length > 0 ? ":" : "."}</p>
        {standing.missing.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-muted-foreground [overflow-wrap:anywhere]">
            {standing.missing.map((item) => <li key={item.code}>{requirementText(item)}</li>)}
          </ul>
        )}
      </div>

      <fieldset className="min-w-0">
        <legend className="text-sm font-medium">Override</legend>
        <div className="mt-2 grid gap-2">
          {OVERRIDES.map((value) => (
            <label key={value} className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 text-sm", override === value && "border-ring bg-brand-soft")}>
              <input
                type="radio"
                name={`${id}-override`}
                value={value}
                checked={override === value}
                onChange={() => {
                  if (busy) return
                  setOverride(value)
                  setFormError(null)
                }}
                aria-describedby={`${id}-${value}-hint`}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
              />
              <span className="min-w-0">
                <span className="block font-medium">{OVERRIDE_LABELS[value]}</span>
                <span id={`${id}-${value}-hint`} className="block text-muted-foreground [overflow-wrap:anywhere]">{OVERRIDE_HINTS[value]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="text-xs text-muted-foreground">The Destination changes switch in Site settings still turns changes off for every account.</p>

      <p role="alert" className={cn("text-sm text-destructive [overflow-wrap:anywhere]", !formError && "sr-only")}>{formError}</p>

      <DialogFooter>
        <Button type="submit" aria-disabled={busy} aria-busy={busy} className="aria-disabled:pointer-events-none aria-disabled:opacity-50">
          {busy ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  )
}
