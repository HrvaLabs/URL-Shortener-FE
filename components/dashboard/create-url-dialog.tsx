"use client"

import { useId, useState } from "react"
import { useCreateUrl } from "@/lib/hooks/useUrls"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { UtmFields } from "@/components/utm-fields"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { Copy, Check } from "lucide-react"
import { destinationLengthError, formatShortUrl, shortHostOf, withQrMarker } from "@/lib/utils"
import { shortHost } from "@/lib/domains"
import type { DomainRef } from "@/lib/types"
import { CANT_TAKE_UTM, destinationToSend, rememberUtm, tooLongMessage, tooLongWithUtm, type UtmValues } from "@/lib/utm"

interface CreateUrlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCloseAutoFocus?: (event: Event) => void
}

export function CreateUrlDialog({ open, onOpenChange, onCloseAutoFocus }: CreateUrlDialogProps) {
  const [longUrl, setLongUrl] = useState("")
  const [customAlias, setCustomAlias] = useState("")
  const [visitLimit, setVisitLimit] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [tags, setTags] = useState("")
  const [password, setPassword] = useState("")
  const [utm, setUtm] = useState<UtmValues>({})
  const [utmOpen, setUtmOpen] = useState(false)
  const [result, setResult] = useState<{ shortUrl: string; longUrl: string; domain: DomainRef | null } | null>(null)
  const [copied, setCopied] = useState(false)
  const createUrl = useCreateUrl()
  const longUrlError = destinationLengthError(longUrl)
  const id = useId()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!longUrl || longUrlError) return
    const destination = destinationToSend(longUrl, utmOpen, utm)
    if (destination === null) {
      toast.error(`${CANT_TAKE_UTM} Collapse Campaign tracking (UTM) to save it as typed.`)
      return
    }
    if (tooLongWithUtm(longUrl, destination)) {
      toast.error(tooLongMessage("long URL"))
      return
    }
    const expDate = expirationDate ? new Date(expirationDate).toISOString() : undefined
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean)
      const url = await createUrl.mutateAsync({
        longUrl: destination,
        shortUrl: customAlias || undefined,
        visitLimit: visitLimit ? parseInt(visitLimit) : undefined,
        expirationDate: expDate,
        tags: tagList.length ? tagList : undefined,
        password: password || undefined,
      })
      if (utmOpen) rememberUtm(utm)
      setResult({ shortUrl: url.shortUrl, longUrl: url.longUrl, domain: url.domain ?? null })
      toast.success("URL shortened!")
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to create URL")
    }
  }

  const handleClose = () => {
    setLongUrl("")
    setCustomAlias("")
    setVisitLimit("")
    setExpirationDate("")
    setTags("")
    setPassword("")
    setUtm({})
    setUtmOpen(false)
    setResult(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle>{result ? "URL Created!" : "Create Short URL"}</DialogTitle>
          {!result && <DialogDescription>Enter a long URL to shorten it.</DialogDescription>}
        </DialogHeader>
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor={`${id}-long-url`}>Long URL</Label>
              <Input id={`${id}-long-url`} placeholder="https://example.com/very/long/url" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} required aria-invalid={!!longUrlError} aria-describedby={longUrlError ? "create-long-url-error" : undefined} className="mt-2" />
              {longUrlError && <p id="create-long-url-error" className="mt-2 text-sm text-destructive">{longUrlError}</p>}
            </div>
            <div>
              <Label htmlFor={`${id}-alias`}>Custom alias (optional)</Label>
              <Input id={`${id}-alias`} placeholder="my-link" value={customAlias} onChange={(e) => setCustomAlias(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor={`${id}-visit-limit`}>Visit limit (optional)</Label>
              <Input id={`${id}-visit-limit`} type="number" placeholder="e.g. 100" value={visitLimit} onChange={(e) => setVisitLimit(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor={`${id}-tags`}>Tags (optional, comma-separated)</Label>
              <Input id={`${id}-tags`} placeholder="work, personal" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label htmlFor={`${id}-password`}>Password (optional)</Label>
              <Input id={`${id}-password`} type="password" placeholder="Protect this link" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="mt-2" />
            </div>
            <div>
              <Label htmlFor={`${id}-expires`}>Expiration date (optional)</Label>
              <Input id={`${id}-expires`} type="datetime-local" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="mt-2" />
            </div>
            <UtmFields destination={longUrl} value={utm} onChange={setUtm} open={utmOpen} onOpenChange={setUtmOpen} variant="dialog" />
            <Button type="submit" className="w-full" disabled={createUrl.isPending}>
              {createUrl.isPending ? "Shortening..." : "Shorten"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 py-1.5 pl-3 pr-1.5">
              <span className="min-w-0 font-mono text-sm font-medium text-brand [overflow-wrap:anywhere]"><span className="font-normal text-muted-foreground">{shortHost(result.domain, shortHostOf())}/</span>{result.shortUrl}</span>
              <Button variant="ghost" size="icon" aria-label="Copy short URL" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => {
                navigator.clipboard.writeText(formatShortUrl(result.shortUrl, result.domain?.hostname))
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
                toast.success("Copied!")
              }}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm">
              <span className="text-muted-foreground">Opens:</span> <span className="break-all">{result.longUrl}</span>
            </p>
            <div className="flex justify-center">
              <div className="inline-block rounded-lg border bg-white p-2">
                <QRCodeSVG value={withQrMarker(formatShortUrl(result.shortUrl, result.domain?.hostname))} size={150} fgColor="#0e0e11" bgColor="#ffffff" />
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
