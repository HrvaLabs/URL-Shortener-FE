"use client"

import { useState, useEffect } from "react"
import { useAllUrls, useDeactivateUrl, useActivateUrl, useDeleteUrl, useUpdateUrl } from "@/lib/hooks/useUrls"
import { usePagination } from "@/lib/hooks/usePagination"
import { Pagination } from "@/components/ui/pagination"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Search, Trash2, ToggleRight, ToggleLeft, ArrowUpDown, ArrowUp, ArrowDown, Edit } from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatDateTime, getShortBaseUrl, truncateUrl } from "@/lib/utils"
import { adminApi } from "@/lib/api-client"
import { PageMeta } from "@/components/page-meta"
import type { UrlResponse, UrlFilters } from "@/lib/types"

const shortHost = getShortBaseUrl().replace(/^https?:\/\//, "")

export default function AdminUrlsPage() {
  const { page, size, sort, order, setPage, setSize, toggleSort, sortDir } = usePagination()
  const [search, setSearch] = useState("")
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [expiredFilter, setExpiredFilter] = useState(false)
  useEffect(() => { setPage(0) }, [search, activeFilter, expiredFilter])
  const filterKey = `${search}-${activeFilter}-${expiredFilter}`
  const filters: UrlFilters = {
    search: search || undefined,
    active: activeFilter === "all" ? undefined : activeFilter === "active",
    expired: expiredFilter || undefined,
  }
  const { data: urls, isLoading, error } = useAllUrls(filters, page, size, sort, order)
  const deactivateUrl = useDeactivateUrl()
  const activateUrl = useActivateUrl()
  const deleteUrl = useDeleteUrl()
  const updateUrl = useUpdateUrl()
  const [editUrl, setEditUrl] = useState<UrlResponse | null>(null)
  const [editVisitLimit, setEditVisitLimit] = useState("")
  const [editExpiration, setEditExpiration] = useState("")
  const [editTags, setEditTags] = useState("")
  const [editPassword, setEditPassword] = useState("")
  const [removePassword, setRemovePassword] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === (urls?.content?.length ?? 0)) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(urls?.content?.map((u) => u.id) ?? []))
    }
  }

  const batchAction = async (action: "activate" | "deactivate" | "delete") => {
    const fn = action === "activate" ? activateUrl.mutateAsync : action === "deactivate" ? deactivateUrl.mutateAsync : deleteUrl.mutateAsync
    const label = action === "activate" ? "Activated" : action === "deactivate" ? "Deactivated" : "Deleted"
    const results = await Promise.allSettled([...selectedIds].map((id) => fn(id)))
    const succeeded = results.filter((r) => r.status === "fulfilled").length
    const failed = results.filter((r) => r.status === "rejected").length
    if (succeeded > 0) toast.success(`${label} ${succeeded} URL${succeeded > 1 ? "s" : ""}`)
    if (failed > 0) toast.error(`Failed to ${action} ${failed} URL${failed > 1 ? "s" : ""}`)
    setSelectedIds(new Set())
  }

  const allSelected = urls?.content?.length === selectedIds.size && selectedIds.size > 0

  const handleDeactivate = async (id: number) => {
    try {
      await deactivateUrl.mutateAsync(id)
      toast.success("URL deactivated")
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate")
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await activateUrl.mutateAsync(id)
      toast.success("URL activated")
    } catch (err: any) {
      toast.error(err.message || "Failed to activate")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteUrl.mutateAsync(id)
      toast.success("URL deleted permanently")
    } catch (err: any) {
      toast.error(err.message || "Failed to delete")
    }
  }

  const handleEditOpen = (url: UrlResponse) => {
    setEditUrl(url)
    setEditVisitLimit(url.visitLimit?.toString() || "")
    setEditExpiration(url.expirationDate ? url.expirationDate.slice(0, 16) : "")
    setEditTags(url.tags?.join(", ") || "")
    setEditPassword("")
    setRemovePassword(false)
  }

  const handleEditSave = async () => {
    if (!editUrl) return
    try {
      await updateUrl.mutateAsync({
        id: editUrl.id,
        data: {
          id: editUrl.id,
          visitLimit: editVisitLimit ? parseInt(editVisitLimit) : 0,
          expirationDate: editExpiration ? new Date(editExpiration).toISOString() : undefined,
          tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
          password: removePassword ? "" : (editPassword || undefined),
        },
      })
      toast.success("URL updated")
      setEditUrl(null)
    } catch (err: any) {
      toast.error(err.message || "Failed to update URL")
    }
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — All URLs" description="View all shortened URLs in the hrva.cc system." />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl">All URLs</h1>
          <p className="mt-1 text-sm text-muted-foreground">View all shortened URLs in the system</p>
        </div>
        <Button
          onClick={() => adminApi.exportUrlsCsv()}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search URLs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9"
          />
        </div>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value)}
          aria-label="Filter by status"
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] focus-visible:border-ring focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:ring-offset-0"
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={expiredFilter}
            onChange={(e) => setExpiredFilter(e.target.checked)}
            className="h-4 w-4 rounded border-input accent-brand"
          />
          Expired only
        </label>
      </div>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-muted/40 px-4 py-2.5">
          <span className="mr-1 text-sm font-medium tabular-nums">{selectedIds.size} selected</span>
          <Button size="sm" variant="outline" className="h-8" onClick={() => batchAction("activate")}>
            Activate
          </Button>
          <Button size="sm" variant="outline" className="h-8" onClick={() => batchAction("deactivate")}>
            Deactivate
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="destructive" className="h-8">Delete</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedIds.size} URL{selectedIds.size > 1 ? "s" : ""}?</AlertDialogTitle>
                <AlertDialogDescription>This will permanently delete the selected URLs.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => batchAction("delete")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3 rounded-xl border bg-card p-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load URLs</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : !urls || !urls.content || urls.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">No URLs found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search or filter.</p>
        </div>
      ) : (
        <div key={filterKey} className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={selectAll}
                    aria-label="Select all URLs on this page"
                    className="h-4 w-4 rounded border-input accent-brand"
                  />
                </TableHead>
                <TableHead>Short URL</TableHead>
                <TableHead className="hidden lg:table-cell">Long URL</TableHead>
                <TableHead className="hidden lg:table-cell">Owner</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("visits")}>
                  <div className="flex items-center gap-1">
                    Visits
                    {sortDir("visits") === "asc" ? <ArrowUp className="h-3 w-3" /> : sortDir("visits") === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />}
                  </div>
                </TableHead>
                <TableHead className="hidden lg:table-cell cursor-pointer select-none" onClick={() => toggleSort("createDate")}>
                  <div className="flex items-center gap-1">
                    Created
                    {sortDir("createDate") === "asc" ? <ArrowUp className="h-3 w-3" /> : sortDir("createDate") === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {urls.content.map((url: UrlResponse) => (
                <TableRow key={url.id} data-state={selectedIds.has(url.id) ? "selected" : undefined}>
                  <TableCell className="w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(url.id)}
                      onChange={() => toggleSelect(url.id)}
                      aria-label={`Select /${url.shortUrl}`}
                      className="h-4 w-4 rounded border-input accent-brand"
                    />
                  </TableCell>
                  <TableCell>
                    <span className="block max-w-[13rem] truncate font-mono text-[13px] font-medium text-brand" title={`${shortHost}/${url.shortUrl}`}>
                      <span className="text-brand/60">{shortHost}/</span>{url.shortUrl}
                    </span>
                  </TableCell>
                  <TableCell className="hidden max-w-[200px] text-muted-foreground lg:table-cell">
                    <span className="block truncate" title={url.longUrl}>{truncateUrl(url.longUrl, 40)}</span>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">{url.ownerEmail || "\u2014"}</TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums">{url.visits.toLocaleString()}{url.visitLimit > 0 ? ` / ${url.visitLimit.toLocaleString()}` : ""}</TableCell>
                  <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground lg:table-cell" title={formatDateTime(url.createDate)}>{formatDate(url.createDate)}</TableCell>
                  <TableCell>
                    <StatusBadge status={url.status} active={url.active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {url.active ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleDeactivate(url.id)}
                              disabled={deactivateUrl.isPending}
                              aria-label="Deactivate"
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <ToggleRight className="h-3.5 w-3.5 text-success" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Deactivate</TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleActivate(url.id)}
                              disabled={activateUrl.isPending}
                              aria-label="Activate"
                              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <ToggleLeft className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">Activate</TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => handleEditOpen(url)}
                            aria-label="Edit URL"
                            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">Edit URL</TooltipContent>
                      </Tooltip>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button aria-label="Delete" className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Delete</TooltipContent>
                          </Tooltip>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete URL?</AlertDialogTitle>
                            <AlertDialogDescription>This will permanently delete /{url.shortUrl}.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(url.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={urls?.totalPages ?? 0}
            totalElements={urls?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={setSize}
          />
        </div>
      )}

      <Dialog open={!!editUrl} onOpenChange={(open) => { if (!open) setEditUrl(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit URL — /{editUrl?.shortUrl}</DialogTitle>
          </DialogHeader>
          {editUrl && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Visit Limit</label>
                <Input
                  type="number"
                  placeholder="e.g. 100 (0 = unlimited)"
                  value={editVisitLimit}
                  onChange={(e) => setEditVisitLimit(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Expiration Date</label>
                <Input
                  type="datetime-local"
                  value={editExpiration}
                  onChange={(e) => setEditExpiration(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags (comma-separated)</label>
                <Input
                  placeholder="work, campaign"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Password {editUrl?.passwordProtected && <span className="font-normal text-muted-foreground">(currently set)</span>}
                </label>
                <Input
                  type="password"
                  placeholder={editUrl?.passwordProtected ? "Enter new password to replace" : "Set a password"}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  disabled={removePassword}
                  autoComplete="new-password"
                />
                {editUrl?.passwordProtected && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" checked={removePassword} onChange={(e) => setRemovePassword(e.target.checked)} className="h-4 w-4 accent-brand" />
                    Remove password protection
                  </label>
                )}
              </div>
              <Button onClick={handleEditSave} disabled={updateUrl.isPending} className="w-full">
                {updateUrl.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
