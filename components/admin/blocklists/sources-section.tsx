"use client"

import { useState } from "react"
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
import type { BlocklistSource, BlocklistSourceInput } from "@/lib/types"
import { cn, formatDateTime } from "@/lib/utils"
import { formatMegabytes, formatTimeAgo } from "./format"
import { actionLabels, actionVariants, kindLabels } from "./labels"
import { SourceDialog } from "./source-dialog"

const sourcesKey = ["admin", "blocklists", "sources"]

const iconButtonClassName = "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-50"

const toInput = (source: BlocklistSource): BlocklistSourceInput => ({
  name: source.name,
  url: source.url,
  kind: source.kind,
  action: source.action,
  enabled: source.enabled,
  refreshIntervalHours: source.refreshIntervalHours,
  fallbackUrls: source.fallbackUrls,
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

  const openDialog = (source: BlocklistSource | null) => {
    setDialogSource(source)
    setDialogKey((key) => key + 1)
    setDialogOpen(true)
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <div className="flex min-h-13 items-center justify-between gap-4 border-b px-5 py-2.5">
        <h2 className="text-sm font-semibold">Sources</h2>
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
              <TableHead className="hidden lg:table-cell">Kind</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="hidden lg:table-cell">Every</TableHead>
              <TableHead className="text-right">Entries</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Memory</TableHead>
              <TableHead className="hidden lg:table-cell">Version</TableHead>
              <TableHead>Last success</TableHead>
              <TableHead className="hidden lg:table-cell">Last error</TableHead>
              <TableHead className="sticky right-0 bg-card bg-[linear-gradient(hsl(var(--muted)/0.5),hsl(var(--muted)/0.5))] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.map((source) => (
              <SourceRow key={source.id} source={source} onEdit={() => openDialog(source)} />
            ))}
          </TableBody>
        </Table>
      )}

      <SourceDialog key={dialogKey} open={dialogOpen} source={dialogSource} onOpenChange={setDialogOpen} />
    </section>
  )
}

function SourceRow({ source, onEdit }: { source: BlocklistSource; onEdit: () => void }) {
  const queryClient = useQueryClient()
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

  const fromFallback = source.lastSuccessUrl != null && source.lastSuccessUrl !== source.url

  return (
    <TableRow className="group">
      <TableCell>
        <span className="block max-w-40 truncate font-medium" title={source.name}>{source.name}</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="mt-0.5 block max-w-40 truncate font-mono text-xs text-muted-foreground">{source.url}</span>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-sm whitespace-normal break-all font-mono">{source.url}</TooltipContent>
        </Tooltip>
      </TableCell>
      <TableCell className="hidden text-muted-foreground lg:table-cell">{kindLabels[source.kind] ?? source.kind}</TableCell>
      <TableCell>
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
      <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground lg:table-cell">{source.refreshIntervalHours} h</TableCell>
      <TableCell className="whitespace-nowrap text-right tabular-nums">{entryCount(source.domainCount)}</TableCell>
      <TableCell className="hidden whitespace-nowrap text-right tabular-nums text-muted-foreground lg:table-cell">{formatMegabytes(source.memoryBytes)}</TableCell>
      <TableCell className="hidden lg:table-cell">
        <span className="block max-w-20 truncate tabular-nums text-muted-foreground" title={source.listVersion || undefined}>{source.listVersion || "—"}</span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1 whitespace-nowrap">
          <span className="tabular-nums text-muted-foreground" title={source.lastSuccessAt ? formatDateTime(source.lastSuccessAt) : undefined}>
            {source.lastSuccessAt ? formatTimeAgo(source.lastSuccessAt) : "Never"}
          </span>
          {fromFallback && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-flex">
                  <Badge variant="warning">From fallback</Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-sm whitespace-normal break-all font-mono">{source.lastSuccessUrl}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {source.lastError ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="block max-w-36 truncate rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                {source.lastError}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap break-words">{source.lastError}</TooltipContent>
          </Tooltip>
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
                  <button aria-label="Delete source" disabled={remove.isPending} className={cn(iconButtonClassName, "hover:text-destructive")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="top">Delete source</TooltipContent>
            </Tooltip>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete source?</AlertDialogTitle>
                <AlertDialogDescription>This deletes {source.name} and removes its loaded list.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => remove.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  )
}
