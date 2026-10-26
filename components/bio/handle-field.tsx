"use client"

import { useRef, useState, type FormEvent, type Ref } from "react"
import { Label } from "@/components/ui/label"
import { REQUEST_FAILED } from "@/lib/api-client"
import { displayShareUrl, handleFormatError, normalizeHandle, suggestHandle } from "@/lib/bio"
import { useHandleAvailability, useKnownHandleAvailability } from "@/lib/hooks/useBioPage"
import { cn, getShortBaseUrl } from "@/lib/utils"

type Status = { text: string; tone: "error" | "success" | "muted" }

const STATUS_TONES: Record<Status["tone"], string> = {
  error: "text-destructive",
  success: "text-success",
  muted: "text-muted-foreground",
}

export const errorText = (error: unknown): string => (error instanceof Error && error.message ? error.message : REQUEST_FAILED)

function useHandleStatus(value: string, currentHandle: string | null, error: string | null | undefined): Status | null {
  const handle = normalizeHandle(value)
  const unchanged = currentHandle !== null && handle === currentHandle
  const formatError = handle ? handleFormatError(handle) : null
  const { query, settled } = useHandleAvailability(handle, Boolean(handle) && !unchanged && formatError === null)

  if (error) return { text: error, tone: "error" }
  if (!handle) return null
  if (unchanged) return { text: "That's your current handle.", tone: "muted" }
  if (formatError) return settled ? { text: formatError, tone: "error" } : null
  if (!settled || query.isPending) return { text: "Checking…", tone: "muted" }
  if (query.isError) return { text: errorText(query.error), tone: "error" }
  if (query.data.available) return { text: `@${query.data.handle} is available`, tone: "success" }
  return { text: query.data.reason ?? "This handle is taken. Try another.", tone: "error" }
}

export function HandleField({
  id,
  label,
  value,
  onChange,
  currentHandle,
  error,
  hint,
  inputRef,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  currentHandle: string | null
  error?: string | null
  hint?: string
  inputRef?: Ref<HTMLInputElement>
}) {
  const status = useHandleStatus(value, currentHandle, error)
  const hintId = `${id}-hint`
  const statusId = `${id}-status`
  const invalid = status?.tone === "error"
  const suggestion = invalid && handleFormatError(normalizeHandle(value)) ? suggestHandle(value) : null

  const applySuggestion = (next: string) => {
    onChange(next)
    document.getElementById(id)?.focus()
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          "mt-1.5 flex min-h-10 items-stretch overflow-hidden rounded-lg border border-input bg-background shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15",
          invalid && "border-destructive",
        )}
      >
        <span className="flex shrink-0 select-none items-center border-r bg-muted/60 px-2.5 text-sm text-muted-foreground">
          {displayShareUrl("", getShortBaseUrl())}
        </span>
        <input
          ref={inputRef}
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={31}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          aria-invalid={invalid}
          aria-describedby={hint ? `${hintId} ${statusId}` : statusId}
          className="min-w-0 flex-1 bg-transparent px-2.5 font-mono text-sm outline-hidden focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      {hint && <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
      <p id={statusId} aria-live="polite" className={cn("mt-1.5 min-h-5 text-sm [overflow-wrap:anywhere]", status && STATUS_TONES[status.tone])}>
        {status?.text}
      </p>
      {suggestion && (
        <p className="mt-1 text-sm text-muted-foreground">
          Dots and spaces aren&apos;t allowed.{" "}
          <button
            type="button"
            onClick={() => applySuggestion(suggestion)}
            className="rounded-sm font-medium text-brand-link underline-offset-4 [overflow-wrap:anywhere] hover:underline"
          >
            Try @{suggestion}
          </button>
        </p>
      )}
    </div>
  )
}

export function useHandleForm(submit: (handle: string) => Promise<unknown>) {
  const [value, setValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const knownAvailability = useKnownHandleAvailability()

  const refuse = (message: string) => {
    setError(message)
    inputRef.current?.focus()
    inputRef.current?.select()
  }

  const onChange = (next: string) => {
    setValue(next)
    setError(null)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting.current) return
    const handle = normalizeHandle(value)
    const formatError = handleFormatError(handle)
    if (formatError) {
      refuse(formatError)
      return
    }
    const known = knownAvailability(handle)
    if (known && !known.available && known.reason) {
      refuse(known.reason)
      return
    }
    submitting.current = true
    setBusy(true)
    try {
      await submit(handle)
    } catch (submitError) {
      submitting.current = false
      setBusy(false)
      refuse(errorText(submitError))
    }
  }

  return { value, onChange, error, busy, inputRef, onSubmit, handle: normalizeHandle(value) }
}
