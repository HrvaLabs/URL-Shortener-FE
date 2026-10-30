"use client"

import { Suspense, useState, type FormEvent } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { usePagination } from "@/lib/hooks/usePagination"
import { useListSearch } from "@/lib/hooks/useListSearch"
import { useAddressParam } from "@/lib/hooks/useAddressParam"
import { Pagination } from "@/components/ui/pagination"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageMeta } from "@/components/page-meta"
import { DateTimeLines } from "@/components/admin/date-time-lines"
import { SortHead, adminSelectClass } from "@/components/admin/sort-controls"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminApi } from "@/lib/api-client"
import type { AuditAction, AuditLog, AuditLogFilters, Page } from "@/lib/types"

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "outline"

const actionLabels: Record<AuditAction, string> = {
  RESOLVE_REVIEW: "Resolved review",
  BLOCK_LINK: "Blocked link",
  BLOCK_DOMAIN: "Blocked domain",
  ALLOW_DOMAIN: "Trusted domain",
  REMOVE_DOMAIN_RULE: "Removed domain rule",
  BLOCK_USER: "Blocked user",
  REACTIVATE_USER: "Unblocked user",
  DELETE_LINK: "Deleted flagged link",
  UPDATE_URL: "Updated link",
  REVOKE_URL: "Revoked link",
  ACTIVATE_URL: "Activated link",
  DELETE_URL: "Deleted link",
  UPDATE_USER: "Updated user",
  DELETE_USER: "Deleted user",
  CREATE_SOURCE: "Added blocklist",
  UPDATE_SOURCE: "Edited blocklist",
  DELETE_SOURCE: "Removed blocklist",
  REFRESH_SOURCE: "Refreshed blocklist",
  RESEND_EMAIL: "Resent email",
  CLEAR_LOGIN_ATTEMPTS: "Cleared login limits",
  RESERVE_ALIAS: "Reserved alias",
  UNRESERVE_ALIAS: "Removed reserved alias",
  HIDE_BIO_PAGE: "Hid bio page",
  UNHIDE_BIO_PAGE: "Unhid bio page",
  RENAME_BIO_HANDLE: "Changed bio handle",
  REVOKE_BIO_HANDLE: "Revoked bio handle",
  RESOLVE_BIO_REVIEW: "Resolved bio page review",
  APPROVE_DOMAIN: "Approved domain",
  REJECT_DOMAIN: "Rejected domain",
  DISABLE_DOMAIN: "Turned domain off",
  ENABLE_DOMAIN: "Turned domain on",
  RETRY_DOMAIN: "Retried domain",
  DELETE_DOMAIN: "Removed domain",
  SET_DOMAIN_ALLOWANCE: "Set domain limit",
  REMOVE_DOMAIN_ALLOWANCE: "Removed domain limit",
  CHANGE_SETTING: "Changed setting",
  RESET_SETTING: "Reset setting",
  TURN_OFF_SIGN_IN_METHOD: "Turned off sign-in method",
  TURN_ON_SIGN_IN_METHOD: "Turned on sign-in method",
  REMOVE_PASSWORD: "Removed password",
  ALLOW_CAMPAIGN_SHAPE: "Allowed campaign shape",
  REPORT_DOMAINS: "Reported domains",
  UNKNOWN: "Unknown action",
}

const actionColors: Record<AuditAction, BadgeVariant> = {
  RESOLVE_REVIEW: "secondary",
  BLOCK_LINK: "destructive",
  BLOCK_DOMAIN: "destructive",
  ALLOW_DOMAIN: "success",
  REMOVE_DOMAIN_RULE: "secondary",
  BLOCK_USER: "destructive",
  REACTIVATE_USER: "success",
  DELETE_LINK: "destructive",
  UPDATE_URL: "secondary",
  REVOKE_URL: "destructive",
  ACTIVATE_URL: "success",
  DELETE_URL: "destructive",
  UPDATE_USER: "secondary",
  DELETE_USER: "destructive",
  CREATE_SOURCE: "secondary",
  UPDATE_SOURCE: "secondary",
  DELETE_SOURCE: "destructive",
  REFRESH_SOURCE: "secondary",
  RESEND_EMAIL: "secondary",
  CLEAR_LOGIN_ATTEMPTS: "secondary",
  RESERVE_ALIAS: "secondary",
  UNRESERVE_ALIAS: "secondary",
  HIDE_BIO_PAGE: "destructive",
  UNHIDE_BIO_PAGE: "secondary",
  RENAME_BIO_HANDLE: "secondary",
  REVOKE_BIO_HANDLE: "destructive",
  RESOLVE_BIO_REVIEW: "secondary",
  APPROVE_DOMAIN: "success",
  REJECT_DOMAIN: "destructive",
  DISABLE_DOMAIN: "destructive",
  ENABLE_DOMAIN: "success",
  RETRY_DOMAIN: "secondary",
  DELETE_DOMAIN: "destructive",
  SET_DOMAIN_ALLOWANCE: "secondary",
  REMOVE_DOMAIN_ALLOWANCE: "secondary",
  CHANGE_SETTING: "secondary",
  RESET_SETTING: "secondary",
  TURN_OFF_SIGN_IN_METHOD: "destructive",
  TURN_ON_SIGN_IN_METHOD: "success",
  REMOVE_PASSWORD: "destructive",
  ALLOW_CAMPAIGN_SHAPE: "success",
  REPORT_DOMAINS: "secondary",
  UNKNOWN: "outline",
}

const actionOptions = Object.entries(actionLabels) as [AuditAction, string][]

