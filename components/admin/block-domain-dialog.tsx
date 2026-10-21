"use client"

import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { adminApi, ApiError } from "@/lib/api-client"
import { cn } from "@/lib/utils"

interface BlockDomainDialogProps {
  longUrl: string
  open: boolean
  onOpenChange(open: boolean): void
  onBlocked(count: number): void
  urlId?: number
}

interface DomainChoice {
  domain: string
  hint: string
}

const domainChoices = (host: string, registrableDomain: string | null): DomainChoice[] => {
  if (!registrableDomain || registrableDomain === host) return [{ domain: host, hint: "This domain and its subdomains" }]
  return [
    { domain: registrableDomain, hint: "The whole domain, with all its subdomains" },
    { domain: host, hint: "Only this host and its subdomains" },
  ]
}

export function BlockDomainDialog({ longUrl, open, onOpenChange, onBlocked, urlId }: BlockDomainDialogProps) {
  const [blocking, setBlocking] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!blocking) onOpenChange(next) }}>
      <DialogContent>
        <BlockDomainForm
          key={longUrl}
          longUrl={longUrl}
          urlId={urlId}
          blocking={blocking}
          setBlocking={setBlocking}
          onCancel={() => onOpenChange(false)}
          onBlocked={(count) => {
            onBlocked(count)
            onOpenChange(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
}

interface BlockDomainFormProps {
  longUrl: string
  urlId?: number
  blocking: boolean
  setBlocking(blocking: boolean): void
  onCancel(): void
  onBlocked(count: number): void
}

function BlockDomainForm({ longUrl, urlId, blocking, setBlocking, onCancel, onBlocked }: BlockDomainFormProps) {
  const queryClient = useQueryClient()
  const { data: check, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "url-check", longUrl],
    queryFn: () => adminApi.checkUrl(longUrl),
    enabled: !!longUrl,
  })
  const [choice, setChoice] = useState<string | null>(null)
  const choices = check?.host ? domainChoices(check.host, check.registrableDomain) : []
  const domain = choices.find((option) => option.domain === choice)?.domain ?? choices[0]?.domain ?? null

  const block = async () => {
    if (!domain) return
    setBlocking(true)
    try {
      let count = 0
      if (urlId != null) {
        await adminApi.resolveReview(urlId, "BLOCK_DOMAIN", domain)
        toast.success(`Blocked ${domain}`)
      } else {
        const created = await adminApi.createDomainRule({ domain, type: "BLOCK", reason: "Blocked from the admin" })
        count = created.linksAffected
        toast.success(`Blocked ${domain}, ${count.toLocaleString()} link${count === 1 ? "" : "s"} deactivated`)
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "review"] }),
        queryClient.invalidateQueries({ queryKey: ["urls"] }),
        queryClient.invalidateQueries({ queryKey: ["admin", "domain-rules"] }),
      ])
      onBlocked(count)
    } catch (err) {
      toast.error(err instanceof ApiError && err.message ? err.message : "Failed to block the domain")
    } finally {
      setBlocking(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Block domain</DialogTitle>
        <DialogDescription>
          Every active link to the domain you pick is deactivated and its owner emailed. New links to it are refused.
        </DialogDescription>
      </DialogHeader>

      <p className="line-clamp-2 break-all text-sm text-muted-foreground" title={longUrl}>{longUrl}</p>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : error ? (
        <div className="rounded-lg border px-4 py-3 text-sm">
          <p className="text-destructive">Couldn&apos;t look up the domain of this destination.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
        </div>
      ) : choices.length === 0 ? (
        <p className="rounded-lg border px-4 py-3 text-sm text-muted-foreground">This destination has no domain to block.</p>
      ) : (
        <fieldset className="space-y-2">
          <legend className="sr-only">Domain to block</legend>
          {choices.map((option) => (
            <label
              key={option.domain}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/40",
                domain === option.domain && "border-brand bg-brand-soft hover:bg-brand-soft",
              )}
            >
              <input
                type="radio"
                name="block-domain"
                value={option.domain}
                checked={domain === option.domain}
                onChange={() => setChoice(option.domain)}
                disabled={blocking}
                className="mt-0.5 h-4 w-4 accent-brand"
              />
              <span className="min-w-0">
                <span className="block break-all font-mono text-[13px] font-medium">{option.domain}</span>
                <span className="block text-xs text-muted-foreground">{option.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
      )}

      <DialogFooter>
        <Button variant="outline" className="mt-2 sm:mt-0" onClick={onCancel} disabled={blocking}>Cancel</Button>
        <Button variant="destructive" onClick={block} disabled={!domain || blocking}>
          {blocking ? "Blocking..." : "Block domain"}
        </Button>
      </DialogFooter>
    </>
  )
}
