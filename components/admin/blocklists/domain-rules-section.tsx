"use client"

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react"
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SortHead, SortSelect, type SortOption } from "@/components/admin/sort-controls"
import { adminApi } from "@/lib/api-client"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import type { DomainRule, DomainRuleCreated, DomainRuleType, Page } from "@/lib/types"
import { parseServerDateTime } from "@/lib/analytics"
import { focusTargetAfterRemoving, formatDateTime, formatTimeAgo, plural } from "@/lib/utils"
import { ruleTypeLabels } from "./labels"

const ruleTypes: DomainRuleType[] = ["BLOCK", "ALLOW"]

const SEARCH_DELAY_MS = 300

const DEFAULT_SORT = "createdAt"

const sortFields = ["domain", "createdAt"]

const sortOptions: SortOption[] = [
  { field: "createdAt", direction: "desc", label: "Newest first" },
  { field: "createdAt", direction: "asc", label: "Oldest first" },
  { field: "domain", direction: "asc", label: "Domain, A to Z" },
  { field: "domain", direction: "desc", label: "Domain, Z to A" },
]

const hints: Record<DomainRuleType, string> = {
  BLOCK: "A rule covers the domain and its subdomains. Adding one blocks every active link on it.",
  ALLOW: "A rule covers the domain and its subdomains. Trusted domains skip the lists and heuristics, but not Safe Browsing.",
}

const emptyTitles: Record<DomainRuleType, string> = {
  BLOCK: "No blocked domains",
  ALLOW: "No trusted domains",
}

const createdMessage = (type: DomainRuleType, { rule, linksAffected }: DomainRuleCreated) => {
  if (type === "BLOCK") return linksAffected > 0 ? `Blocked ${plural(linksAffected, "link")} on ${rule.domain}` : `Blocked ${rule.domain}. No active links used it.`
  return linksAffected > 0 ? `Trusted ${rule.domain} and restored ${plural(linksAffected, "link")}` : `Trusted ${rule.domain}`
}

const schemePrefix = /^[a-z][a-z0-9+.-]*:\/\//

