"use client"

import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { errorText } from "@/components/bio/handle-field"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BIO_LIMITS, destinationHostOf } from "@/lib/bio"
import { useMyUrls } from "@/lib/hooks/useUrls"
import type { UrlFilters, UrlResponse } from "@/lib/types"

const PAGE_SIZE = 10

const SEARCH_DELAY_MS = 300

const ADD_SELECTOR = "[data-pick-link]"

const DISABLED_CLASSES = "aria-disabled:pointer-events-none aria-disabled:opacity-50"

const pickerFilters = (search: string): UrlFilters => ({ search: search || undefined, active: true })

export const ignoreKeyRepeat = (event: KeyboardEvent<HTMLElement>) => {
  if (event.repeat) event.preventDefault()
}

type PickProps = {
  exclude: ReadonlySet<number>
  full: boolean
  limitId: string
  onAdd: (url: UrlResponse, event: MouseEvent<HTMLButtonElement>) => void
}

function PickerPage({ page, search, exclude, full, limitId, onAdd }: PickProps & { page: number; search: string }) {
  const query = useMyUrls(pickerFilters(search), page, PAGE_SIZE)
  if (!query.data) return null
  return query.data.content
    .filter((url) => !exclude.has(url.id))
    .map((url) => {
      const host = destinationHostOf(url.longUrl)
      return (
        <li key={url.id} className="flex items-start justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="font-mono text-[13px] font-medium text-brand [overflow-wrap:anywhere]">/{url.shortUrl}</p>
            {host && <p className="mt-0.5 text-xs text-muted-foreground [overflow-wrap:anywhere]">{host}</p>}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-pick-link=""
            data-page={page}
            aria-label={`Add /${url.shortUrl}`}
            aria-disabled={full || undefined}
            aria-describedby={full ? limitId : undefined}
            onClick={(event) => onAdd(url, event)}
            onKeyDown={ignoreKeyRepeat}
            className={`shrink-0 ${DISABLED_CLASSES}`}
          >
            Add
          </Button>
        </li>
      )
    })
}

function NoLinksYet() {
  return (
    <p className="py-3 text-sm text-muted-foreground">
      You have no active short links yet. Shorten a link on the{" "}
      <Link href="/dashboard" className="text-brand-link">URLs page</Link> first.
    </p>
  )
}

function PickerBody({
  exclude,
  full,
  limitText,
  onPick,
}: {
  exclude: ReadonlySet<number>
  full: boolean
  limitText: string
  onPick: (url: UrlResponse) => string | null
}) {
  const searchId = useId()
  const limitId = useId()
  const [input, setInput] = useState("")
  const [search, setSearch] = useState("")
  const [paging, setPaging] = useState({ search: "", count: 1 })
  const [announcement, setAnnouncement] = useState({ text: "", id: 0 })
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const focusAfterPick = useRef<HTMLElement | null>(null)
  const focusPageAfterLoad = useRef<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setSearch(input.trim()), SEARCH_DELAY_MS)
    return () => clearTimeout(timer)
  }, [input])

  const count = paging.search === search ? paging.count : 1
  const filters = pickerFilters(search)
  const first = useMyUrls(filters, 0, PAGE_SIZE)
  const lastPage = useMyUrls(filters, count - 1, PAGE_SIZE)

  useLayoutEffect(() => {
    const picked = focusAfterPick.current
    if (picked) {
      focusAfterPick.current = null
      ;(picked.isConnected ? picked : searchRef.current)?.focus()
    }
    const loadedPage = focusPageAfterLoad.current
    if (loadedPage === null || lastPage.isPending) return
    focusPageAfterLoad.current = null
    const firstNew = listRef.current?.querySelector<HTMLElement>(`${ADD_SELECTOR}[data-page="${loadedPage}"]`)
    const active = document.activeElement
    const focusLost = !active || active === document.body || !active.isConnected
    ;(firstNew ?? (focusLost ? searchRef.current : null))?.focus()
  })

  const add = (url: UrlResponse, event: MouseEvent<HTMLButtonElement>) => {
    if (event.detail > 1 || full) return
    const addButtons = Array.from(listRef.current?.querySelectorAll<HTMLElement>(ADD_SELECTOR) ?? [])
    const at = addButtons.indexOf(event.currentTarget)
    const neighbour = addButtons[at + 1] ?? addButtons[at - 1] ?? null
    const label = onPick(url)
    if (label === null) return
    focusAfterPick.current = neighbour ?? searchRef.current
    const nowFull = exclude.size + 1 >= BIO_LIMITS.buttons
    setAnnouncement((current) => ({ text: nowFull ? `Added ${label}. ${limitText}` : `Added ${label}`, id: current.id + 1 }))
  }

  const loadMore = () => {
    if (lastPage.isPending) return
    focusPageAfterLoad.current = count
    setPaging({ search, count: count + 1 })
  }

  const loadingMore = count > 1 && lastPage.isPending

  let listState: ReactNode = null
  if (first.isPending) listState = <p role="status" className="py-3 text-sm text-muted-foreground">Loading your links…</p>
  else if (first.isError) listState = <LoadError error={first.error} onRetry={() => void first.refetch()} />
  else if (first.data.totalElements === 0) listState = search ? <p className="py-3 text-sm text-muted-foreground">No active links match.</p> : <NoLinksYet />

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div>
        <Label htmlFor={searchId} className="sr-only">Search your links</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={searchRef}
            id={searchId}
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Search your links"
            autoComplete="off"
            className="pl-9"
          />
        </div>
      </div>
      {full && <p id={limitId} className="text-sm text-muted-foreground">{limitText}</p>}
      <div className="-mx-6 min-h-0 overflow-y-auto px-6">
        {listState ?? (
          <>
            <ul ref={listRef} className="peer divide-y empty:hidden">
              {Array.from({ length: count }, (_, page) => (
                <PickerPage key={page} page={page} search={search} exclude={exclude} full={full} limitId={limitId} onAdd={add} />
              ))}
            </ul>
            {lastPage.isError ? (
              <LoadError error={lastPage.error} onRetry={() => void lastPage.refetch()} />
            ) : loadingMore || (lastPage.data !== undefined && count < lastPage.data.totalPages) ? (
              <div className="pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={loadMore}
                  aria-disabled={loadingMore || undefined}
                  aria-busy={loadingMore || undefined}
                  className={DISABLED_CLASSES}
                >
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            ) : (
              <p className="hidden py-3 text-sm text-muted-foreground peer-empty:block">No active links match.</p>
            )}
          </>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        <span key={announcement.id}>{announcement.text}</span>
      </p>
    </div>
  )
}

function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <p className="text-sm text-destructive [overflow-wrap:anywhere]">{errorText(error)}</p>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        Retry
      </Button>
    </div>
  )
}

export function LinkPickerDialog({
  open,
  onOpenChange,
  exclude,
  full,
  limitText,
  onPick,
  onCloseAutoFocus,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  exclude: ReadonlySet<number>
  full: boolean
  limitText: string
  onPick: (url: UrlResponse) => string | null
  onCloseAutoFocus?: (event: Event) => void
  children: ReactNode
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent aria-describedby={undefined} onCloseAutoFocus={onCloseAutoFocus} className="flex max-h-[calc(100dvh-2rem)] flex-col">
        <DialogHeader>
          <DialogTitle className="pr-6">Add from my links</DialogTitle>
        </DialogHeader>
        <PickerBody exclude={exclude} full={full} limitText={limitText} onPick={onPick} />
      </DialogContent>
    </Dialog>
  )
}
