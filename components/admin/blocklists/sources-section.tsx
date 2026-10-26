"use client"

import { useRef, useState, type RefObject } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit, Plus, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { adminApi } from "@/lib/api-client"
import { parseServerDateTime } from "@/lib/analytics"
import type { BlocklistSource, BlocklistSourceInput } from "@/lib/types"
import { cn, formatDateTime, formatTimeAgo } from "@/lib/utils"
import { formatMegabytes } from "./format"
import { actionLabels, actionVariants, kindLabels } from "./labels"
import { SourceDialog } from "./source-dialog"
import { useRowRemovalFocus } from "@/lib/hooks/useRowRemovalFocus"

const sourcesKey = ["admin", "blocklists", "sources"]

const iconButtonClassName = "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"

const toInput = (source: BlocklistSource): BlocklistSourceInput => ({
  name: source.name,
  url: source.url,
  kind: source.kind,
  action: source.action,
  enabled: source.enabled,
  refreshIntervalHours: source.refreshIntervalHours,
  fallbackUrls: source.fallbackUrls ?? [],
})

const entryCount = (count: number | null) => (count == null ? "—" : count.toLocaleString())

export function SourcesSection() {
  const { data: sources, isLoading, error, refetch } = useQuery<BlocklistSource[]>({
    queryKey: sourcesKey,
    queryFn: () => adminApi.getBlocklistSources(),
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogSource, setDialogSource] = useState<BlocklistSource | null>(null)
  const [dialogKey, setDialogKey] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const openDialog = (source: BlocklistSource | null) => {
    setDialogSource(source)
    setDialogKey((key) => key + 1)
    setDialogOpen(true)
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex min-h-13 items-center justify-between gap-4 border-b px-5 py-2.5">
        <h2 ref={headingRef} tabIndex={-1} className="rounded-sm text-sm font-semibold">Sources</h2>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => openDialog(null)}>
          <Plus className="h-3.5 w-3.5" />
          Add source
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load sources</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : !sources || sources.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="font-semibold">No sources yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a list of domains or links to check every link against.</p>
        </div>
      ) : (
        <Table className="[&_td]:px-3 [&_th]:px-3">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="hidden @min-[78rem]:table-cell">Kind</TableHead>
              <TableHead className="hidden @min-[45rem]:table-cell">Action</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="hidden @min-[78rem]:table-cell">Every</TableHead>
              <TableHead className="hidden text-right @min-[45rem]:table-cell">Entries</TableHead>
              <TableHead className="hidden text-right @min-[78rem]:table-cell">Memory</TableHead>
              <TableHead className="hidden @min-[78rem]:table-cell">Version</TableHead>
              <TableHead className="hidden @min-[45rem]:table-cell">Last success</TableHead>
              <TableHead className="hidden @min-[78rem]:table-cell">Last error</TableHead>
              <TableHead className="sticky right-0 bg-card bg-[linear-gradient(hsl(var(--muted)/0.5),hsl(var(--muted)/0.5))] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <SourceRow key={source.id} source={source} onEdit={() => openDialog(source)} fallbackFocusRef={headingRef} />
            ))}
          </TableBody>
        </Table>
      )}

      <SourceDialog key={dialogKey} open={dialogOpen} source={dialogSource} onOpenChange={setDialogOpen} />
    </section>
  )
}

