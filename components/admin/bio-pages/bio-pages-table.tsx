"use client"

import { useEffect, useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ExternalLink, Search } from "lucide-react"
import { toast } from "sonner"
import { BioPageHandleDialog } from "@/components/admin/bio-pages/bio-page-handle-dialog"
import { BioPageReasonDialog, errorText } from "@/components/admin/bio-pages/bio-page-reason-dialog"
import { DateTimeLines } from "@/components/admin/date-time-lines"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { parseServerDateTime } from "@/lib/analytics"
import { useAdminBioPages, useChangeBioPageHandle, useHideBioPage, useRevokeBioPageHandle, useUnhideBioPage, type AdminBioPageFilters } from "@/lib/hooks/useAdminBioPages"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import { useRowRemovalFocus } from "@/lib/hooks/useRowRemovalFocus"
import type { AdminBioPage } from "@/lib/types"
import { cn, formatDateTime } from "@/lib/utils"

type DialogKind = "hide" | "unhide" | "handle" | "revoke"

type FocusKey = "visibility" | "handle"

interface OpenDialog {
  kind: DialogKind
  page: AdminBioPage
  trigger: HTMLElement | null
}

const SEARCH_PARAM = "search"

const HIDDEN_PARAM = "hidden"

const SEARCH_DELAY_MS = 300

const focusAfter: Record<DialogKind, FocusKey> = { hide: "visibility", unhide: "visibility", handle: "handle", revoke: "handle" }

const rowButton = "h-8 px-2.5"

const writeParam = (name: string, value: string | null) => {
  const params = new URLSearchParams(window.location.search)
  if (value) params.set(name, value)
  else params.delete(name)
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)
}

const rowSelector = (pageId: number) => `[data-bio-page-row="${pageId}"]`

const pageName = (page: Pick<AdminBioPage, "id" | "handle" | "displayName">) =>
  page.handle ? `@${page.handle}` : page.displayName || `bio page ${page.id}`

