"use client"

import { useId, useRef, useState, useEffect, type FormEvent, type ReactNode } from "react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { parseServerDateTime } from "@/lib/analytics"
import { ApiError } from "@/lib/api-client"
import { useChangeSetting, useResetSetting } from "@/lib/hooks/useSettings"
import { NOT_AVAILABLE, noEffectText, settingValueText, switchChecked, switchUnavailable } from "@/lib/moderation"
import type { SettingResponse, SettingValue } from "@/lib/types"
import { cn, formatDateTime } from "@/lib/utils"

const SAFETY_OFF_BODY = "It stays off until you turn it back on. Site settings and Stats show a warning while it's off."

const busyClassName = "aria-disabled:cursor-not-allowed aria-disabled:opacity-50"

const wrap = "[overflow-wrap:anywhere]"

interface RowIds {
  label: string
  description: string
  input: string
  error: string
  reason: string
}

interface EditorProps {
  setting: SettingResponse
  ids: RowIds
  busy: boolean
  error: string | null
  version: number
  onEdit: () => void
  onSave: (value: SettingValue) => void
  onInvalid: (text: string) => void
  controlRef: (node: HTMLElement | null) => void
}

function useDraft<T>(current: T, version: number): [T, (next: T) => void, boolean] {
  const token = `${version}:${JSON.stringify(current)}`
  const [state, setState] = useState<{ token: string; draft: T | undefined }>({ token, draft: undefined })
  if (state.token !== token) setState({ token, draft: undefined })
  const draft = state.token === token ? state.draft : undefined
  const value = draft === undefined ? current : draft
  return [value, (next) => setState({ token, draft: next }), JSON.stringify(value) !== JSON.stringify(current)]
}

function rangeText(setting: SettingResponse): string {
  if (setting.min == null || setting.max == null) return "Use a whole number."
  return `Use a number from ${setting.min.toLocaleString("en-US")} to ${setting.max.toLocaleString("en-US")}.`
}

function SaveButton({ busy, dirty, label }: { busy: boolean; dirty: boolean; label: string }) {
  const blocked = busy || !dirty
  return (
    <Button type="submit" size="sm" className={cn("h-9", busyClassName)} aria-disabled={blocked} aria-busy={busy} onClick={(event) => { if (blocked) event.preventDefault() }}>
      Save<span className="sr-only"> {label}</span>
    </Button>
  )
}

function FieldError({ id, error }: { id: string; error: string | null }) {
  if (!error) return null
  return (
    <p id={id} role="alert" className={cn("mt-1.5 text-sm text-destructive", wrap)}>
      {error}
    </p>
  )
}

