"use client"

import { useRef, useState, type RefObject } from "react"
import Link from "next/link"
import { Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
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

const shortLinks = (links: ReservedAliasLink[]) => {
  const names = links.map((link) => `/${link.shortUrl}`)
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`
}

export function ReservedAliasTable() {
  const { data: aliases, isLoading, error, refetch, isRefetching } = useReservedAliases()
  const [search, setSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)
  const query = search.trim().toLowerCase()
  const custom = (aliases ?? []).filter((entry) => !entry.builtIn && matches(entry, query))
  const builtIn = (aliases ?? []).filter((entry) => entry.builtIn)
  const builtInShown = builtIn.filter((entry) => matches(entry, query))

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
      ) : (
        <>
          {custom.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              {query ? "No custom reservations match." : "No custom reservations yet."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alias</TableHead>
                  <TableHead className="hidden @min-[29rem]:table-cell">Reason</TableHead>
                  <TableHead className="hidden @min-[55rem]:table-cell">Added</TableHead>
                  <TableHead className="hidden @min-[55rem]:table-cell">In use by</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {custom.map((entry) => (
                  <ReservedAliasRow key={entry.alias} entry={entry} fallbackFocusRef={searchRef} />
                ))}
              </TableBody>
            </Table>
          )}
          {builtInShown.length > 0 && <BuiltInAliases entries={builtInShown} total={builtIn.length} filtered={!!query} />}
        </>
      )}
    </section>
  )
}

function BuiltInAliases({ entries, total, filtered }: { entries: ReservedAlias[]; total: number; filtered: boolean }) {
  const count = filtered ? `${entries.length} of ${total}` : String(total)
  return (
    <div className="border-t bg-muted/30 px-5 py-3.5 text-sm">
      <p className="text-muted-foreground">
        Built in ({count}), used by hrva.cc itself and never removable:{" "}
        {entries.map((entry, index) => (
          <span key={entry.alias}>
            {index > 0 && ", "}
            <span className="font-mono text-[13px] text-foreground">{entry.alias}</span>
            {entry.inUse.length > 0 && <span> (in use by {shortLinks(entry.inUse)})</span>}
          </span>
        ))}
      </p>
    </div>
  )
}

function AddedBy({ entry }: { entry: ReservedAlias }) {
  return (
    <>
      <span className="block whitespace-nowrap tabular-nums">{entry.createdAt ? formatDateTime(parseServerDateTime(entry.createdAt)) : "—"}</span>
      {entry.createdBy && <span className="block [overflow-wrap:anywhere]">by {entry.createdBy}</span>}
    </>
  )
}

function ReservedAliasRow({ entry, fallbackFocusRef }: { entry: ReservedAlias; fallbackFocusRef: RefObject<HTMLElement | null> }) {
  const details = (
    <div className="mt-1 space-y-1 text-xs text-muted-foreground">
      <p className="[overflow-wrap:anywhere]">
        <span className="tabular-nums">Added {entry.createdAt ? formatDateTime(parseServerDateTime(entry.createdAt)) : "—"}</span>
        {entry.createdBy && ` by ${entry.createdBy}`}
      </p>
      {entry.inUse.length > 0 ? (
        <div>
          <p>In use by</p>
          <InUseBy links={entry.inUse} className="text-foreground" />
        </div>
      ) : (
        <p>Not in use</p>
      )}
    </div>
  )

  return (
    <TableRow>
      <TableCell>
        <span className="block min-w-28 font-mono text-[13px] font-medium [overflow-wrap:anywhere]">{entry.alias}</span>
        <div className="min-w-40 @min-[29rem]:hidden">
          <p className="mt-1 [overflow-wrap:anywhere]">{entry.reason}</p>
          {details}
        </div>
      </TableCell>
      <TableCell className="hidden @min-[29rem]:table-cell">
        <span className="block min-w-48 [overflow-wrap:anywhere]">{entry.reason}</span>
        <div className="min-w-48 @min-[55rem]:hidden">{details}</div>
      </TableCell>
      <TableCell className="hidden @min-[55rem]:table-cell">
        <span className="block min-w-40 text-muted-foreground">
          <AddedBy entry={entry} />
        </span>
      </TableCell>
      <TableCell className="hidden @min-[55rem]:table-cell">
        {entry.inUse.length > 0 ? <InUseBy links={entry.inUse} className="min-w-56" /> : <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="text-right">
        {entry.id != null && <RemoveButton id={entry.id} alias={entry.alias} inUse={entry.inUse} fallbackFocusRef={fallbackFocusRef} />}
      </TableCell>
    </TableRow>
  )
}

function InUseBy({ links, className }: { links: ReservedAliasLink[]; className?: string }) {
  return (
    <ul className={cn("space-y-1", className)}>
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

interface RemoveButtonProps {
  id: number
  alias: string
  inUse: ReservedAliasLink[]
  fallbackFocusRef: RefObject<HTMLElement | null>
}

function RemoveButton({ id, alias, inUse, fallbackFocusRef }: RemoveButtonProps) {
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
          <AlertDialogDescription className="[overflow-wrap:anywhere]">
            {inUse.length > 0
              ? `Anyone will be able to create a link with this alias again once ${shortLinks(inUse)} ${inUse.length === 1 ? "is" : "are"} deleted.`
              : "Anyone will be able to create a link with this alias again."}
          </AlertDialogDescription>
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