export function BioPagesTable() {
  const searchParams = useSearchParams()
  const { page, size, setPage, setSize } = usePagination()
  const [searchInput, setSearchInput] = useState(() => searchParams.get(SEARCH_PARAM) ?? "")
  const [search, setSearch] = useState(() => (searchParams.get(SEARCH_PARAM) ?? "").trim())
  const [hiddenOnly, setHiddenOnly] = useState(() => searchParams.get(HIDDEN_PARAM) === "true")
  const filters: AdminBioPageFilters = { search: search || undefined, hiddenOnly: hiddenOnly || undefined }
  const { data, isLoading, error, refetch, isFetching } = useAdminBioPages(filters, page, size)
  useClampedPage(page, data?.totalPages, setPage)
  const pages = data?.content ?? []
  const filtered = !!search || hiddenOnly
  const hide = useHideBioPage()
  const unhide = useUnhideBioPage()
  const changeHandle = useChangeBioPageHandle()
  const revoke = useRevokeBioPageHandle()
  const [dialog, setDialog] = useState<OpenDialog | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  const removalFocus = useRowRemovalFocus(searchRef)
  const pendingFocus = useRef<{ pageId: number; key: FocusKey } | null>(null)

  const applySearch = (value: string) => {
    const next = value.trim()
    if (next === search) return
    setSearch(next)
    setPage(0)
    writeParam(SEARCH_PARAM, next || null)
  }

  useEffect(() => {
    const next = searchInput.trim()
    if (next === search) return
    const timer = window.setTimeout(() => {
      setSearch(next)
      setPage(0)
      writeParam(SEARCH_PARAM, next || null)
    }, SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput, search, setPage])

  const openDialog = (kind: DialogKind, target: AdminBioPage, trigger: HTMLElement | null) => {
    pendingFocus.current = null
    setDialog({ kind, page: target, trigger })
    setDialogOpen(true)
  }

  const run = async (current: OpenDialog, action: () => Promise<unknown>) => {
    removalFocus.capture(document.querySelector<HTMLElement>(`${rowSelector(current.page.id)} [data-remove-row]`))
    try {
      await action()
    } catch (actionError) {
      removalFocus.setTarget(current.trigger)
      throw actionError
    }
    pendingFocus.current = { pageId: current.page.id, key: focusAfter[current.kind] }
    setDialogOpen(false)
  }

  const closeAutoFocus = (event: Event) => {
    const pending = pendingFocus.current
    pendingFocus.current = null
    const own = pending && document.querySelector<HTMLElement>(`${rowSelector(pending.pageId)} [data-row-action="${pending.key}"]`)
    if (own) removalFocus.setTarget(own)
    else if (!pending) removalFocus.setTarget(dialog?.trigger ?? null)
    removalFocus.onCloseAutoFocus(event)
  }

  const confirmHide = (reason: string) => {
    if (!dialog) return Promise.resolve()
    const current = dialog
    return run(current, async () => {
      await hide.mutateAsync({ id: current.page.id, reason })
      toast.success(`Hid ${pageName(current.page)}`)
    })
  }

  const confirmUnhide = () => {
    if (!dialog) return Promise.resolve()
    const current = dialog
    return run(current, async () => {
      await unhide.mutateAsync(current.page.id)
      toast.success(`Unhid ${pageName(current.page)}`)
    })
  }

  const confirmHandle = (handle: string) => {
    if (!dialog) return Promise.resolve()
    const current = dialog
    return run(current, async () => {
      const saved = await changeHandle.mutateAsync({ id: current.page.id, handle })
      toast.success(`Handle changed to @${saved.handle ?? handle}`)
    })
  }

  const confirmRevoke = (reason: string) => {
    if (!dialog) return Promise.resolve()
    const current = dialog
    return run(current, async () => {
      await revoke.mutateAsync({ id: current.page.id, reason, expectedHandle: current.page.handle })
      toast.success(`Revoked ${pageName(current.page)} and reserved it`)
    })
  }

  const closeDialog = (open: boolean) => {
    if (!open) setDialogOpen(false)
  }

  return (
    <div className="space-y-6">
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
            ref={searchRef}
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by handle, name or owner email"
            aria-label="Search by handle, name or owner email"
            className="h-9 pl-9"
          />
        </form>
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={hiddenOnly}
            onChange={(event) => {
              setHiddenOnly(event.target.checked)
              setPage(0)
              writeParam(HIDDEN_PARAM, event.target.checked ? "true" : null)
            }}
            className="h-4 w-4 rounded border-input accent-brand"
          />
          Hidden only
        </label>
      </div>

      {isLoading ? (
        <BioPagesLoading />
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load bio pages</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
        </div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">{filtered ? "No bio pages match." : "No bio pages yet."}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table data-bio-pages-table>
            <TableHeader>
              <TableRow>
                <TableHead>Page</TableHead>
                <TableHead className="hidden @min-[59rem]:table-cell">Owner</TableHead>
                <TableHead className="hidden @4xl:table-cell">Buttons</TableHead>
                <TableHead className="hidden @2xl:table-cell">Status</TableHead>
                <TableHead className="hidden @min-[67rem]:table-cell">Created</TableHead>
                <TableHead className="sticky right-0 bg-card bg-[linear-gradient(hsl(var(--muted)/0.5),hsl(var(--muted)/0.5))] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((bioPage) => (
                <TableRow key={bioPage.id} data-bio-page-row={bioPage.id} className="group">
                  <TableCell>
                    <PageIdentity page={bioPage} />
                    <div className="mt-1 min-w-36 space-y-1 text-xs text-muted-foreground @lg:min-w-56 @min-[67rem]:hidden">
                      <p className="[overflow-wrap:anywhere] @min-[59rem]:hidden">{bioPage.ownerEmail}</p>
                      <p className="tabular-nums">Created {formatDateTime(parseServerDateTime(bioPage.createdAt))}</p>
                      <p className="tabular-nums @4xl:hidden">{buttonsText(bioPage)}</p>
                    </div>
                    <BioPageStatus page={bioPage} className="mt-2 min-w-36 @lg:min-w-56 @2xl:hidden" />
                  </TableCell>
                  <TableCell className="hidden @min-[59rem]:table-cell">
                    <span className="block min-w-48 [overflow-wrap:anywhere]">{bioPage.ownerEmail}</span>
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap tabular-nums @4xl:table-cell">{buttonsText(bioPage)}</TableCell>
                  <TableCell className="hidden @2xl:table-cell">
                    <BioPageStatus page={bioPage} className="min-w-40 max-w-72" />
                  </TableCell>
                  <TableCell className="hidden tabular-nums text-muted-foreground @min-[67rem]:table-cell">
                    <DateTimeLines value={bioPage.createdAt} />
                  </TableCell>
                  <TableCell className="sticky right-0 bg-card text-right transition-colors group-hover:bg-[linear-gradient(hsl(var(--muted)/0.4),hsl(var(--muted)/0.4))]">
                    <div className="ml-auto flex w-max flex-col items-stretch gap-1 @min-[77rem]:flex-row @min-[77rem]:items-center">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-remove-row
                        data-row-action="visibility"
                        onClick={(event) => openDialog(bioPage.hidden ? "unhide" : "hide", bioPage, event.currentTarget)}
                        className={cn(rowButton, !bioPage.hidden && "text-destructive hover:text-destructive")}
                      >
                        {bioPage.hidden ? "Unhide" : "Hide"}
                        <span className="sr-only"> {pageName(bioPage)}</span>
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-row-action="handle"
                        onClick={(event) => openDialog("handle", bioPage, event.currentTarget)}
                        className={rowButton}
                      >
                        Change handle
                        <span className="sr-only"> for {pageName(bioPage)}</span>
                      </Button>
                      {bioPage.handle && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          data-row-action="revoke"
                          onClick={(event) => openDialog("revoke", bioPage, event.currentTarget)}
                          className={cn(rowButton, "text-destructive hover:text-destructive")}
                        >
                          Revoke handle
                          <span className="sr-only"> {pageName(bioPage)}</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={setSize}
          />
        </div>
      )}

      <BioPageReasonDialog
        mode="hide"
        page={dialog?.kind === "hide" ? dialog.page : null}
        open={dialogOpen && dialog?.kind === "hide"}
        onOpenChange={closeDialog}
        onConfirm={confirmHide}
        onCloseAutoFocus={closeAutoFocus}
      />
      <BioPageReasonDialog
        mode="revoke"
        page={dialog?.kind === "revoke" ? dialog.page : null}
        open={dialogOpen && dialog?.kind === "revoke"}
        onOpenChange={closeDialog}
        onConfirm={confirmRevoke}
        onCloseAutoFocus={closeAutoFocus}
      />
      <BioPageHandleDialog
        page={dialog?.kind === "handle" ? dialog.page : null}
        open={dialogOpen && dialog?.kind === "handle"}
        onOpenChange={closeDialog}
        onConfirm={confirmHandle}
        onCloseAutoFocus={closeAutoFocus}
      />
      <UnhideDialog
        page={dialog?.kind === "unhide" ? dialog.page : null}
        open={dialogOpen && dialog?.kind === "unhide"}
        onOpenChange={closeDialog}
        onConfirm={confirmUnhide}
        onCloseAutoFocus={closeAutoFocus}
      />
    </div>
  )
}

export function BioPagesLoading() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-5">
      {[...Array(5)].map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  )
}

const buttonsText = (page: AdminBioPage) => `${page.visibleButtons.toLocaleString()} of ${page.buttons.toLocaleString()} shown`

export function BioPageLink({ handle, className }: { handle: string | null; className?: string }) {
  if (!handle) return <span className={cn("block text-muted-foreground", className)}>No handle</span>
  return (
    <a
      href={`/bio/${encodeURIComponent(handle)}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("inline-flex min-w-0 max-w-full items-baseline gap-1 font-mono text-[13px] font-medium text-brand hover:underline", className)}
    >
      <span className="min-w-0 [overflow-wrap:anywhere]">@{handle}</span>
      <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0 self-center" />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  )
}

function PageIdentity({ page }: { page: AdminBioPage }) {
  return (
    <div className="min-w-36 @lg:min-w-56">
      <BioPageLink handle={page.handle} />
      {page.displayName && <p className="mt-0.5 [overflow-wrap:anywhere]">{page.displayName}</p>}
    </div>
  )
}

function StatusLine({ label, reason, tone }: { label: string; reason: string | null; tone: string }) {
  return (
    <p className="[overflow-wrap:anywhere]">
      <span className={cn("font-medium", tone)}>{reason ? `${label}:` : label}</span>
      {reason && ` ${reason}`}
    </p>
  )
}

function BioPageStatus({ page, className }: { page: AdminBioPage; className?: string }) {
  const live = !page.hidden && !!page.handle && page.ownerActive
  return (
    <div className={cn("space-y-1 text-sm", className)}>
      {live && <p className="font-medium text-success">Live</p>}
      {page.hidden && <StatusLine label="Hidden" reason={page.hiddenReason} tone="text-destructive" />}
      {!page.handle && <StatusLine label="No handle" reason={page.handleRevokedReason} tone="text-warning" />}
      {!page.ownerActive && <p className="font-medium text-destructive">Owner deactivated</p>}
      {page.reviewOpen && (
        <Link
          href={`/admin/review?bio=${page.id}`}
          className={cn(badgeVariants({ variant: "warning" }), "whitespace-nowrap underline-offset-2 hover:underline")}
        >
          In review
        </Link>
      )}
    </div>
  )
}

interface UnhideDialogProps {
  page: AdminBioPage | null
  open: boolean
  onOpenChange(open: boolean): void
  onConfirm(): Promise<void>
  onCloseAutoFocus(event: Event): void
}

function UnhideDialog({ page, open, onOpenChange, onConfirm, onCloseAutoFocus }: UnhideDialogProps) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submitting = useRef(false)

  const confirm = async () => {
    if (submitting.current) return
    submitting.current = true
    setBusy(true)
    setError(null)
    try {
      await onConfirm()
    } catch (confirmError) {
      setError(errorText(confirmError))
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return
        if (!next) setError(null)
        onOpenChange(next)
      }}
    >
      <AlertDialogContent onEscapeKeyDown={(event) => { if (busy) event.preventDefault() }} onCloseAutoFocus={onCloseAutoFocus}>
        {page && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle className="leading-snug [overflow-wrap:anywhere]">Unhide {pageName(page)}?</AlertDialogTitle>
              <AlertDialogDescription className="[overflow-wrap:anywhere]">
                {page.handle ? "Visitors can open the page again, and the reason is cleared." : "The reason is cleared. The page stays offline until it has a handle again."}
              </AlertDialogDescription>
              <p role="alert" className="text-sm text-destructive [overflow-wrap:anywhere]">{error}</p>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <Button
                type="button"
                onClick={confirm}
                aria-disabled={busy}
                aria-busy={busy}
                className="aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                {busy ? "Unhiding…" : "Unhide"}
              </Button>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  )
}
