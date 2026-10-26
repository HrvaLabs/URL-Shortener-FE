"use client"

import { useId, useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api-client"
import { useReserveAlias } from "@/lib/hooks/useReservedAliases"
import { cn } from "@/lib/utils"

const ALIAS_MAX_LENGTH = 32

const REASON_MAX_LENGTH = 200

const aliasPattern = /^[A-Za-z0-9_-]+$/

const invalidAliasMessage = "Use only letters, numbers, hyphens and underscores."

export function ReservedAliasForm() {
  const id = useId()
  const aliasRef = useRef<HTMLInputElement>(null)
  const [alias, setAlias] = useState("")
  const [reason, setReason] = useState("")
  const [serverError, setServerError] = useState<string | null>(null)
  const reserve = useReserveAlias()
  const input = { alias: alias.trim(), reason: reason.trim() }
  const aliasError = serverError ?? (input.alias !== "" && !aliasPattern.test(input.alias) ? invalidAliasMessage : null)
  const canSubmit = input.alias !== "" && input.reason !== "" && !aliasError && !reserve.isPending
  const errorId = `${id}-alias-error`
  const hintId = `${id}-hint`

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    reserve.mutateAsync(input).then(
      (created) => {
        toast.success(`Reserved ${created.alias}`)
        setAlias("")
        setReason("")
        aliasRef.current?.focus()
      },
      (error) => {
        setServerError(error instanceof ApiError && error.message ? error.message : "Couldn't reserve the alias. Try again.")
        aliasRef.current?.focus()
      },
    )
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 @2xl:flex-row @2xl:items-start">
        <div className="space-y-1.5 @2xl:w-64">
          <label htmlFor={`${id}-alias`} className="text-sm font-medium">Alias</label>
          <Input
            ref={aliasRef}
            id={`${id}-alias`}
            value={alias}
            onChange={(event) => {
              setAlias(event.target.value)
              setServerError(null)
            }}
            maxLength={ALIAS_MAX_LENGTH}
            aria-invalid={!!aliasError}
            aria-describedby={aliasError ? `${errorId} ${hintId}` : hintId}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            className="h-9 font-mono text-[13px]"
          />
          {aliasError && (
            <p id={errorId} className="text-sm text-destructive [overflow-wrap:anywhere]">{aliasError}</p>
          )}
        </div>
        <div className="space-y-1.5 @2xl:flex-1">
          <label htmlFor={`${id}-reason`} className="text-sm font-medium">Reason</label>
          <Input
            id={`${id}-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={REASON_MAX_LENGTH}
            aria-describedby={`${id}-reason-count`}
            autoComplete="off"
            className="h-9"
          />
          <p
            id={`${id}-reason-count`}
            className={cn("text-xs tabular-nums text-muted-foreground", reason.length >= REASON_MAX_LENGTH && "text-warning")}
          >
            {reason.length >= REASON_MAX_LENGTH
              ? `${REASON_MAX_LENGTH} of ${REASON_MAX_LENGTH} characters, the limit`
              : `${reason.length} of ${REASON_MAX_LENGTH} characters`}
          </p>
        </div>
        <Button type="submit" size="sm" className="h-9 @2xl:mt-[1.625rem]" disabled={!canSubmit}>
          Reserve
        </Button>
      </form>
      <p id={hintId} className="mt-2 text-xs text-muted-foreground">
        Letters, numbers, hyphens and underscores, up to 32 characters. Matching ignores case. Links that already use the alias keep working.
      </p>
    </section>
  )
}