function TextEditor({ setting, ids, busy, error, version, onEdit, onSave, controlRef }: EditorProps) {
  const isAddresses = setting.type === "ADDRESSES"
  const current = isAddresses ? ((setting.value as string[] | null) ?? []).join(", ") : String(setting.value ?? "")
  const [text, setText, dirty] = useDraft(current, version)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (busy || !dirty) return
    onSave(isAddresses ? text.split(",").map((entry) => entry.trim()).filter(Boolean) : text)
  }
  return (
    <form onSubmit={submit} className="mt-3">
      <div className="flex flex-wrap items-start gap-2">
        <Input
          id={ids.input}
          ref={controlRef}
          value={text}
          onChange={(event) => { setText(event.target.value); onEdit() }}
          readOnly={busy}
          aria-disabled={busy}
          aria-busy={busy}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${ids.description} ${ids.error}` : ids.description}
          autoComplete="off"
          spellCheck={false}
          className={cn("h-9 min-w-0 flex-1 basis-56 sm:max-w-md", busyClassName)}
        />
        <SaveButton busy={busy} dirty={dirty} label={setting.label} />
      </div>
      <FieldError id={ids.error} error={error} />
    </form>
  )
}

function NumberEditor({ setting, ids, busy, error, version, onEdit, onSave, onInvalid, controlRef }: EditorProps) {
  const current = setting.value == null ? "" : String(setting.value)
  const [text, setText, textDirty] = useDraft(current, version)
  const [none, setNone, noneDirty] = useDraft(setting.value == null, version)
  const nullable = setting.nullable
  const noneLabel = setting.noneLabel ?? "None"
  const dirty = nullable ? noneDirty || (!none && textDirty) : textDirty
  const unit = setting.unit
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (busy || !dirty) return
    if (nullable && none) return onSave(null)
    if (!/^\d+$/.test(text.trim())) return onInvalid(rangeText(setting))
    onSave(Number(text.trim()))
  }
  const input = (
    <Input
      id={ids.input}
      ref={nullable ? undefined : controlRef}
      value={text}
      onChange={(event) => { setText(event.target.value); onEdit() }}
      readOnly={busy}
      disabled={nullable && none}
      aria-disabled={busy}
      aria-busy={busy}
      aria-invalid={error ? true : undefined}
      aria-label={nullable ? `${setting.label}${unit ? `, ${unit}` : ""}` : undefined}
      aria-describedby={error ? `${ids.description} ${ids.error}` : ids.description}
      inputMode="numeric"
      autoComplete="off"
      className={cn("h-9 w-28", busyClassName)}
    />
  )
  return (
    <form onSubmit={submit} className="mt-3">
      {nullable ? (
        <fieldset aria-labelledby={ids.label} aria-describedby={ids.description} className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              id={`${ids.input}-none`}
              ref={controlRef}
              type="radio"
              name={ids.input}
              checked={none}
              onChange={() => { if (!busy) { setNone(true); onEdit() } }}
              aria-disabled={busy}
              className="h-4 w-4 shrink-0 accent-brand"
            />
            <label htmlFor={`${ids.input}-none`} className={cn("text-sm", wrap)}>{noneLabel}</label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id={`${ids.input}-after`}
              type="radio"
              name={ids.input}
              checked={!none}
              onChange={() => { if (!busy) { setNone(false); onEdit() } }}
              aria-disabled={busy}
              className="h-4 w-4 shrink-0 accent-brand"
            />
            <label htmlFor={`${ids.input}-after`} className="text-sm">After</label>
            {input}
            {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
            <SaveButton busy={busy} dirty={dirty} label={setting.label} />
          </div>
        </fieldset>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {input}
          {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
          <SaveButton busy={busy} dirty={dirty} label={setting.label} />
        </div>
      )}
      <FieldError id={ids.error} error={error} />
    </form>
  )
}

function SwitchEditor({ setting, ids, busy, onToggle, controlRef }: { setting: SettingResponse; ids: RowIds; busy: boolean; onToggle: (on: boolean) => void; controlRef: (node: HTMLElement | null) => void }) {
  const unavailable = switchUnavailable(setting)
  const stateId = `${ids.reason}-state`
  const describedBy = unavailable ? `${ids.description} ${stateId}${setting.unavailableReason ? ` ${ids.reason}` : ""}` : ids.description
  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <Switch
        ref={controlRef}
        checked={switchChecked(setting)}
        onCheckedChange={(on) => { if (!busy && !unavailable) onToggle(on) }}
        aria-label={setting.label}
        aria-describedby={describedBy}
        aria-disabled={busy || unavailable}
        aria-busy={busy}
        className={cn("mt-0.5", busyClassName)}
      />
      {unavailable && <span id={stateId} className="text-xs font-medium text-muted-foreground">{NOT_AVAILABLE}</span>}
    </div>
  )
}

function ChangedLine({ setting }: { setting: SettingResponse }) {
  const date = setting.changedAt ? formatDateTime(parseServerDateTime(setting.changedAt)) : null
  const by = setting.changedBy ? ` by ${setting.changedBy}` : ""
  return <>{`Changed${by}${date ? ` on ${date}` : ""}`}</>
}

export function SettingRow({ setting, indented, offParent }: { setting: SettingResponse; indented: boolean; offParent: string | null }) {
  const id = useId()
  const ids: RowIds = { label: `${id}-label`, description: `${id}-description`, input: `${id}-input`, error: `${id}-error`, reason: `${id}-reason` }
  const change = useChangeSetting()
  const reset = useResetSetting()
  const busy = change.isPending || reset.isPending
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [confirmOff, setConfirmOff] = useState(false)
  const control = useRef<HTMLElement | null>(null)
  const focusAfterReset = useRef(false)
  const controlRef = (node: HTMLElement | null) => { control.current = node }

  useEffect(() => {
    if (setting.changed || !focusAfterReset.current) return
    focusAfterReset.current = false
    control.current?.focus()
  }, [setting.changed])

  const save = (value: SettingValue) => {
    if (busy) return
    setError(null)
    change.mutate(
      { key: setting.key, value },
      {
        onSuccess: () => {
          setVersion((current) => current + 1)
          toast.success(`${setting.label} saved`)
        },
        onError: (err) => {
          const fieldText = err instanceof ApiError ? err.fields.value : undefined
          if (fieldText) setError(fieldText)
          else toast.error(err.message || `Failed to save ${setting.label}`)
        },
      },
    )
  }

  const resetToDefault = () => {
    if (busy) return
    setError(null)
    focusAfterReset.current = true
    reset.mutate(setting.key, {
      onSuccess: () => {
        setVersion((current) => current + 1)
        toast.success(`${setting.label} reset to default`)
      },
      onError: (err) => {
        focusAfterReset.current = false
        toast.error(err.message || `Failed to reset ${setting.label}`)
      },
    })
  }

  const toggle = (on: boolean) => {
    if (!on && setting.safety) setConfirmOff(true)
    else save(on)
  }

  const isSwitch = setting.type === "SWITCH"
  const labelClassName = cn("text-sm font-medium leading-snug", wrap)
  const label: ReactNode = isSwitch ? (
    <p id={ids.label} className={labelClassName}>{setting.label}</p>
  ) : setting.type === "NUMBER" && setting.nullable ? (
    <p id={ids.label} className={labelClassName}>{setting.label}</p>
  ) : (
    <Label id={ids.label} htmlFor={ids.input} className={cn("block leading-snug", wrap)}>{setting.label}</Label>
  )
  const editorProps: EditorProps = { setting, ids, busy, error, version, onEdit: () => setError(null), onSave: save, onInvalid: setError, controlRef }

  return (
    <li aria-busy={busy} className={cn("py-4", indented && "pl-4 sm:pl-8")}>
      <div className={cn(indented && "border-l-2 pl-4")}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {label}
            <div id={ids.description} className={cn("mt-0.5 space-y-0.5 text-sm text-muted-foreground", wrap)}>
              <p>{setting.description}</p>
              {offParent && <p>{noEffectText(offParent)}</p>}
            </div>
            {!setting.available && setting.unavailableReason && (
              <p id={ids.reason} className={cn("mt-1 text-sm text-muted-foreground", wrap)}>{setting.unavailableReason}</p>
            )}
          </div>
          {isSwitch && <SwitchEditor setting={setting} ids={ids} busy={busy} onToggle={toggle} controlRef={controlRef} />}
        </div>
        {setting.type === "NUMBER" && <NumberEditor {...editorProps} />}
        {(setting.type === "TEXT" || setting.type === "ADDRESSES") && <TextEditor {...editorProps} />}
        {setting.changed && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <p className={wrap}><ChangedLine setting={setting} /></p>
            <p className={wrap}>Default: {settingValueText(setting, setting.defaultValue)}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn("h-7 px-2 text-xs", busyClassName)}
              aria-disabled={busy}
              aria-busy={busy}
              onClick={resetToDefault}
            >
              Reset to default<span className="sr-only"> for {setting.label}</span>
            </Button>
          </div>
        )}
      </div>

      <AlertDialog open={confirmOff} onOpenChange={setConfirmOff}>
        <AlertDialogContent onCloseAutoFocus={(event) => { event.preventDefault(); control.current?.focus() }}>
          <AlertDialogHeader>
            <AlertDialogTitle className={wrap}>Turn off {setting.label}?</AlertDialogTitle>
            <AlertDialogDescription>{SAFETY_OFF_BODY}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => save(false)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Turn off
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}
