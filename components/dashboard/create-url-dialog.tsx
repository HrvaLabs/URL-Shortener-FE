"use client"

import { useState } from "react"
import { useCreateUrl } from "@/lib/hooks/useUrls"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { toast } from "sonner"
import { QRCodeSVG } from "qrcode.react"
import { Copy, Check } from "lucide-react"
import { destinationLengthError, getShortBaseUrl } from "@/lib/utils"

interface CreateUrlDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateUrlDialog({ open, onOpenChange }: CreateUrlDialogProps) {
  const [longUrl, setLongUrl] = useState("")
  const [customAlias, setCustomAlias] = useState("")
  const [visitLimit, setVisitLimit] = useState("")
  const [expirationDate, setExpirationDate] = useState("")
  const [tags, setTags] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<{ shortUrl: string; longUrl: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const createUrl = useCreateUrl()
  const longUrlError = destinationLengthError(longUrl)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!longUrl || longUrlError) return
    const expDate = expirationDate ? new Date(expirationDate).toISOString() : undefined
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean)
      const url = await createUrl.mutateAsync({
        longUrl,
        shortUrl: customAlias || undefined,
        visitLimit: visitLimit ? parseInt(visitLimit) : undefined,
        expirationDate: expDate,
        tags: tagList.length ? tagList : undefined,
        password: password || undefined,
      })
      setResult({ shortUrl: url.shortUrl, longUrl: url.longUrl })
      toast.success("URL shortened!")
    } catch (err: any) {
      toast.error(err.message || "Failed to create URL")
    }
  }

  const handleClose = () => {
    setLongUrl("")
    setCustomAlias("")
    setVisitLimit("")
    setExpirationDate("")
    setTags("")
    setPassword("")
    setResult(null)
    setCopied(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{result ? "URL Created!" : "Create Short URL"}</DialogTitle>
          {!result && <DialogDescription>Enter a long URL to shorten it.</DialogDescription>}
        </DialogHeader>
        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Long URL</Label>
              <Input placeholder="https://example.com/very/long/url" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} required aria-invalid={!!longUrlError} aria-describedby={longUrlError ? "create-long-url-error" : undefined} className="mt-2" />
              {longUrlError && <p id="create-long-url-error" className="mt-2 text-sm text-destructive">{longUrlError}</p>}
            </div>
            <div>
              <Label>Custom alias (optional)</Label>
              <Input placeholder="my-link" value={customAlias} onChange={(e) => setCustomAlias(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Visit limit (optional)</Label>
              <Input type="number" placeholder="e.g. 100" value={visitLimit} onChange={(e) => setVisitLimit(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Tags (optional, comma-separated)</Label>
              <Input placeholder="work, campaign" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-2" />
            </div>
            <div>
              <Label>Password (optional)</Label>
              <Input type="password" placeholder="Protect this link" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="mt-2" />
            </div>
            <div>
              <Label>Expiration date (optional)</Label>
              <Input type="datetime-local" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} className="mt-2" />
            </div>
            <Button type="submit" className="w-full" disabled={createUrl.isPending}>
              {createUrl.isPending ? "Shortening..." : "Shorten"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 py-1.5 pl-3 pr-1.5">
              <span className="min-w-0 truncate font-mono text-sm font-medium text-brand">/{result.shortUrl}</span>
              <Button variant="ghost" size="icon" aria-label="Copy short URL" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground" onClick={() => {
                navigator.clipboard.writeText(`${getShortBaseUrl()}/${result.shortUrl}`)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
                toast.success("Copied!")
              }}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex justify-center">
              <div className="inline-block rounded-lg border bg-white p-2">
                <QRCodeSVG value={`${getShortBaseUrl()}/${result.shortUrl}`} size={150} fgColor="#0e0e11" bgColor="#ffffff" />
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