const targetTypeLabels: Record<string, string> = {
  Url: "Link",
  Domain: "Domain",
  User: "User",
  ReservedAlias: "Reserved alias",
  Blocklist: "Blocklist",
  EmailLog: "Email",
  Admin: "Admin action",
  Setting: "Site setting",
  BioPage: "Bio page",
  BioPageReview: "Bio page",
}

const targetTypeLabel = (targetType: string) =>
  targetTypeLabels[targetType] ?? targetType.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase().replace(/^./, (c) => c.toUpperCase())

const titleCased = (action: string) => action.toLowerCase().replace(/_+/g, " ").trim().replace(/^./, (c) => c.toUpperCase())

const actionColor = ({ action, failed }: AuditLog): BadgeVariant =>
  failed ? "destructive" : (actionColors[action] ?? "secondary")

const actionLabel = ({ action, failed }: AuditLog): string => {
  const label = actionLabels[action] ?? titleCased(action)
  return failed ? `${label} (failed)` : label
}

const sortFields = ["performedAt"]

const isCalendarDate = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value)
}

const addressDate = (value: string | null) => (value && /^\d{4}-\d{2}-\d{2}$/.test(value) && isCalendarDate(value) ? value : "")

const dateInputClass = `${adminSelectClass} tabular-nums`

const detailsText = ({ action, details }: AuditLog): string | null =>
  action === "REVOKE_BIO_HANDLE" && details ? details.replace(/(^|, )expectedHandle: /, "$1Handle: ") : details

export default function AdminAuditLogPage() {
  return (
    <Suspense fallback={null}>
      <AdminAuditLog />
    </Suspense>
  )
}

function AdminAuditLog() {
  const { page, size, sort, order, setPage, setSize, toggleSort, sortDir } = usePagination("performedAt", "desc", sortFields)
  const { search, searchInput, setSearchInput, applySearch } = useListSearch(() => setPage(0))
  const [action, setAction] = useState<AuditAction | "">("")
  const [from, setFrom] = useAddressParam("from", addressDate)
  const [to, setTo] = useAddressParam("to", addressDate)
  const filters: AuditLogFilters = { action: action || undefined, search: search || undefined, from: from || undefined, to: to || undefined }
  const filtered = !!action || !!search || !!from || !!to
  const { data, isLoading, error, refetch, isFetching } = useQuery<Page<AuditLog>>({
    queryKey: ["admin", "audit-log", filters, page, size, sort, order],
    queryFn: () => adminApi.getAuditLog(filters, page, size, sort, order),
    placeholderData: keepPreviousData,
  })

  return (
    <div className="space-y-6">
      <PageMeta title="Admin — Audit log" description="Track administrative actions across the system." />
      <div>
        <h1 className="font-display text-2xl">Audit log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track administrative actions across the system</p>
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
            placeholder="Search admin, target or details"
            aria-label="Search the audit log by admin, target or details"
            spellCheck={false}
            autoCapitalize="none"
            className="h-9 pl-9"
          />
        </form>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          Action
          <select
            value={action}
            onChange={(e) => {
              setAction(e.target.value as AuditAction | "")
              setPage(0)
            }}
            className={adminSelectClass}
          >
            <option value="">All actions</option>
            {actionOptions.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          From
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => {
              setFrom(event.target.value)
              setPage(0)
            }}
            className={dateInputClass}
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          To
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => {
              setTo(event.target.value)
              setPage(0)
            }}
            className={dateInputClass}
          />
        </label>
      </div>

      {isLoading ? (
        <div className="space-y-3 rounded-xl border bg-card p-5">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load the audit log</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()} disabled={isFetching}>Retry</Button>
        </div>
      ) : !data || data.content.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">{filtered ? "No entries match" : "No audit log entries"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered ? "Try a different search, action or date range." : "Actions taken by admins will be recorded here."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead field="performedAt" label="Time" sortDir={sortDir} toggleSort={toggleSort} />
                <TableHead className="hidden @2xl:table-cell">Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden @4xl:table-cell">Target type</TableHead>
                <TableHead className="hidden @4xl:table-cell">Target</TableHead>
                <TableHead className="hidden @4xl:table-cell">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.content.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="tabular-nums text-muted-foreground">
                    <DateTimeLines value={entry.performedAt} />
                  </TableCell>
                  <TableCell className="hidden font-medium @2xl:table-cell">
                    <span className="block min-w-32 [overflow-wrap:anywhere]">{entry.performedBy}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={actionColor(entry)}>{actionLabel(entry)}</Badge>
                    <div className="mt-1.5 min-w-40 space-y-0.5 text-xs text-muted-foreground @lg:min-w-56 @4xl:hidden">
                      <p className="font-medium text-foreground [overflow-wrap:anywhere] @2xl:hidden">By {entry.performedBy}</p>
                      <p className="[overflow-wrap:anywhere]">
                        {targetTypeLabel(entry.targetType)}
                        {entry.targetIdentifier && <span className="font-mono text-foreground"> {entry.targetIdentifier}</span>}
                      </p>
                      {entry.details && <p className="[overflow-wrap:anywhere]">{detailsText(entry)}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground @4xl:table-cell">{targetTypeLabel(entry.targetType)}</TableCell>
                  <TableCell className="hidden @4xl:table-cell">
                    <span className="block min-w-28 font-mono text-[13px] [overflow-wrap:anywhere]">{entry.targetIdentifier || "—"}</span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground @4xl:table-cell">
                    <span className="block min-w-40 [overflow-wrap:anywhere]">{detailsText(entry) || "—"}</span>
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
