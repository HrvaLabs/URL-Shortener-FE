"use client"

import { useRef, useState, type RefObject } from "react"
import Link from "next/link"
import { Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { analyticsHref, parseServerDateTime } from "@/lib/analytics"
import { ApiError } from "@/lib/api-client"
import { useReservedAliases, useUnreserveAlias } from "@/lib/hooks/useReservedAliases"
import type { ReservedAlias, ReservedAliasLink } from "@/lib/types"
import { cn, focusTargetAfterRemoving, formatDateTime } from "@/lib/utils"

const matches = (entry: ReservedAlias, query: string) =>
  [entry.alias, entry.reason, entry.createdBy ?? ""].some((value) => value.toLowerCase().includes(query))

export function ReservedAliasTable() {
  const { data: aliases, isLoading, error, refetch, isRefetching } = useReservedAliases()
  const [search, setSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const query = search.trim().toLowerCase()
  const rows = (aliases ?? []).filter((entry) => matches(entry, query))

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <div className="border-b p-4">
        <div className="relative max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search alias, reason or added by..."
            aria-label="Search reserved aliases by alias, reason or who added them"
            className="h-9 pl-9"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Couldn&apos;t load the reserved aliases. Try again.</p>
          <Button variant="outline" size="sm" className="mt-4" disabled={isRefetching} onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      ) : rows.length === 0 ? (
        <p className="px-6 py-12 text-center text-sm text-muted-foreground">No reserved aliases match.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alias</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Added</TableHead>
              <TableHead>In use by</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((entry) => (
              <ReservedAliasRow key={entry.alias} entry={entry} fallbackFocusRef={searchRef} />
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}

function ReservedAliasRow({ entry, fallbackFocusRef }: { entry: ReservedAlias; fallbackFocusRef: RefObject<HTMLElement | null> }) {
  return (
    <TableRow>
      <TableCell>
        <span className="block min-w-28 font-mono text-[13px] font-medium [overflow-wrap:anywhere]">{entry.alias}</span>
      </TableCell>
      <TableCell>
        <span className="block min-w-48 [overflow-wrap:anywhere]">{entry.reason}</span>
      </TableCell>
      <TableCell>
        {entry.builtIn ? (
          <Badge variant="secondary">Built-in</Badge>
        ) : (
          <span className="block min-w-40 text-muted-foreground">
            <span className="block whitespace-nowrap tabular-nums">{entry.createdAt ? formatDateTime(parseServerDateTime(entry.createdAt)) : "—"}</span>
            {entry.createdBy && <span className="block [overflow-wrap:anywhere]">by {entry.createdBy}</span>}
          </span>
        )}
      </TableCell>
      <TableCell>
        <InUseBy links={entry.inUse} />
      </TableCell>
      <TableCell className="text-right">
        {!entry.builtIn && entry.id != null && <RemoveButton id={entry.id} alias={entry.alias} fallbackFocusRef={fallbackFocusRef} />}
      </TableCell>
    </TableRow>
  )
}

function InUseBy({ links }: { links: ReservedAliasLink[] }) {
  if (links.length === 0) return <span className="text-muted-foreground">—</span>

  return (
    <ul className="min-w-56 space-y-1">
      {links.map((link) => (
        <li key={link.id} className="[overflow-wrap:anywhere]">
          <Link href={analyticsHref({ link: link.id })} className="font-mono text-[13px] font-medium text-brand hover:underline">
            /{link.shortUrl}
          </Link>
          <span className="text-muted-foreground"> · </span>
          <span className={cn(link.ownerEmail == null && "text-muted-foreground")}>{link.ownerEmail ?? "Anonymous"}</span>
          {!link.active && <span className="text-muted-foreground"> (inactive)</span>}
        </li>
      ))}
    </ul>
  )
}

function RemoveButton({ id, alias, fallbackFocusRef }: { id: number; alias: string; fallbackFocusRef: RefObject<HTMLElement | null> }) {
  const unreserve = useUnreserveAlias()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const focusAfterClose = useRef<HTMLElement | null>(null)

  const remove = () => {
    if (unreserve.isPending) return
    focusAfterClose.current = focusTargetAfterRemoving(triggerRef.current, fallbackFocusRef.current)
    unreserve.mutateAsync(id).then(
      () => toast.success(`Removed ${alias}`),
      (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't remove the reservation. Try again."),
    )
  }

  const focusOffTheRow = (event: Event) => {
    const target = focusAfterClose.current
    if (!target) return
    focusAfterClose.current = null
    event.preventDefault()
    const next = target.isConnected ? target : fallbackFocusRef.current
    next?.focus()
  }

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <button
              ref={triggerRef}
              data-remove-row
              aria-label={`Remove the reservation for ${alias}`}
              disabled={unreserve.isPending}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">Remove</TooltipContent>
      </Tooltip>
      <AlertDialogContent onCloseAutoFocus={focusOffTheRow}>
        <AlertDialogHeader>
          <AlertDialogTitle className="[overflow-wrap:anywhere]">Remove the reservation for {alias}?</AlertDialogTitle>
          <AlertDialogDescription>Anyone will be able to create a link with this alias again.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={remove} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
