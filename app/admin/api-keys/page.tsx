"use client"

import { useAllApiKeys, useRevokeApiKey, useActivateApiKey, useUpdateApiKey, useDeleteApiKey } from "@/lib/hooks/useApiKeys"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import { useListSearch } from "@/lib/hooks/useListSearch"
import { ApiError } from "@/lib/api-client"
import { Pagination } from "@/components/ui/pagination"
import type { ApiKeyFilters, ApiKeyResponse } from "@/lib/types"
import { SortHead, SortSelect, adminSelectClass, type SortOption } from "@/components/admin/sort-controls"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleRight, ToggleLeft, Edit, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { parseServerDateTime } from "@/lib/analytics"
import { formatDateTime, maskApiKey } from "@/lib/utils"
import { PageMeta } from "@/components/page-meta"
import { DateTimeLines } from "@/components/admin/date-time-lines"
import { useRef, useState, type FormEvent } from "react"

const errorText = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

const sortFields = ["createDate", "apiCallsUsed", "expirationDate"]

const sortOptions: SortOption[] = [
  { field: "createDate", direction: "desc", label: "Newest first" },
  { field: "createDate", direction: "asc", label: "Oldest first" },
  { field: "apiCallsUsed", direction: "desc", label: "Most calls used" },
  { field: "apiCallsUsed", direction: "asc", label: "Fewest calls used" },
  { field: "expirationDate", direction: "asc", label: "Expires soonest" },
  { field: "expirationDate", direction: "desc", label: "Expires last" },
]

const statusFilters: Record<string, boolean | undefined> = { all: undefined, active: true, inactive: false }

const rowAction = (row: Element | null | undefined) =>
  row?.querySelector<HTMLElement>("[data-remove-row]") ?? row?.querySelector<HTMLElement>("button") ?? null

