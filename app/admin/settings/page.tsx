"use client"

import { Suspense, useRef, type FormEvent, type RefObject } from "react"
import { Search } from "lucide-react"
import { PageMeta } from "@/components/page-meta"
import { SafetySwitchesOff } from "@/components/admin/settings/safety-switches-off"
import { SettingRow } from "@/components/admin/settings/setting-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useFocusAfterRetry } from "@/lib/hooks/useFocusAfterRetry"
import { useListSearch } from "@/lib/hooks/useListSearch"
import { useAdminSettings } from "@/lib/hooks/useSettings"
import { SETTING_GROUP_LABELS, groupSettings } from "@/lib/moderation"

const subline = "Turn features and checks on or off and set limits and alert thresholds. Every change goes in the audit log."

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <Settings />
    </Suspense>
  )
}

function SettingsLoading() {
  return (
    <div className="space-y-6">
      <PageTitle />
      <SettingsSkeleton />
    </div>
  )
}

function PageTitle({ headingRef }: { headingRef?: RefObject<HTMLHeadingElement | null> }) {
  return (
    <div>
      <h1 ref={headingRef} tabIndex={-1} className="font-display text-2xl focus-visible:ring-0 focus-visible:ring-offset-0">
        Site settings
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">{subline}</p>
    </div>
  )
}

function SettingsSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      {[...Array(3)].map((_, group) => (
        <div key={group} className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-5 py-3">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="space-y-4 p-5">
            {[...Array(3)].map((_, row) => (
              <Skeleton key={row} className="h-12 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Settings() {
  const { search, searchInput, setSearchInput, applySearch } = useListSearch()
  const { data, error, isLoading, isFetching, refetch } = useAdminSettings()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const retry = useFocusAfterRetry(headingRef, !!data && !error)
  const groups = groupSettings(data ?? [], search)

  return (
    <div className="space-y-6">
      <PageMeta title={`Admin ${String.fromCodePoint(0x2014)} Site settings`} description={subline} />
      <PageTitle headingRef={headingRef} />
      <SafetySwitchesOff />

      {isLoading ? (
        <SettingsSkeleton />
      ) : !data ? (
        <div className="rounded-xl border bg-card px-6 py-12 text-center">
          <p role="alert" className="text-sm font-medium text-destructive">Failed to load settings</p>
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
      ) : (
        <>
          {error && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
              <p role="alert" className="min-w-0 text-sm font-medium text-destructive [overflow-wrap:anywhere]">
                {"Couldn't refresh the settings. The list may be out of date."}
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
              placeholder="Search settings"
              aria-label="Search settings by name or description"
              spellCheck={false}
              autoCapitalize="none"
              className="h-9 pl-9"
            />
          </form>

          {groups.length === 0 ? (
            <div className="rounded-xl border bg-card px-6 py-16 text-center">
              <p className="font-semibold">No settings match</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a different search.</p>
            </div>
          ) : (
            groups.map(({ group, rows }) => (
              <section key={group} aria-labelledby={`settings-${group}`} className="overflow-hidden rounded-xl border bg-card">
                <h2 id={`settings-${group}`} className="border-b px-5 py-3 text-sm font-semibold">
                  {SETTING_GROUP_LABELS[group]}
                </h2>
                <ul className="divide-y px-5">
                  {rows.map(({ setting, indented, offParent }) => (
                    <SettingRow key={setting.key} setting={setting} indented={indented} offParent={offParent} />
                  ))}
                </ul>
              </section>
            ))
          )}
        </>
      )}
    </div>
  )
}
