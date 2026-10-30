"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Check, Copy } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import type { DomainDnsRecord } from "@/lib/types"

const COPIED_FEEDBACK_MS = 2000

type CopyField = "name" | "target"

const row = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 sm:grid-cols-[4rem_minmax(0,1fr)_auto]"

const label = "col-span-2 text-xs text-muted-foreground sm:col-span-1 sm:text-sm"

const firstLabel = (name: string) => name.split(".")[0]

export function DnsRecord({ record }: { record: DomainDnsRecord }) {
  const [copied, setCopied] = useState<CopyField | null>(null)
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => () => clearTimeout(copiedTimer.current), [])

  const copy = async (field: CopyField) => {
    try {
      await navigator.clipboard.writeText(record[field])
    } catch {
      toast.error("Couldn't copy. Select the text and copy it.")
      return
    }
    setCopied(field)
    clearTimeout(copiedTimer.current)
    copiedTimer.current = setTimeout(() => setCopied(null), COPIED_FEEDBACK_MS)
  }

  const copyButton = (field: CopyField, label: string) => (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label={label}
      onClick={() => copy(field)}
      className="h-8 shrink-0 gap-1.5 px-2.5"
    >
      {copied === field ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
      {copied === field ? "Copied" : "Copy"}
    </Button>
  )

  return (
    <div className="space-y-2.5 rounded-lg border bg-muted/40 p-3">
      <dl className="space-y-2 text-sm">
        <div className={row}>
          <dt className={label}>Type</dt>
          <dd className="font-mono">{record.type}</dd>
        </div>
        <div className={row}>
          <dt className={label}>Name</dt>
          <dd className="font-mono [overflow-wrap:anywhere]">{record.name}</dd>
          <dd>{copyButton("name", "Copy name")}</dd>
        </div>
        <div className={row}>
          <dt className={label}>Target</dt>
          <dd className="font-mono [overflow-wrap:anywhere]">{record.target}</dd>
          <dd>{copyButton("target", "Copy target")}</dd>
        </div>
      </dl>
      <p className="text-xs text-muted-foreground [overflow-wrap:anywhere]">
        Some DNS providers want only the first part of the name ({firstLabel(record.name)}). If your DNS is on Cloudflare, set the record to DNS only (grey cloud).
      </p>
      <Link href="/help/custom-domains#add-the-record" className="inline-block text-sm text-brand-link">How to add a CNAME</Link>
      <p role="status" className="sr-only">{copied ? `Copied ${copied}` : ""}</p>
    </div>
  )
}
