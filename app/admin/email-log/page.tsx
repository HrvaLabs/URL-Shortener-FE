"use client"

import { Fragment, Suspense, useEffect, useRef, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { RotateCw, Search } from "lucide-react"
import { toast } from "sonner"
import { usePagination } from "@/lib/hooks/usePagination"
import { useListSearch } from "@/lib/hooks/useListSearch"
import { useRowRemovalFocus } from "@/lib/hooks/useRowRemovalFocus"
import { Pagination } from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageMeta } from "@/components/page-meta"
import { DateTimeLines } from "@/components/admin/date-time-lines"
import { SortHead } from "@/components/admin/sort-controls"
import { adminApi } from "@/lib/api-client"
import type { EmailLog, EmailLogFilters, EmailStatus, Page } from "@/lib/types"

const sortFields = ["createdAt"]

const statusColors: Record<string, "default" | "secondary" | "destructive" | "success" | "outline"> = {
  SENT: "success",
  FAILED: "destructive",
  SENDING: "secondary",
  RESENT: "outline",
  SKIPPED: "outline",
}

const statusLabels: Record<string, string> = {
  SENT: "Sent",
  FAILED: "Failed",
  SENDING: "Sending",
  RESENT: "Resent",
  SKIPPED: "Not sent",
}

const recipientList = (recipient: string) => recipient.replace(/^\[(.*)\]$/, "$1")

function Recipient({ value }: { value: string }) {
  return (
    <>
      {recipientList(value).split("@").map((part, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <>
              @<wbr />
            </>
          )}
          {part}
        </Fragment>
      ))}
    </>
  )
}

function StatusBadge({ status }: { status: string }) {
  return <Badge variant={statusColors[status] ?? "secondary"}>{statusLabels[status] ?? status}</Badge>
}

const STATUS_PARAM = "status"

const FAILED: EmailStatus = "FAILED"

function useFailedOnly() {
  const failedOnly = useSearchParams().get(STATUS_PARAM) === FAILED

  const update = (next: boolean) => {
    const params = new URLSearchParams(window.location.search)
    if (next) params.set(STATUS_PARAM, FAILED)
    else params.delete(STATUS_PARAM)
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)
  }

  return [failedOnly, update] as const
}

function EmailLogLoading() {
  return (
    <div className="space-y-3 rounded-xl border bg-card p-5">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  )
}

export default function AdminEmailLogPage() {
  return (
    <Suspense fallback={<EmailLogLoading />}>
      <EmailLog />
    </Suspense>
  )
}

function EmailLog() {
  const { page, size, sort, order, setPage, setSize, toggleSort, sortDir } = usePagination("createdAt", "desc", sortFields)
  const { search, searchInput, setSearchInput, applySearch } = useListSearch(() => setPage(0))
  const [failedOnly, setFailedOnly] = useFailedOnly()
  const status = failedOnly ? FAILED : undefined
  const filters: EmailLogFilters = { status, search: search || undefined }
  const queryClient = useQueryClient()
  const { data, isLoading, error, refetch, isFetching, dataUpdatedAt, errorUpdatedAt } = useQuery<Page<EmailLog>>({
    queryKey: ["admin", "email-log", filters, page, size, sort, order],
    queryFn: () => adminApi.getEmailLog(filters, page, size, sort, order),
    placeholderData: keepPreviousData,
  })
  const failedOnlyRef = useRef<HTMLInputElement>(null)
  const removalFocus = useRowRemovalFocus(failedOnlyRef)
  const restoreFocus = removalFocus.restore
  const restoreAfterRefetch = useRef(false)
  const resendEmail = useMutation({
    mutationFn: (id: number) => adminApi.resendEmail(id),
    onSuccess: (resent) => {
      restoreAfterRefetch.current = true
      if (resent.status === "SENT") toast.success("Email resent")
      else toast.error(resent.errorMessage ? `Resend failed: ${resent.errorMessage}` : "Resend failed")
    },
    onError: (err: Error) => toast.error(err.message || "Failed to resend email"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "email-log"] }),
  })
  const settled = !isFetching && !resendEmail.isPending

  useEffect(() => {
    if (!restoreAfterRefetch.current || !settled) return
    restoreAfterRefetch.current = false
    restoreFocus()
  }, [settled, dataUpdatedAt, errorUpdatedAt, restoreFocus])

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Email log" description="View email delivery status." />
      <div>
        <h1 className="font-display text-2xl">Email log</h1>
        <p className="mt-1 text-sm text-muted-foreground">View email delivery status</p>
      </div>

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
            placeholder="Search recipient or subject"
            aria-label="Search the email log by recipient or subject"
            spellCheck={false}
            autoCapitalize="none"
            className="h-9 pl-9"
          />
        </form>
        <label className="flex w-fit cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-muted-foreground">
          <input
            ref={failedOnlyRef}
            type="checkbox"
            checked={failedOnly}
            onChange={(event) => {
              setFailedOnly(event.target.checked)
              setPage(0)
            }}
            className="h-4 w-4 rounded border-input accent-brand"
          />
          Failed only
        </label>
      </div>

      {isLoading ? (
        <EmailLogLoading />
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load the email log</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          {search ? (
            <>
              <p className="font-semibold">No emails match</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search.</p>
            </>
          ) : failedOnly ? (
            <p className="font-semibold">No failed emails.</p>
          ) : (
            <>
              <p className="font-semibold">No emails sent yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Outgoing emails will be listed here with their delivery status.</p>
            </>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead field="createdAt" label="Time" sortDir={sortDir} toggleSort={toggleSort} />
                <TableHead>Recipient</TableHead>
                <TableHead className="hidden @min-[59rem]:table-cell">Subject</TableHead>
                <TableHead className="hidden @min-[59rem]:table-cell">Status</TableHead>
                <TableHead className="hidden @min-[59rem]:table-cell">Error</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="tabular-nums text-muted-foreground">
                    <DateTimeLines value={entry.createdAt} />
                  </TableCell>
                  <TableCell>
                    <span className="block min-w-44 font-medium [overflow-wrap:anywhere]">
                      <Recipient value={entry.recipient} />
                    </span>
                    <div className="mt-1 min-w-44 space-y-1 text-xs @min-[59rem]:hidden">
                      <p className="[overflow-wrap:anywhere]">{entry.subject}</p>
                      <StatusBadge status={entry.status} />
                      {entry.errorMessage && <p className="text-muted-foreground [overflow-wrap:anywhere]">Error: {entry.errorMessage}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden @min-[59rem]:table-cell">
                    <span className="block min-w-40 [overflow-wrap:anywhere]">{entry.subject}</span>
                  </TableCell>
                  <TableCell className="hidden @min-[59rem]:table-cell">
                    <StatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground @min-[59rem]:table-cell">
                    <span className="block min-w-44 [overflow-wrap:anywhere]">{entry.errorMessage || "—"}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.resendable ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                        data-remove-row
                        aria-disabled={resendEmail.isPending}
                        onClick={(event) => {
                          if (resendEmail.isPending) return
                          removalFocus.capture(event.currentTarget)
                          resendEmail.mutate(entry.id)
                        }}
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        Resend
                      </Button>
                    ) : null}
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
    </div>
  )
}
