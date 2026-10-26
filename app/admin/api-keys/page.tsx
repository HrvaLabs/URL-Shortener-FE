"use client"

import { useAllApiKeys, useRevokeApiKey, useActivateApiKey, useUpdateApiKey } from "@/lib/hooks/useApiKeys"
import { usePagination } from "@/lib/hooks/usePagination"
import { Pagination } from "@/components/ui/pagination"
import type { ApiKeyResponse } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleRight, ToggleLeft, Edit } from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatDateTime, maskApiKey } from "@/lib/utils"
import { PageMeta } from "@/components/page-meta"
import { useState } from "react"

export default function AdminApiKeysPage() {
  const { page, size, setPage, setSize } = usePagination()
  const { data: apiKeys, isLoading, error } = useAllApiKeys(page, size)
  const revokeKey = useRevokeApiKey()
  const activateKey = useActivateApiKey()
  const updateKey = useUpdateApiKey()
  const [editKey, setEditKey] = useState<ApiKeyResponse | null>(null)
  const [editLimit, setEditLimit] = useState("")

  const handleRevoke = async (id: number) => {
    try {
      await revokeKey.mutateAsync(id)
      toast.success("API key revoked")
    } catch (err: any) {
      toast.error(err.message || "Failed to revoke")
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await activateKey.mutateAsync(id)
      toast.success("API key activated")
    } catch (err: any) {
      toast.error(err.message || "Failed to activate")
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
      <PageMeta title="Admin — API Keys" description="View all API keys in the hrva.cc system." />
      <div>
        <h1 className="font-display text-2xl">All API Keys</h1>
        <p className="mt-1 text-sm text-muted-foreground">View all API keys in the system</p>
      </div>

      <Dialog open={!!editKey} onOpenChange={(open) => { if (!open) setEditKey(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit API Key</DialogTitle>
          </DialogHeader>
          {editKey && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiCallsLimit">API Call Limit</Label>
                <Input id="apiCallsLimit" type="number" min={0} value={editLimit} onChange={(e) => setEditLimit(e.target.value)} placeholder="0 = unlimited" className="mt-2" />
              </div>
              <Button onClick={handleEditSave} disabled={updateKey.isPending} className="w-full">
                {updateKey.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
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
          <p className="text-sm font-medium text-destructive">Failed to load API keys</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : !apiKeys || !apiKeys.content || apiKeys.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">No API keys</p>
          <p className="mt-1 text-sm text-muted-foreground">Keys created by users will be listed here.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead className="hidden @2xl:table-cell">Owner</TableHead>
                <TableHead className="hidden @2xl:table-cell">Created</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.content.map((key: ApiKeyResponse) => (
                <TableRow key={key.id}>
                  <TableCell><span className="whitespace-nowrap font-mono text-[13px]">{maskApiKey(key.key)}</span></TableCell>
                  <TableCell className="hidden @2xl:table-cell">{key.ownerEmail || "\u2014"}</TableCell>
                  <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground @2xl:table-cell" title={formatDateTime(key.createDate)}>{formatDate(key.createDate)}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{key.apiCallsUsed}/{key.apiCallsLimit > 0 ? key.apiCallsLimit : "\u221E"}</TableCell>
                  <TableCell>
                    <StatusBadge status={key.status} active={key.active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button onClick={() => { setEditKey(key); setEditLimit(String(key.apiCallsLimit ?? 0)) }}
                            aria-label="Edit API key"
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Edit API key</TooltipContent>
                      </Tooltip>
                      {key.active ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleRevoke(key.id)} disabled={revokeKey.isPending}
                              aria-label="Revoke API key"
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                              <ToggleRight className="h-3.5 w-3.5 text-success" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Revoke API key</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => handleActivate(key.id)} disabled={activateKey.isPending}
                              aria-label="Activate API key"
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                              <ToggleLeft className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Activate API key</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={apiKeys?.totalPages ?? 0}
            totalElements={apiKeys?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={setSize}
          />
        </div>
      )}
    </div>
  )
}