export default function AdminApiKeysPage() {
  const { page, size, sort, order, setPage, setSize, toggleSort, setSortOrder, sortDir } = usePagination("createDate", "desc", sortFields)
  const { search, searchInput, setSearchInput, applySearch } = useListSearch(() => setPage(0))
  const [statusFilter, setStatusFilter] = useState("all")
  const filters: ApiKeyFilters = { search: search || undefined, active: statusFilters[statusFilter] }
  const filtered = !!search || statusFilter !== "all"
  const { data: apiKeys, isLoading, error, refetch } = useAllApiKeys(filters, page, size, sort, order)
  useClampedPage(page, apiKeys?.totalPages, setPage)
  const revokeKey = useRevokeApiKey()
  const activateKey = useActivateApiKey()
  const updateKey = useUpdateApiKey()
  const deleteKey = useDeleteApiKey()
  const [editKey, setEditKey] = useState<ApiKeyResponse | null>(null)
  const [editLimit, setEditLimit] = useState("")
  const [deleteTarget, setDeleteTarget] = useState<ApiKeyResponse | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const submitting = useRef(false)
  const deleteTrigger = useRef<HTMLElement | null>(null)
  const deleteRow = useRef<HTMLElement | null>(null)
  const focusAfterDelete = useRef<HTMLElement | null>(null)
  const deleted = useRef(false)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const handleRevoke = async (id: number) => {
    try {
      await revokeKey.mutateAsync(id)
      toast.success("API key revoked")
    } catch (err) {
      toast.error(errorText(err, "Failed to revoke"))
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await activateKey.mutateAsync(id)
      toast.success("API key activated")
    } catch (err) {
      toast.error(errorText(err, "Failed to activate"))
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

  const openDelete = (key: ApiKeyResponse, trigger: HTMLElement) => {
    deleteTrigger.current = trigger
    deleteRow.current = trigger.closest("tr")
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
    const row = deleteRow.current
    const next = rowAction(row?.nextElementSibling) ?? rowAction(row?.previousElementSibling)
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

  const focusAfterDeleteDialog = () => {
    const trigger = deleteTrigger.current
    const preferred = deleted.current
      ? focusAfterDelete.current
      : trigger?.isConnected ? trigger : deleteRow.current?.isConnected ? rowAction(deleteRow.current) : null
    const target = preferred?.isConnected ? preferred : (rowAction(document.querySelector("[data-admin-api-keys] tbody tr")) ?? headingRef.current)
    target?.focus()
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — All API keys" description="View all API keys in the hrva.cc system." />
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="rounded-sm font-display text-2xl">All API keys</h1>
        <p className="mt-1 text-sm text-muted-foreground">View all API keys in the system</p>
      </div>

      <Dialog open={!!editKey} onOpenChange={(open) => { if (!open) setEditKey(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit API key</DialogTitle>
          </DialogHeader>
          {editKey && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="apiCallsLimit">API call limit</Label>
                <Input id="apiCallsLimit" type="number" min={0} value={editLimit} onChange={(e) => setEditLimit(e.target.value)} placeholder="0 = unlimited" className="mt-2" />
              </div>
              <Button onClick={handleEditSave} disabled={updateKey.isPending} className="w-full">
                {updateKey.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null) }}>
        <AlertDialogContent
          onEscapeKeyDown={(event) => { if (deleting) event.preventDefault() }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            focusAfterDeleteDialog()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this API key?</AlertDialogTitle>
            <AlertDialogDescription>
              It&apos;s already turned off, so nothing using it will break. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteTarget && (
            <div className="space-y-0.5 text-[13px]">
              <p className="font-mono text-foreground [overflow-wrap:anywhere]">{maskApiKey(deleteTarget.key)}</p>
              <p className="text-muted-foreground [overflow-wrap:anywhere]">{deleteTarget.ownerEmail || "No owner"}</p>
            </div>
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

      <div className="flex flex-wrap items-center gap-3">
        <form
          role="search"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            applySearch(searchInput)
          }}
          className="relative w-full sm:max-w-sm"
        >
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by owner or key start"
            aria-label="Search API keys by owner email or the start of the key"
            spellCheck={false}
            autoCapitalize="none"
            className="h-9 pl-9"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value)
            setPage(0)
          }}
          aria-label="Filter by status"
          className={adminSelectClass}
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <SortSelect options={sortOptions} sort={sort} order={order} onChange={setSortOrder} />
      </div>

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
          {filtered ? (
            <>
              <p className="font-semibold">No keys match</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>
            </>
          ) : (
            <>
              <p className="font-semibold">No API keys</p>
              <p className="mt-1 text-sm text-muted-foreground">Keys created by users will be listed here.</p>
            </>
          )}
        </div>
      ) : (
        <div data-admin-api-keys className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead className="hidden @min-[46rem]:table-cell">Owner</TableHead>
                <SortHead field="createDate" label="Created" sortDir={sortDir} toggleSort={toggleSort} className="hidden @min-[46rem]:table-cell" />
                <SortHead field="apiCallsUsed" label="Usage" sortDir={sortDir} toggleSort={toggleSort} className="hidden @md:table-cell" />
                <TableHead className="hidden @md:table-cell">Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.content.map((key: ApiKeyResponse) => (
                <TableRow key={key.id}>
                  <TableCell>
                    <span className="whitespace-nowrap font-mono text-[13px]">{maskApiKey(key.key)}</span>
                    <div className="mt-1 min-w-36 space-y-0.5 text-xs text-muted-foreground @min-[46rem]:hidden">
                      <div className="pb-0.5 @md:hidden">
                        <StatusBadge status={key.status} active={key.active} />
                      </div>
                      <p className="tabular-nums @md:hidden">{key.apiCallsUsed} of {key.apiCallsLimit > 0 ? key.apiCallsLimit : "unlimited"} calls used</p>
                      <p className="[overflow-wrap:anywhere]">{key.ownerEmail || "No owner"}</p>
                      <p className="tabular-nums">Created {key.createDate ? formatDateTime(parseServerDateTime(key.createDate)) : "—"}</p>
                    </div>
                  </TableCell>
                  <TableCell className="hidden @min-[46rem]:table-cell">
                    <span className="block min-w-44 [overflow-wrap:anywhere]">{key.ownerEmail || "\u2014"}</span>
                  </TableCell>
                  <TableCell className="hidden tabular-nums text-muted-foreground @min-[46rem]:table-cell">{key.createDate ? <DateTimeLines value={key.createDate} /> : "—"}</TableCell>
                  <TableCell className="hidden whitespace-nowrap tabular-nums @md:table-cell">{key.apiCallsUsed}/{key.apiCallsLimit > 0 ? key.apiCallsLimit : "\u221E"}</TableCell>
                  <TableCell className="hidden @md:table-cell">
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
                      {!key.active && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={(event) => openDelete(key, event.currentTarget)}
                              aria-label="Delete API key"
                              data-remove-row
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Delete API key</TooltipContent>
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
