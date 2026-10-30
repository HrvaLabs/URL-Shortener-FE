"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"

export const SEARCH_DELAY_MS = 300

export function useListSearch(onSearch?: () => void, param = "search") {
  const address = (useSearchParams().get(param) ?? "").trim()
  const [searchInput, setSearchInput] = useState(address)
  const [search, setSearch] = useState(address)
  const [seen, setSeen] = useState(address)
  const [outsideChanges, setOutsideChanges] = useState(0)
  const searchRef = useRef(search)
  const onSearchRef = useRef(onSearch)

  if (address !== seen) {
    setSeen(address)
    if (address !== search) {
      setSearch(address)
      setSearchInput(address)
      setOutsideChanges((count) => count + 1)
    }
  }

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    searchRef.current = search
  }, [search])

  useEffect(() => {
    if (outsideChanges > 0) onSearchRef.current?.()
  }, [outsideChanges])

  const applySearch = useCallback((value: string) => {
    const next = value.trim()
    if (next === searchRef.current) return
    searchRef.current = next
    setSearch(next)
    onSearchRef.current?.()
  }, [])

  useEffect(() => {
    if (searchInput.trim() === search) return
    const timer = window.setTimeout(() => applySearch(searchInput), SEARCH_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput, search, applySearch])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (search) params.set(param, search)
    else params.delete(param)
    const query = params.toString()
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`)
  }, [param, search])

  return { search, searchInput, setSearchInput, applySearch }
}
