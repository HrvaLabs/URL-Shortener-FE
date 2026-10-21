"use client"

import { useState, type FormEvent } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { adminApi } from "@/lib/api-client"
import type { DomainRule, DomainRuleCreated, DomainRuleType } from "@/lib/types"
import { formatDateTime, formatTimeAgo } from "@/lib/utils"
import { ruleTypeLabels } from "./labels"

const ruleTypes: DomainRuleType[] = ["BLOCK", "ALLOW"]

const hints: Record<DomainRuleType, string> = {
  BLOCK: "A rule covers the domain and its subdomains. Adding one blocks every active link on it.",
  ALLOW: "A rule covers the domain and its subdomains. Trusted domains skip the lists and heuristics, but not Safe Browsing.",
}

const emptyTitles: Record<DomainRuleType, string> = {
  BLOCK: "No blocked domains",
  ALLOW: "No trusted domains",
}

const plural = (count: number, word: string) => `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`

const createdMessage = (type: DomainRuleType, { rule, linksAffected }: DomainRuleCreated) => {
  if (type === "BLOCK") return `Blocked ${plural(linksAffected, "link")} on ${rule.domain}`
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

export function DomainRulesSection() {
  return (
    <section className="overflow-hidden rounded-xl border bg-card">
      <Tabs defaultValue="BLOCK">
        <div className="flex min-h-13 flex-wrap items-center justify-between gap-3 border-b px-5 py-2.5">
          <h2 className="text-sm font-semibold">Domain rules</h2>
          <TabsList>
            {ruleTypes.map((type) => (
              <TabsTrigger key={type} value={type}>{ruleTypeLabels[type]}</TabsTrigger>
            ))}
          </TabsList>
        </div>
        {ruleTypes.map((type) => (
          <TabsContent key={type} value={type} className="mt-0">
            <DomainRulesPanel type={type} />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  )
}

function DomainRulesPanel({ type }: { type: DomainRuleType }) {
  const queryClient = useQueryClient()
  const { data: rules, isLoading, error, refetch } = useQuery<DomainRule[]>({
    queryKey: ["admin", "domain-rules", type],
    queryFn: () => adminApi.getDomainRules(type),
  })
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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            aria-label="Domain"
            spellCheck={false}
            autoCapitalize="none"
            className="h-9 font-mono text-[13px] sm:max-w-xs"
          />
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            aria-label="Reason"
            className="h-9 sm:flex-1"
          />
          <Button type="submit" size="sm" disabled={addRule.isPending || !domain.trim()}>
            {addRule.isPending ? "Adding..." : "Add"}
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">{hints[type]}</p>
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
      ) : !rules || rules.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-semibold">{emptyTitles[type]}</p>
          <p className="mt-1 text-sm text-muted-foreground">Add a domain above to create the first rule.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Domain</TableHead>
              <TableHead className="hidden sm:table-cell">Reason</TableHead>
              <TableHead className="hidden md:table-cell">Added by</TableHead>
              <TableHead className="hidden sm:table-cell">Added</TableHead>
              <TableHead className="text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <DomainRuleRow key={rule.id} rule={rule} />
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}

function DomainRuleRow({ rule }: { rule: DomainRule }) {
  const queryClient = useQueryClient()
  const remove = useMutation({
    mutationFn: () => adminApi.deleteDomainRule(rule.id),
    onSuccess: () => toast.success(`Removed ${rule.domain}`),
    onError: (err: Error) => toast.error(err.message || "Failed to remove domain rule"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin", "domain-rules", rule.type] }),
  })
  const ruleName = rule.type === "BLOCK" ? "block" : "trust"

  return (
    <TableRow>
      <TableCell>
        <span className="block max-w-56 truncate font-mono text-[13px]" title={rule.domain}>{rule.domain}</span>
        {rule.reason && <span className="mt-0.5 block max-w-56 truncate text-xs text-muted-foreground sm:hidden" title={rule.reason}>{rule.reason}</span>}
      </TableCell>
      <TableCell className="hidden max-w-[280px] text-muted-foreground sm:table-cell">
        <span className="block truncate" title={rule.reason || undefined}>{rule.reason || "—"}</span>
      </TableCell>
      <TableCell className="hidden max-w-[220px] text-muted-foreground md:table-cell">
        <span className="block truncate" title={rule.createdBy || undefined}>{rule.createdBy || "—"}</span>
      </TableCell>
      <TableCell className="hidden whitespace-nowrap tabular-nums text-muted-foreground sm:table-cell" title={formatDateTime(rule.createdAt)}>
        {formatTimeAgo(rule.createdAt)}
      </TableCell>
      <TableCell className="text-right">
        <AlertDialog>
          <Tooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <button
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="break-all">Remove {rule.domain}?</AlertDialogTitle>
              <AlertDialogDescription>This removes the {ruleName} rule for {rule.domain} and its subdomains.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => remove.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  )
}
