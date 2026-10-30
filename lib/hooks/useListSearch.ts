"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export const SEARCH_DELAY_MS = 300

const addressParam = (name: string) => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(name))

export function useListSearch(onSearch?: () => void, param = "search") {
  const [searchInput, setSearchInput] = useState(() => addressParam(param) ?? "")
  const [search, setSearch] = useState(() => (addressParam(param) ?? "").trim())
  const searchRef = useRef(search)
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

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