function SourceRow({ source, onEdit, fallbackFocusRef }: { source: BlocklistSource; onEdit: () => void; fallbackFocusRef: RefObject<HTMLElement | null> }) {
  const queryClient = useQueryClient()
  const deleteRef = useRef<HTMLButtonElement>(null)
  const removalFocus = useRowRemovalFocus(fallbackFocusRef)
  const replaceSource = (updated: BlocklistSource) =>
    queryClient.setQueryData<BlocklistSource[]>(sourcesKey, (current) =>
      current?.map((entry) => (entry.id === updated.id ? updated : entry)),
    )
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "blocklists"] })

  const toggle = useMutation({
    mutationFn: (enabled: boolean) => adminApi.updateBlocklistSource(source.id, { ...toInput(source), enabled }),
    onSuccess: (updated) => {
      replaceSource(updated)
      toast.success(updated.enabled ? `${updated.name} enabled` : `${updated.name} disabled`)
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update source"),
    onSettled: invalidate,
  })

  const refresh = useMutation<BlocklistSource, Error, string | null>({
    mutationFn: () => adminApi.refreshBlocklistSource(source.id),
    onSuccess: (refreshed, previousSuccessAt) => {
      replaceSource(refreshed)
      if (refreshed.lastError && refreshed.lastSuccessAt === previousSuccessAt) {
        toast.error(`Refresh failed: ${refreshed.lastError}`)
      } else if (refreshed.domainCount != null) {
        toast.success(`${refreshed.name} refreshed: ${refreshed.domainCount.toLocaleString()} entries`)
      } else {
        toast.success(`${refreshed.name} refreshed`)
      }
    },
    onError: (err: Error) => toast.error(err.message || "Failed to refresh source"),
    onSettled: invalidate,
  })

  const remove = useMutation({
    mutationFn: () => adminApi.deleteBlocklistSource(source.id),
    onSuccess: () => toast.success(`${source.name} deleted`),
    onError: (err: Error) => toast.error(err.message || "Failed to delete source"),
    onSettled: invalidate,
  })


  return (
    <TableRow className="group">
      <TableCell>
        <span className="block min-w-32 font-medium [overflow-wrap:anywhere] @lg:min-w-40">{source.name}</span>
        <span className="mt-0.5 block min-w-32 font-mono text-xs text-muted-foreground [overflow-wrap:anywhere] @lg:min-w-40">{source.url}</span>
        <div className="mt-1.5 min-w-32 space-y-1 text-xs text-muted-foreground @lg:min-w-40 @min-[78rem]:hidden">
          <Badge variant={actionVariants[source.action] ?? "secondary"} className="@min-[45rem]:hidden">{actionLabels[source.action] ?? source.action}</Badge>
          <p>
            {kindLabels[source.kind] ?? source.kind} · every {source.refreshIntervalHours} h
          </p>
          <p className="tabular-nums [overflow-wrap:anywhere]">
            <span className="@min-[45rem]:hidden">{entryCount(source.domainCount)} entries · </span>
            {formatMegabytes(source.memoryBytes)} · version {source.listVersion || "—"}
          </p>
          <div className="@min-[45rem]:hidden">
            <LastSuccess source={source} labelled />
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden text-muted-foreground @min-[78rem]:table-cell">{kindLabels[source.kind] ?? source.kind}</TableCell>
      <TableCell className="hidden @min-[45rem]:table-cell">
        <Badge variant={actionVariants[source.action] ?? "secondary"}>{actionLabels[source.action] ?? source.action}</Badge>
      </TableCell>
      <TableCell>
        <Switch
          checked={source.enabled}
          disabled={toggle.isPending}
          onCheckedChange={(enabled) => toggle.mutate(enabled)}
          aria-label={source.enabled ? `Disable ${source.name}` : `Enable ${source.name}`}
        />
      </TableCell>
      <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground @min-[78rem]:table-cell">{source.refreshIntervalHours} h</TableCell>
      <TableCell className="hidden whitespace-nowrap text-right tabular-nums @min-[45rem]:table-cell">{entryCount(source.domainCount)}</TableCell>
      <TableCell className="hidden whitespace-nowrap text-right tabular-nums text-muted-foreground @min-[78rem]:table-cell">{formatMegabytes(source.memoryBytes)}</TableCell>
      <TableCell className="hidden @min-[78rem]:table-cell">
        <span className="block min-w-20 tabular-nums text-muted-foreground [overflow-wrap:anywhere]">{source.listVersion || "—"}</span>
      </TableCell>
      <TableCell className="hidden @min-[45rem]:table-cell">
        <div className="min-w-40">
          <LastSuccess source={source} errorClassName="@min-[78rem]:hidden" />
        </div>
      </TableCell>
      <TableCell className="hidden @min-[78rem]:table-cell">
        {source.lastError ? (
          <span className="block min-w-48 whitespace-pre-wrap rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive [overflow-wrap:anywhere]">
            {source.lastError}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="sticky right-0 bg-card text-right transition-colors group-hover:bg-[linear-gradient(hsl(var(--muted)/0.4),hsl(var(--muted)/0.4))]">
        <div className="flex items-center justify-end gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => refresh.mutate(source.lastSuccessAt)}
                disabled={refresh.isPending}
                aria-label="Refresh now"
                className={iconButtonClassName}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", refresh.isPending && "animate-spin")} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">{refresh.isPending ? "Refreshing..." : "Refresh now"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={onEdit} aria-label="Edit source" className={iconButtonClassName}>
                <Edit className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Edit source</TooltipContent>
          </Tooltip>
          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <button ref={deleteRef} data-remove-row aria-label="Delete source" disabled={remove.isPending} className={cn(iconButtonClassName, "hover:text-destructive")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">Delete source</TooltipContent>
            </Tooltip>
            <AlertDialogContent onCloseAutoFocus={removalFocus.onCloseAutoFocus}>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete source?</AlertDialogTitle>
                <AlertDialogDescription>This deletes {source.name} and removes its loaded list.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { removalFocus.capture(deleteRef.current); remove.mutate() }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}

function LastSuccess({ source, errorClassName, labelled = false }: { source: BlocklistSource; errorClassName?: string; labelled?: boolean }) {
  const fromFallback = source.lastSuccessUrl != null && source.lastSuccessUrl !== source.url
  const lastSuccess = source.lastSuccessAt ? parseServerDateTime(source.lastSuccessAt) : null
  return (
    <div className="flex flex-col items-start gap-1">
      {lastSuccess ? (
        <span className="tabular-nums text-muted-foreground">
          <span className="block">{labelled ? `Last success ${formatTimeAgo(lastSuccess)}` : formatTimeAgo(lastSuccess)}</span>
          <span className="block text-xs">{formatDateTime(lastSuccess)}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">Never loaded</span>
      )}
      {fromFallback && (
        <>
          <Badge variant="warning">From fallback</Badge>
          <span className="font-mono text-xs text-muted-foreground [overflow-wrap:anywhere]">{source.lastSuccessUrl}</span>
        </>
      )}
      {source.lastError && (
        <span className={cn("whitespace-pre-wrap text-xs text-destructive [overflow-wrap:anywhere]", errorClassName)}>Last error: {source.lastError}</span>
      )}
    </div>
  )
}