const normalizeDomain = (input: string) => {
  const value = input.trim().toLowerCase()
  try {
    return new URL(schemePrefix.test(value) ? value : `http://${value}`).hostname.replace(/\.$/, "")
  } catch {
    return value.replace(schemePrefix, "").replace(/[/?#].*$/, "").replace(/\.$/, "")
  }
}

interface RulesListState {
  page: number
  size: number
  sort: string
  order: "asc" | "desc"
  search: string
  searchInput: string
  setPage(page: number): void
  setSize(size: number): void
  toggleSort(field: string): void
  setSortOrder(field: string, direction: "asc" | "desc"): void
  setSearchInput(value: string): void
  applySearch(value: string): void
}

export function DomainRulesSection() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const pagination = usePagination(DEFAULT_SORT)
  const { setPage } = pagination
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  const applySearch = (value: string) => {
    const next = value.trim()
    if (next === search) return
    setSearch(next)
    setPage(0)
  }

  useEffect(() => {
    const next = searchInput.trim()
    if (next === search) return
    const timer = window.setTimeout(() => {
      setSearch(next)
      setPage(0)
    }, SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput, search, setPage])

  const list: RulesListState = {
    page: pagination.page,
    size: pagination.size,
    sort: sortFields.includes(pagination.sort) ? pagination.sort : DEFAULT_SORT,
    order: pagination.order === "asc" ? "asc" : "desc",
    search,
    searchInput,
    setPage,
    setSize: pagination.setSize,
    toggleSort: pagination.toggleSort,
    setSortOrder: pagination.setSortOrder,
    setSearchInput,
    applySearch,
  }

  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <Tabs defaultValue="BLOCK" onValueChange={() => setPage(0)}>
        <div className="flex min-h-13 flex-wrap items-center justify-between gap-3 border-b px-5 py-2.5">
          <h2 ref={headingRef} tabIndex={-1} className="rounded-sm text-sm font-semibold">Domain rules</h2>
          <TabsList>
            {ruleTypes.map((type) => (
              <TabsTrigger key={type} value={type}>{ruleTypeLabels[type]}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        {ruleTypes.map((type) => (
          <TabsContent key={type} value={type} className="mt-0">
            <DomainRulesPanel type={type} list={list} fallbackFocusRef={headingRef} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

function DomainRulesPanel({ type, list, fallbackFocusRef }: { type: DomainRuleType; list: RulesListState; fallbackFocusRef: RefObject<HTMLElement | null> }) {
  const queryClient = useQueryClient()
  const { page, size, sort, order, search, setPage } = list
  const { data, isLoading, error, refetch } = useQuery<Page<DomainRule>>({
    queryKey: ["admin", "domain-rules", type, page, size, sort, order, search],
    queryFn: () => adminApi.getDomainRules(type, page, size, sort, order, search || undefined),
    placeholderData: keepPreviousData,
  })
  useClampedPage(page, data?.totalPages, setPage)
  const rules = data?.content ?? []
  const sortDir = (field: string) => (field === sort ? order : null)
  const [domain, setDomain] = useState("")
  const [reason, setReason] = useState("")

  const addRule = useMutation({
    mutationFn: () => adminApi.createDomainRule({ domain: normalizeDomain(domain), type, reason: reason.trim() || undefined }),
    onSuccess: (created) => {
      toast.success(createdMessage(type, created))
      setDomain("")
      setReason("")
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add domain rule"),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "domain-rules", type] })
      queryClient.invalidateQueries({ queryKey: ["admin", "review"] })
    },
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!normalizeDomain(domain)) {
      toast.error("Domain is required")
      return
    }
    addRule.mutate()
  }

  return (
    <>
      <div className="border-b p-5">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 @2xl:flex-row">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            aria-label="Domain"
            spellCheck={false}
            autoCapitalize="none"
            className="h-9 font-mono text-[13px] @2xl:max-w-xs"
          />
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            aria-label="Reason"
            className="h-9 @2xl:flex-1"
          />
          <Button type="submit" size="sm" disabled={addRule.isPending || !domain.trim()}>
            {addRule.isPending ? "Adding..." : "Add"}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">{hints[type]}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
        <form
          role="search"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault()
            list.applySearch(list.searchInput)
          }}
          className="relative w-full sm:max-w-sm"
        >
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={list.searchInput}
            onChange={(event) => list.setSearchInput(event.target.value)}
            placeholder="Search by domain or reason"
            aria-label="Search domain rules by domain or reason"
            spellCheck={false}
            autoCapitalize="none"
            className="h-9 pl-9"
          />
        </form>
        <SortSelect options={sortOptions} sort={sort} order={order} onChange={list.setSortOrder} className="@4xl:hidden" />
      </div>

      {isLoading ? (
        <div className="space-y-3 p-5">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load domain rules</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>Retry</Button>
        </div>
      ) : rules.length === 0 ? (
        <div className="px-6 py-12 text-center">
          {search ? (
            <>
              <p className="font-semibold">No rules match</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search.</p>
            </>
          ) : (
            <>
              <p className="font-semibold">{emptyTitles[type]}</p>
              <p className="mt-1 text-sm text-muted-foreground">Add a domain above to create the first rule.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHead field="domain" label="Domain" sortDir={sortDir} toggleSort={list.toggleSort} />
                <TableHead className="hidden @4xl:table-cell">Reason</TableHead>
                <TableHead className="hidden @4xl:table-cell">Added by</TableHead>
                <SortHead field="createdAt" label="Added" sortDir={sortDir} toggleSort={list.toggleSort} className="hidden @4xl:table-cell" />
                <TableHead className="text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <DomainRuleRow key={rule.id} rule={rule} fallbackFocusRef={fallbackFocusRef} />
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={list.setSize}
          />
        </>
      )}
    </>
  )
}

function DomainRuleRow({ rule, fallbackFocusRef }: { rule: DomainRule; fallbackFocusRef: RefObject<HTMLElement | null> }) {
  const queryClient = useQueryClient()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const focusAfterClose = useRef<HTMLElement | null>(null)
  const remove = useMutation({
    mutationFn: () => adminApi.deleteDomainRule(rule.id),
    onSuccess: () => toast.success(`Removed ${rule.domain}`),
    onError: (err: Error) => toast.error(err.message || "Failed to remove domain rule"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "domain-rules", rule.type] }),
  })
  const ruleName = rule.type === "BLOCK" ? "block" : "trust"
  const createdAt = parseServerDateTime(rule.createdAt)

  const startRemoving = () => {
    focusAfterClose.current = focusTargetAfterRemoving(triggerRef.current, fallbackFocusRef.current)
    remove.mutate()
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
    <TableRow>
      <TableCell>
        <span className="block min-w-40 font-mono text-[13px] [overflow-wrap:anywhere]">{rule.domain}</span>
        <div className="mt-0.5 min-w-40 space-y-0.5 text-xs text-muted-foreground @4xl:hidden">
          {rule.reason && <p className="[overflow-wrap:anywhere]">{rule.reason}</p>}
          <p className="tabular-nums [overflow-wrap:anywhere]">
            Added {formatTimeAgo(createdAt)} ({formatDateTime(createdAt)}){rule.createdBy && ` by ${rule.createdBy}`}
          </p>
        </div>
      </TableCell>
      <TableCell className="hidden text-muted-foreground @4xl:table-cell">
        <span className="block min-w-48 [overflow-wrap:anywhere]">{rule.reason || "—"}</span>
      </TableCell>
      <TableCell className="hidden text-muted-foreground @4xl:table-cell">
        <span className="block min-w-36 [overflow-wrap:anywhere]">{rule.createdBy || "—"}</span>
      </TableCell>
      <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground @4xl:table-cell">
        <span className="block">{formatTimeAgo(createdAt)}</span>
        <span className="block text-xs">{formatDateTime(createdAt)}</span>
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <button
                  ref={triggerRef}
                  data-remove-row
                  aria-label={`Remove ${rule.domain}`}
                  disabled={remove.isPending}
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
              <AlertDialogTitle className="break-all">Remove {rule.domain}?</AlertDialogTitle>
              <AlertDialogDescription>This removes the {ruleName} rule for {rule.domain} and its subdomains.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={startRemoving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  )
}
