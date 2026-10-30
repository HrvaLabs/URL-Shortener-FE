"use client"

import { useId, useRef, useState } from "react"
import { useMyApiKeys, useMyInactiveApiKeys, useGenerateApiKey, useRevokeApiKey, useUpdateApiKey, useDeleteApiKey, useDeleteInactiveApiKeys } from "@/lib/hooks/useApiKeys"
import { useClampedPage } from "@/lib/hooks/usePagination"
import { ApiError } from "@/lib/api-client"
import type { ApiKeyResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Pagination } from "@/components/ui/pagination"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Copy, Check, Plus, ShieldAlert, Pencil, Trash2, Eye, EyeOff, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { cn, focusTargetAfterRemoving, formatDate, maskApiKey } from "@/lib/utils"
import { PageMeta } from "@/components/page-meta"
import { useAuth } from "@/lib/auth-context"

const keysLabel = (count: number) => (count === 1 ? "1 key" : `${count} keys`)

const errorText = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

const INACTIVE_PAGE_SIZE = 10

const DELETE_BUTTON_CLASSES = "h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"

export default function ApiKeysPage() {
  const { isAdmin } = useAuth()
  const activeQuery = useMyApiKeys(true)
  const [inactivePage, setInactivePage] = useState(0)
  const [inactiveSize, setInactiveSize] = useState(INACTIVE_PAGE_SIZE)
  const inactiveQuery = useMyInactiveApiKeys(inactivePage, inactiveSize)
  useClampedPage(inactivePage, inactiveQuery.data?.totalPages, setInactivePage)
  const isLoading = activeQuery.isLoading || inactiveQuery.isLoading
  const error = activeQuery.error ?? inactiveQuery.error
  const refetch = () => Promise.all([activeQuery.refetch(), inactiveQuery.refetch()])
  const generateKey = useGenerateApiKey()
  const revokeKey = useRevokeApiKey()
  const updateKey = useUpdateApiKey()
  const deleteKey = useDeleteApiKey()
  const deleteInactive = useDeleteInactiveApiKeys()
  const inactiveBodyId = useId()
  const [showInactive, setShowInactive] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyResponse | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkCount, setBulkCount] = useState(0)
  const [bulkError, setBulkError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyResponse | null>(null)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)
  const revokeTrigger = useRef<HTMLElement | null>(null)
  const focusAfterRevoke = useRef<HTMLElement | null>(null)
  const revoked = useRef(false)
  const submitting = useRef(false)
  const deleteTrigger = useRef<HTMLElement | null>(null)
  const focusAfterDelete = useRef<HTMLElement | null>(null)
  const deleted = useRef(false)
  const generateRef = useRef<HTMLButtonElement>(null)
  const disclosureRef = useRef<HTMLButtonElement>(null)
  const bulkRef = useRef<HTMLButtonElement>(null)
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
    } catch (err) {
      toast.error(errorText(err, "Failed to generate API key"))
    }
  }

  const activeKeys = activeQuery.data ?? []
  const inactiveKeys = inactiveQuery.data?.content ?? []
  const inactiveCount = inactiveQuery.data?.totalElements ?? 0

  const fallbackFocus = () => (disclosureRef.current?.isConnected ? disclosureRef.current : generateRef.current)

  const focusOrFallback = (preferred: HTMLElement | null) => {
    const target = preferred?.isConnected ? preferred : fallbackFocus()
    target?.focus()
  }

  const openRevoke = (key: ApiKeyResponse, trigger: HTMLElement) => {
    revokeTrigger.current = trigger
    focusAfterRevoke.current = null
    revoked.current = false
    setRevokeError(null)
    setRevokeTarget(key)
  }

  const handleRevoke = async () => {
    if (submitting.current || !revokeTarget) return
    submitting.current = true
    setRevoking(true)
    setRevokeError(null)
    const revokeButtons = Array.from(document.querySelectorAll<HTMLElement>("[data-revoke-key]"))
    const index = revokeTrigger.current ? revokeButtons.indexOf(revokeTrigger.current) : -1
    const next = index === -1 ? null : (revokeButtons[index + 1] ?? revokeButtons[index - 1] ?? null)
    try {
      await revokeKey.mutateAsync(revokeTarget.id)
      focusAfterRevoke.current = next
      revoked.current = true
      toast.success("API key revoked")
      setRevokeTarget(null)
    } catch (err) {
      setRevokeError(errorText(err, "Couldn't revoke the key. Try again."))
      if (err instanceof ApiError && err.status === 404) void refetch()
    } finally {
      submitting.current = false
      setRevoking(false)
    }
  }

  const openDelete = (key: ApiKeyResponse, trigger: HTMLElement) => {
    deleteTrigger.current = trigger
    focusAfterDelete.current = null
    deleted.current = false
    setDeleteError(null)
    setDeleteTarget(key)
  }

  const handleDelete = async () => {
    if (submitting.current || !deleteTarget) return
    submitting.current = true
    setDeleting(true)
    setDeleteError(null)
    const next = focusTargetAfterRemoving(deleteTrigger.current, null)
    try {
      await deleteKey.mutateAsync(deleteTarget.id)
      focusAfterDelete.current = next
      deleted.current = true
      toast.success("API key deleted")
      setDeleteTarget(null)
    } catch (err) {
      setDeleteError(errorText(err, "Couldn't delete the key. Try again."))
      if (err instanceof ApiError && (err.status === 404 || err.status === 409)) void refetch()
    } finally {
      submitting.current = false
      setDeleting(false)
    }
  }

  const openBulkDelete = () => {
    deleted.current = false
    setBulkError(null)
    setBulkCount(inactiveCount)
    setBulkOpen(true)
  }

  const handleBulkDelete = async () => {
    if (submitting.current) return
    submitting.current = true
    setDeleting(true)
    setBulkError(null)
    try {
      const { deleted: count = 0 } = await deleteInactive.mutateAsync()
      deleted.current = true
      toast.success(count === 0 ? "There were no inactive keys to delete" : `Deleted ${count} inactive ${count === 1 ? "key" : "keys"}`)
      setBulkOpen(false)
    } catch (err) {
      setBulkError(errorText(err, "Couldn't delete the keys. Try again."))
    } finally {
      submitting.current = false
      setDeleting(false)
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
    } catch (err) {
      toast.error(errorText(err, "Failed to update"))
    }
  }

  const renderRow = (key: ApiKeyResponse) => {
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
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Revoke key"
                    data-revoke-key={key.id}
                    onClick={(event) => openRevoke(key, event.currentTarget)}
                    className={DELETE_BUTTON_CLASSES}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Revoke key</TooltipContent>
              </Tooltip>
            )}
            {!key.active && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Delete key"
                    data-remove-row
                    onClick={(event) => openDelete(key, event.currentTarget)}
                    className={DELETE_BUTTON_CLASSES}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete key</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Dashboard — API Keys" description="Manage API keys for programmatic URL shortening on hrva.cc." />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl">API Keys</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your API keys for programmatic access</p>
        </div>
        <Button ref={generateRef} onClick={() => setShowGenerate(true)} size="sm" className="gap-1.5 self-start sm:self-auto">
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
                  <code className="min-w-0 font-mono text-xs text-foreground [overflow-wrap:anywhere]">{newKey}</code>
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
            <div>
              <Label htmlFor="apiCallsLimit">API Call Limit</Label>
              <Input id="apiCallsLimit" type="number" value={editLimit} onChange={(e) => setEditLimit(e.target.value)} placeholder="0 = unlimited" className="mt-1.5 h-10" />
            </div>
            <Button onClick={handleEditSave} disabled={updateKey.isPending}>
              {updateKey.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!revokeTarget} onOpenChange={(open) => { if (!open && !revoking) setRevokeTarget(null) }}>
        <AlertDialogContent
          onEscapeKeyDown={(event) => { if (revoking) event.preventDefault() }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            focusOrFallback(revoked.current ? focusAfterRevoke.current : revokeTrigger.current)
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke this API key. Any services using it will stop working.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {revokeTarget && (
            <p className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">{maskApiKey(revokeTarget.key)}</p>
          )}
          {revokeError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{revokeError}</p>
          )}
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={revoking}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleRevoke}
              aria-disabled={revoking}
              aria-busy={revoking}
              className="aria-disabled:opacity-50"
            >
              {revoking ? "Revoking…" : "Revoke"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null) }}>
        <AlertDialogContent
          onEscapeKeyDown={(event) => { if (deleting) event.preventDefault() }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            focusOrFallback(deleted.current ? focusAfterDelete.current : deleteTrigger.current)
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this API key?</AlertDialogTitle>
            <AlertDialogDescription>
              It&apos;s already turned off, so nothing using it will break. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget && (
            <p className="font-mono text-[13px] text-foreground [overflow-wrap:anywhere]">{maskApiKey(deleteTarget.key)}</p>
          )}
          {deleteError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              aria-disabled={deleting}
              aria-busy={deleting}
              className="aria-disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkOpen} onOpenChange={(open) => { if (!open && !deleting) setBulkOpen(false) }}>
        <AlertDialogContent
          onEscapeKeyDown={(event) => { if (deleting) event.preventDefault() }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            focusOrFallback(deleted.current ? null : bulkRef.current)
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {bulkCount} inactive {bulkCount === 1 ? "key" : "keys"}?</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkCount === 1
                ? "It's already turned off, so nothing using it will break. This can't be undone."
                : "They're already turned off, so nothing using them will break. This can't be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {bulkError && (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{bulkError}</p>
          )}
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              onClick={handleBulkDelete}
              aria-disabled={deleting}
              aria-busy={deleting}
              className="aria-disabled:opacity-50"
            >
              {deleting ? "Deleting…" : `Delete ${keysLabel(bulkCount)}`}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
      ) : activeKeys.length === 0 && inactiveCount === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <h2 className="font-semibold">No API keys</h2>
          <p className="mt-1 text-sm text-muted-foreground">Generate an API key to use the URL shortener programmatically.</p>
          <Button onClick={() => setShowGenerate(true)} size="sm" className="mt-6 gap-1.5">
            <Plus className="h-4 w-4" />
            Generate Key
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {inactiveCount > 0 && (
            <div className="flex justify-end">
              <Button
                ref={bulkRef}
                variant="outline"
                size="sm"
                onClick={openBulkDelete}
                className="h-auto min-h-8 gap-1.5 whitespace-normal border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                Delete {inactiveCount} inactive {inactiveCount === 1 ? "key" : "keys"}
              </Button>
            </div>
          )}
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
                {activeKeys.map(renderRow)}
              </TableBody>
              {inactiveCount > 0 && (
                <>
                  <TableBody>
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="py-2">
                        <Button
                          ref={disclosureRef}
                          variant="ghost"
                          size="sm"
                          aria-expanded={showInactive}
                          aria-controls={inactiveBodyId}
                          onClick={() => setShowInactive((shown) => !shown)}
                          className="h-auto min-h-8 gap-1.5 whitespace-normal text-left text-muted-foreground hover:text-foreground"
                        >
                          <ChevronRight aria-hidden="true" className={cn("h-4 w-4 shrink-0 transition-transform", showInactive && "rotate-90")} />
                          Show {inactiveCount} expired or revoked {inactiveCount === 1 ? "key" : "keys"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                  <TableBody id={inactiveBodyId} hidden={!showInactive}>
                    {inactiveKeys.map(renderRow)}
                  </TableBody>
                </>
              )}
            </Table>
            {showInactive && (inactiveQuery.data?.totalPages ?? 0) > 1 && (
              <Pagination
                page={inactivePage}
                totalPages={inactiveQuery.data?.totalPages ?? 0}
                totalElements={inactiveCount}
                size={inactiveSize}
                onPageChange={setInactivePage}
                onSizeChange={(next) => {
                  setInactiveSize(next)
                  setInactivePage(0)
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
