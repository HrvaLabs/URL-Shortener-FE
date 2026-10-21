"use client"

import { useState } from "react"
import { useMyApiKeys, useGenerateApiKey, useRevokeApiKey, useUpdateApiKey } from "@/lib/hooks/useApiKeys"
import type { ApiKeyResponse } from "@/lib/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Check, Plus, ShieldAlert, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { formatDate, maskApiKey } from "@/lib/utils"
import { PageMeta } from "@/components/page-meta"
import { useAuth } from "@/lib/auth-context"

export default function ApiKeysPage() {
  const { isAdmin } = useAuth()
  const { data: apiKeys, isLoading, error } = useMyApiKeys()
  const generateKey = useGenerateApiKey()
  const revokeKey = useRevokeApiKey()
  const updateKey = useUpdateApiKey()
  const [showGenerate, setShowGenerate] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [newKeyCopied, setNewKeyCopied] = useState(false)
  const [editKey, setEditKey] = useState<ApiKeyResponse | null>(null)
  const [editLimit, setEditLimit] = useState("")
  const [visibleKeys, setVisibleKeys] = useState<Set<number>>(new Set())
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null)

  const toggleKeyVisibility = (id: number) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyKeyToClipboard = async (key: string, id: number) => {
    try {
      await navigator.clipboard.writeText(key)
      setCopiedKeyId(id)
      setTimeout(() => setCopiedKeyId(null), 2000)
      toast.success("API key copied!")
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleGenerate = async () => {
    try {
      const key = await generateKey.mutateAsync()
      setNewKey(key.key)
      toast.success("API key generated!")
    } catch (err: any) {
      toast.error(err.message || "Failed to generate API key")
    }
  }

  const handleRevoke = async (id: number) => {
    try {
      await revokeKey.mutateAsync(id)
      toast.success("API key revoked")
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke")
    }
  }

  const handleEditSave = async () => {
    if (!editKey) return
    try {
      await updateKey.mutateAsync({
        id: editKey.id,
        data: {
          id: editKey.id,
          apiCallsLimit: Math.max(0, parseInt(editLimit, 10) || 0),
        },
      })
      toast.success("API key updated")
      setEditKey(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to update")
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Dashboard — API Keys" description="Manage API keys for programmatic URL shortening on hrva.cc." />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl">API Keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your API keys for programmatic access</p>
        </div>
        <Button onClick={() => setShowGenerate(true)} size="sm" className="gap-1.5 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          Generate Key
        </Button>
      </div>

      <Dialog open={showGenerate} onOpenChange={(open) => { setShowGenerate(open); if (!open) setNewKey(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{newKey ? "API Key Generated" : "Generate New API Key"}</DialogTitle>
            {!newKey && <DialogDescription>Create a new API key for programmatic URL shortening.</DialogDescription>}
          </DialogHeader>
          {!newKey ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">This will create a new API key associated with your account.</p>
              <Button onClick={handleGenerate} className="w-full" disabled={generateKey.isPending}>
                {generateKey.isPending ? "Generating…" : "Generate"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
                <p className="mb-3 flex items-center gap-1.5 text-sm font-medium text-warning">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  Copy this key now. You won&apos;t be able to see it again!
                </p>
                <div className="flex items-center justify-between gap-2 rounded-md border bg-background py-1.5 pl-3 pr-1.5">
                  <code className="min-w-0 truncate font-mono text-xs text-foreground">{newKey}</code>
                  <Button variant="ghost" size="icon" aria-label="Copy key" onClick={() => {
                    navigator.clipboard.writeText(newKey)
                    setNewKeyCopied(true)
                    setTimeout(() => setNewKeyCopied(false), 2000)
                    toast.success("Copied!")
                  }} className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground">
                    {newKeyCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => { setShowGenerate(false); setNewKey(null) }}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editKey} onOpenChange={(open) => { if (!open) setEditKey(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="apiCallsLimit">API Call Limit</Label>
              <Input id="apiCallsLimit" type="number" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} placeholder="0 = unlimited" className="h-10" />
            </div>
            <Button onClick={handleEditSave} disabled={updateKey.isPending}>
              {updateKey.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border bg-card p-5">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm text-destructive">Failed to load API keys</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="mt-4">Retry</Button>
        </div>
      ) : !apiKeys || apiKeys.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <h2 className="font-semibold">No API keys</h2>
          <p className="mt-1 text-sm text-muted-foreground">Generate an API key to use the URL shortener programmatically.</p>
          <Button onClick={() => setShowGenerate(true)} size="sm" className="mt-6 gap-1.5">
            <Plus className="h-4 w-4" />
            Generate Key
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead className="hidden md:table-cell">Created</TableHead>
                <TableHead className="hidden lg:table-cell">Expires</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key: ApiKeyResponse) => {
                const isVisible = visibleKeys.has(key.id)
                const displayKey = isVisible ? key.key : maskApiKey(key.key)

                return (
                  <TableRow key={key.id}>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <code className="mr-1 rounded-md border bg-muted/40 px-2 py-0.5 font-mono text-[13px] text-foreground">
                          {displayKey}
                        </code>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={isVisible ? "Hide key" : "Reveal key"}
                              onClick={() => toggleKeyVisibility(key.id)}
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            {isVisible ? "Hide key" : "Reveal key"}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Copy key"
                              onClick={() => copyKeyToClipboard(key.key, key.id)}
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                            >
                              {copiedKeyId === key.id
                                ? <Check className="h-3.5 w-3.5 text-success" />
                                : <Copy className="h-3.5 w-3.5" />
                              }
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Copy key</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm tabular-nums text-muted-foreground md:table-cell">{formatDate(key.createDate)}</TableCell>
                    <TableCell className="hidden text-sm tabular-nums lg:table-cell">{key.expirationDate ? formatDate(key.expirationDate) : <span className="text-muted-foreground">Never</span>}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">
                      <span className="font-medium">{key.apiCallsUsed}</span>
                      <span className="text-muted-foreground"> / {key.apiCallsLimit > 0 ? key.apiCallsLimit : "\u221E"}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={key.status} active={key.active} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        {isAdmin && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Edit limit"
                                onClick={() => { setEditKey(key); setEditLimit(String(key.apiCallsLimit ?? 0)) }}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Edit limit</TooltipContent>
                          </Tooltip>
                        )}
                        {key.active && (
                          <Tooltip>
                            <AlertDialog>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Revoke key"
                                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="top">Revoke key</TooltipContent>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently revoke this API key. Any services using it will stop working.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleRevoke(key.id)} className={buttonVariants({ variant: "destructive" })}>
                                    Revoke
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
