"use client"

import { useState, type FormEvent, type ReactNode } from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminApi } from "@/lib/api-client"
import { blockReasonLabels, outcomeLabels, outcomeVariants } from "./labels"

function ResultRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 px-5 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
      <dt className="text-xs text-muted-foreground sm:pt-0.5">{label}</dt>
      <dd className="min-w-0 text-sm">{children}</dd>
    </div>
  )
}

export function UrlTester() {
  const [url, setUrl] = useState("")
  const check = useMutation({
    mutationFn: (value: string) => adminApi.checkUrl(value),
    onError: (err: Error) => toast.error(err.message || "Failed to check URL"),
  })
  const result = check.data
  const reasons = result?.reasons ?? []

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = url.trim()
    if (value) check.mutate(value)
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex min-h-13 items-center border-b px-5 py-2.5">
        <h2 className="text-sm font-semibold">Test a URL</h2>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 p-5 sm:flex-row">
        <Input
          type="url"
          inputMode="url"
          spellCheck={false}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/page"
          aria-label="URL to check"
          className="h-9 font-mono text-[13px] sm:flex-1"
        />
        <Button type="submit" size="sm" disabled={check.isPending || !url.trim()}>
          {check.isPending ? "Checking..." : "Check"}
        </Button>
      </form>

      {result && (
        <dl className="divide-y border-t">
          <ResultRow label="URL">
            <span className="block truncate font-mono text-[13px]" title={check.variables}>{check.variables}</span>
          </ResultRow>
          <ResultRow label="Outcome">
            <Badge variant={outcomeVariants[result.outcome] ?? "secondary"}>{outcomeLabels[result.outcome] ?? result.outcome}</Badge>
          </ResultRow>
          <ResultRow label="Reasons">
            {reasons.length > 0 ? (
              <ul className="list-disc space-y-1 pl-4">
                {reasons.map((reason, i) => (
                  <li key={i} className="break-words">{reason}</li>
                ))}
              </ul>
            ) : (
              <span className="text-muted-foreground">No rule, list or heuristic matched</span>
            )}
          </ResultRow>
          <ResultRow label="Block reason">
            {result.blockReason ? (
              <span className="break-words">
                {blockReasonLabels[result.blockReason] ?? result.blockReason}
                {result.blockDetail && <span className="text-muted-foreground"> · {result.blockDetail}</span>}
              </span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </ResultRow>
          <ResultRow label="Host">
            <span className="block truncate font-mono text-[13px]" title={result.host || undefined}>{result.host || "—"}</span>
          </ResultRow>
          <ResultRow label="Registrable domain">
            <span className="block truncate font-mono text-[13px]" title={result.registrableDomain || undefined}>{result.registrableDomain || "—"}</span>
          </ResultRow>
        </dl>
      )}
    </section>
  )
}
