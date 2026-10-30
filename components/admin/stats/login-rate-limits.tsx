"use client"

import { useState, type FormEvent } from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { SortSelect, type SortOption } from "@/components/admin/sort-controls"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { adminApi } from "@/lib/api-client"
import { useListSearch } from "@/lib/hooks/useListSearch"
import { useClampedPage } from "@/lib/hooks/usePagination"

const DEFAULT_SIZE = 20

const sortOptions: SortOption[] = [
  { field: "attempts", direction: "desc", label: "Most attempts first" },
  { field: "attempts", direction: "asc", label: "Fewest attempts first" },
  { field: "key", direction: "asc", label: "Key, A to Z" },
  { field: "key", direction: "desc", label: "Key, Z to A" },
]

export function LoginRateLimits() {
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(DEFAULT_SIZE)
  const [sort, setSort] = useState("attempts")
  const [order, setOrder] = useState<"asc" | "desc">("desc")
  const { search, searchInput, setSearchInput, applySearch } = useListSearch(() => setPage(0), "loginSearch")
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "login-attempts", search, page, size, sort, order],
    queryFn: () => adminApi.getLoginAttempts(search || undefined, page, size, sort, order),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  })
  useClampedPage(page, data?.totalPages, setPage)
  const entries = data?.content ?? []
  const anyLimits = !!search || entries.length > 0

  const handleClear = async () => {
    try {
      await adminApi.clearLoginAttempts()
      toast.success("Rate limits cleared")
      refetch()
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : "Failed to clear")
    }
  }

  return (
    <section className="rounded-xl border bg-card">
      <div className="flex min-h-13 items-center justify-between gap-4 border-b px-5 py-2.5">
        <h2 className="text-sm font-semibold">Login rate limits</h2>
        {!isLoading && entries.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear} className="h-8">
            Clear all
          </Button>
        )}
      </div>
      {anyLimits && (
        <div className="flex flex-wrap items-center gap-3 border-b px-5 py-3">
          <form
            role="search"
            onSubmit={(event: FormEvent<HTMLFormElement>) => {
              event.preventDefault()
              applySearch(searchInput)
            }}
            className="relative w-full sm:max-w-xs"
          >
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by address or account"
              aria-label="Search login rate limits by address or account"
              spellCheck={false}
              autoCapitalize="none"
              className="h-9 pl-9"
            />
          </form>
          <SortSelect
            options={sortOptions}
            sort={sort}
            order={order}
            onChange={(field, direction) => {
              setSort(field)
              setOrder(direction)
              setPage(0)
            }}
          />
        </div>
      )}
      {isLoading ? (
        <div className="p-5">
          <Skeleton className="h-20 w-full" />
        </div>
      ) : entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">{search ? "No rate limits match." : "No active rate limits."}</p>
      ) : (
        <>
          <ul className="divide-y">
            {entries.map(({ key, attempts }) => (
              <li key={key} className="flex items-center justify-between gap-4 px-5 py-2.5">
                <span className="min-w-0 font-mono text-[13px] [overflow-wrap:anywhere]">{key}</span>
                <Badge
                  variant={attempts >= 10 ? "destructive" : attempts >= 5 ? "warning" : "outline"}
                  className="tabular-nums"
                >
                  {attempts} attempt{attempts !== 1 ? "s" : ""}
                </Badge>
              </li>
            ))}
          </ul>
          <Pagination
            page={page}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements}
            size={size}
            onPageChange={setPage}
            onSizeChange={(next) => {
              setSize(next)
              setPage(0)
            }}
          />
        </>
      )}
    </section>
  )
}
