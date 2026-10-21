"use client"

import { useState, type FormEvent } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { adminApi } from "@/lib/api-client"
import type { BlocklistSource, BlocklistSourceInput, SourceAction, SourceKind } from "@/lib/types"
import { actionLabels, kindLabels } from "./labels"

const MAX_FALLBACK_URLS = 3
const MIN_INTERVAL_HOURS = 1
const MAX_INTERVAL_HOURS = 168

const selectClassName = "mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:outline-hidden focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0"

const isHttpsUrl = (value: string) => {
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}

interface SourceDialogProps {
  open: boolean
  source: BlocklistSource | null
  onOpenChange: (open: boolean) => void
}

export function SourceDialog({ open, source, onOpenChange }: SourceDialogProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState(source?.name ?? "")
  const [url, setUrl] = useState(source?.url ?? "")
  const [kind, setKind] = useState<SourceKind>(source?.kind ?? "DOMAINS")
  const [action, setAction] = useState<SourceAction>(source?.action ?? "BLOCK")
  const [intervalHours, setIntervalHours] = useState(String(source?.refreshIntervalHours ?? 6))
  const [enabled, setEnabled] = useState(source?.enabled ?? true)
  const [fallbacks, setFallbacks] = useState(source?.fallbackUrls?.join("\n") ?? "")

  const save = useMutation({
    mutationFn: (input: BlocklistSourceInput) =>
      source ? adminApi.updateBlocklistSource(source.id, input) : adminApi.createBlocklistSource(input),
    onSuccess: () => {
      toast.success(source ? "Source saved" : "Source added")
      onOpenChange(false)
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save source"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "blocklists"] }),
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()
    const fallbackUrls = fallbacks.split("\n").map((line) => line.trim()).filter(Boolean)
    const hours = Number(intervalHours)
    if (!trimmedName) {
      toast.error("Name is required")
      return
    }
    if (!isHttpsUrl(trimmedUrl)) {
      toast.error("The list URL must start with https://")
      return
    }
    if (fallbackUrls.length > MAX_FALLBACK_URLS) {
      toast.error(`Add at most ${MAX_FALLBACK_URLS} fallback URLs`)
      return
    }
    if (!fallbackUrls.every(isHttpsUrl)) {
      toast.error("Every fallback URL must start with https://")
      return
    }
    if (!Number.isInteger(hours) || hours < MIN_INTERVAL_HOURS || hours > MAX_INTERVAL_HOURS) {
      toast.error(`The refresh interval must be ${MIN_INTERVAL_HOURS} to ${MAX_INTERVAL_HOURS} hours`)
      return
    }
    save.mutate({ name: trimmedName, url: trimmedUrl, kind, action, enabled, refreshIntervalHours: hours, fallbackUrls })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{source ? "Edit source" : "Add source"}</DialogTitle>
          <DialogDescription>An https list of domains or links, refreshed on its own interval.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <Label htmlFor="source-name">Name</Label>
            <Input id="source-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-2" />
          </div>
          <div>
            <Label htmlFor="source-url">URL</Label>
            <Input
              id="source-url"
              type="url"
              inputMode="url"
              spellCheck={false}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/list.txt"
              className="mt-2 font-mono text-[13px]"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="source-kind">Kind</Label>
              <select id="source-kind" value={kind} onChange={(e) => setKind(e.target.value as SourceKind)} className={selectClassName}>
                {(Object.keys(kindLabels) as SourceKind[]).map((value) => (
                  <option key={value} value={value}>{kindLabels[value]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="source-action">Action</Label>
              <select id="source-action" value={action} onChange={(e) => setAction(e.target.value as SourceAction)} className={selectClassName}>
                {(Object.keys(actionLabels) as SourceAction[]).map((value) => (
                  <option key={value} value={value}>{actionLabels[value]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="source-interval">Refresh every (hours)</Label>
              <Input
                id="source-interval"
                type="number"
                inputMode="numeric"
                min={MIN_INTERVAL_HOURS}
                max={MAX_INTERVAL_HOURS}
                step={1}
                value={intervalHours}
                onChange={(e) => setIntervalHours(e.target.value)}
                className="mt-2 tabular-nums"
              />
            </div>
            <div className="flex items-center gap-3 sm:pt-7">
              <Switch id="source-enabled" checked={enabled} onCheckedChange={setEnabled} />
              <Label htmlFor="source-enabled">Enabled</Label>
            </div>
          </div>
          <div>
            <Label htmlFor="source-fallbacks">Fallback URLs</Label>
            <Textarea
              id="source-fallbacks"
              spellCheck={false}
              rows={3}
              value={fallbacks}
              onChange={(e) => setFallbacks(e.target.value)}
              placeholder="https://mirror.example.com/list.txt"
              className="mt-2 font-mono text-[13px]"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">One per line, up to {MAX_FALLBACK_URLS}. Tried in order when the main URL fails.</p>
          </div>
          <Button type="submit" disabled={save.isPending} className="w-full">
            {save.isPending ? "Saving..." : source ? "Save changes" : "Add source"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
