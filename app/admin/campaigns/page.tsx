"use client"

import { Suspense, useRef, type FormEvent } from "react"
import { Search } from "lucide-react"
import { PageMeta } from "@/components/page-meta"
import { CampaignRow } from "@/components/admin/campaigns/campaign-row"
import { campaignLinkParams } from "@/components/admin/campaigns/campaign-details"
import { SortSelect, type SortOption } from "@/components/admin/sort-controls"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Skeleton } from "@/components/ui/skeleton"
import { useAddressParam } from "@/lib/hooks/useAddressParam"
import { useCampaigns } from "@/lib/hooks/useCampaigns"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import { useListSearch } from "@/lib/hooks/useListSearch"
import { useClampedPage, usePagination } from "@/lib/hooks/usePagination"
import { useAdminSettings } from "@/lib/hooks/useSettings"
import { campaignRuleText, holdOffReason } from "@/lib/moderation"

const DEFAULT_SORT = "lastSeenAt"

const sortFields = ["lastSeenAt", "firstSeenAt", "status"]

const sortOptions: SortOption[] = [
  { field: "lastSeenAt", direction: "desc", label: "Last seen, newest first" },
  { field: "lastSeenAt", direction: "asc", label: "Last seen, oldest first" },
  { field: "firstSeenAt", direction: "desc", label: "First seen, newest first" },
  { field: "firstSeenAt", direction: "asc", label: "First seen, oldest first" },
  { field: "status", direction: "asc", label: "Status, A to Z" },
  { field: "status", direction: "desc", label: "Status, Z to A" },
]

const addressCampaign = (value: string | null) => (value && /^\d+$/.test(value) ? value : "")

const clearLinkParams = () => {
  const params = new URLSearchParams(window.location.search)
  for (const name of campaignLinkParams) params.delete(name)
  const query = params.toString()
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`)
}

export default function AdminCampaignsPage() {
  return (
    <Suspense fallback={<CampaignsLoading />}>
      <Campaigns />
    </Suspense>
  )
}

function CampaignsLoading() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  )
}

function Campaigns() {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const { page, size, sort, order, setPage, setSize, setSortOrder } = usePagination(DEFAULT_SORT, "desc", sortFields)
  const { search, searchInput, setSearchInput, applySearch } = useListSearch(() => setPage(0))
  const [openId, setOpenId] = useAddressParam<string>("campaign", addressCampaign)
  const { data, isLoading, error, refetch, isFetching } = useCampaigns(page, size, sort, order, search)
  useClampedPage(page, data?.totalPages, setPage)
  const campaigns = data?.content ?? []
  const retry = useFocusAfterRetry(headingRef, !!data && !error && !isFetching)
  const { data: settings } = useAdminSettings()
  const ruleText = campaignRuleText(settings)

  const toggle = (id: number) => {
    clearLinkParams()
    setOpenId(openId === String(id) ? "" : String(id))
  }

  return (
    <div className="space-y-6">
      <PageMeta title={`Admin ${String.fromCodePoint(0x2014)} Campaigns`} description="URL shapes shared by links made without an account, with their links and domains." />
      <div>
        <h1 ref={headingRef} tabIndex={-1} className="rounded-sm font-display text-2xl">Campaigns</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          When links made without an account share one URL shape across several domains, they show up here. While a campaign is holding, new links with its shape are saved turned off. Signed-in users&apos; links are never held.
        </p>
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
            placeholder="Search path or query name"
            aria-label="Search campaigns by path or query name"
            spellCheck={false}
            autoCapitalize="none"
            className="h-9 pl-9"
          />
        </form>
        <SortSelect options={sortOptions} sort={sort} order={order} onChange={setSortOrder} />
      </div>

      {isLoading ? (
        <CampaignsLoading />
      ) : error && !data ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load the campaigns</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            onClick={() => { if (!isFetching) retry(refetch) }}
            aria-disabled={isFetching}
          >
            Retry
          </Button>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-xl border bg-card px-6 py-16 text-center">
          <p className="font-semibold">{search ? "No campaigns match" : "No campaigns in the last 90 days."}</p>
          {search ? (
            <p className="mt-1 text-sm text-muted-foreground">Try a different search.</p>
          ) : (
            ruleText && <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{ruleText}</p>
          )}
        </div>
      ) : (
        <>
          {error && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p role="alert" className="min-w-0 text-sm font-medium text-destructive [overflow-wrap:anywhere]">
                {"Couldn't refresh the campaigns. The list may be out of date."}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
                onClick={() => { if (!isFetching) retry(refetch) }}
                aria-disabled={isFetching}
              >
                Retry
              </Button>
            </div>
          )}
          <ul className="space-y-3">
            {campaigns.map((campaign) => (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                expanded={openId === String(campaign.id)}
                onToggle={() => toggle(campaign.id)}
                fallbackFocusRef={headingRef}
                holdOffReason={holdOffReason(settings)}
              />
            ))}
          </ul>
          <div className="overflow-hidden rounded-xl border bg-card">
            <Pagination
              page={page}
              totalPages={data?.totalPages ?? 0}
              totalElements={data?.totalElements}
              size={size}
              onPageChange={setPage}
              onSizeChange={setSize}
              label="campaigns"
            />
          </div>
        </>
      )}
    </div>
  )
}
