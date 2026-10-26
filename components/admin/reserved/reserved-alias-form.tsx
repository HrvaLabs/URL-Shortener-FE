"use client"

import { useId, useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api-client"
import { useReserveAlias } from "@/lib/hooks/useReservedAliases"

const REASON_MAX_LENGTH = 200

export function ReservedAliasForm() {
  const id = useId()
  const [alias, setAlias] = useState("")
  const [reason, setReason] = useState("")
  const reserve = useReserveAlias()
  const input = { alias: alias.trim(), reason: reason.trim() }
  const canSubmit = input.alias !== "" && input.reason !== "" && !reserve.isPending

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    reserve.mutateAsync(input).then(
      (created) => {
        toast.success(`Reserved ${created.alias}`)
        setAlias("")
        setReason("")
      },
      (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't reserve the alias. Try again."),
    )
  }

  return (
    <section className="rounded-xl border bg-card p-5 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 @2xl:flex-row @2xl:items-end">
        <div className="space-y-1.5 @2xl:w-64">
          <label htmlFor={`${id}-alias`} className="text-sm font-medium">Alias</label>
          <Input
            id={`${id}-alias`}
            value={alias}
            onChange={(event) => setAlias(event.target.value)}
            aria-describedby={`${id}-hint`}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            className="h-9 font-mono text-[13px]"
          />
        </div>
        <div className="space-y-1.5 @2xl:flex-1">
          <label htmlFor={`${id}-reason`} className="text-sm font-medium">Reason</label>
          <Input
            id={`${id}-reason`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={REASON_MAX_LENGTH}
            autoComplete="off"
            className="h-9"
          />
        </div>
        <Button type="submit" size="sm" className="h-9" disabled={!canSubmit}>
          Reserve
        </Button>
      </form>
      <p id={`${id}-hint`} className="mt-2 text-xs text-muted-foreground">
        Letters, numbers, hyphens and underscores, up to 32 characters. Matching ignores case. Links that already use the alias keep working.
      </p>
    </section>
  )
}
