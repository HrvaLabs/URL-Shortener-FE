"use client"

import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { canPickDomain, pickableHostnames } from "@/lib/domains"
import { useMyDomains } from "@/lib/hooks/useDomains"
import { cn, shortHostOf } from "@/lib/utils"

interface DomainPickerProps {
  id: string
  value: string | null
  onChange: (hostname: string | null) => void
  error?: string | null
  variant?: "dialog" | "form"
}

const domainErrorId = (id: string) => `${id}-error`

export function DomainPicker({ id, value, onChange, error, variant = "dialog" }: DomainPickerProps) {
  const { data, refetch } = useMyDomains()
  const domains = data?.domains ?? []
  const visible = canPickDomain(domains) || value !== null
  const [shown, setShown] = useState(visible)
  const primaryHost = shortHostOf()
  const hostnames = pickableHostnames(domains, value)
  const compact = variant === "form"

  if (visible && !shown) setShown(true)

  useEffect(() => {
    if (error) void refetch()
  }, [error, refetch])

  if (!shown) return null

  return (
    <div>
      <Label htmlFor={id} className={cn(compact && "text-xs text-muted-foreground")}>Domain</Label>
      <Select value={value ?? primaryHost} onValueChange={(picked) => onChange(picked === primaryHost ? null : picked)}>
        <SelectTrigger
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? domainErrorId(id) : undefined}
          className={cn(
            "h-auto gap-2 text-left [&>span]:min-w-0 [&>svg]:shrink-0 [&>span]:[overflow-wrap:anywhere]",
            compact ? "mt-1.5 min-h-9 py-1.5" : "mt-2 min-h-10",
            error && "border-destructive",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-w-(--radix-select-trigger-width)" onKeyDown={(event) => { if (event.key === "Enter") event.preventDefault() }}>
          <SelectItem value={primaryHost} className="[overflow-wrap:anywhere]">{primaryHost}</SelectItem>
          {hostnames.map((hostname) => (
            <SelectItem key={hostname} value={hostname} className="[overflow-wrap:anywhere]">{hostname}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p id={domainErrorId(id)} className="mt-1.5 text-sm text-destructive [overflow-wrap:anywhere]">{error}</p>}
    </div>
  )
}
