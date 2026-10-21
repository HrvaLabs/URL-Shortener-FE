"use client"

import { useState, useCallback, useEffect } from "react"

const DEFAULT_SIZE = 20

export function useClampedPage(page: number, totalPages: number | undefined, setPage: (page: number) => void) {
  useEffect(() => {
    if (totalPages != null && totalPages > 0 && page >= totalPages) setPage(totalPages - 1)
  }, [page, totalPages, setPage])
}

export function usePagination() {
  const [page, setPageState] = useState(0)
  const [size, setSizeState] = useState(DEFAULT_SIZE)
  const [sort, setSortState] = useState("createDate")
  const [order, setOrderState] = useState("desc")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setPageState(Math.max(0, parseInt(params.get("page") ?? "0", 10) || 0))
    setSizeState(parseInt(params.get("size") ?? String(DEFAULT_SIZE), 10) || DEFAULT_SIZE)
    setSortState(params.get("sort") ?? "createDate")
    setOrderState(params.get("order") ?? "desc")
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set("page", String(page))
    params.set("size", String(size))
    params.set("sort", sort)
    params.set("order", order)
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`)
  }, [page, size, sort, order])

  const setPage = useCallback((p: number) => {
    setPageState(Math.max(0, p))
  }, [])

  const setSize = useCallback((s: number) => {
    setSizeState(s)
    setPageState(0)
  }, [])

  const toggleSort = useCallback(
    (field: string) => {
      const newOrder = sort === field && order === "asc" ? "desc" : "asc"
      setSortState(field)
      setOrderState(newOrder)
      setPageState(0)
    },
    [sort, order],
  )

  const sortDir = useCallback(
    (field: string) => (sort === field ? order : null),
    [sort, order],
  )

  return { page, size, sort, order, setPage, setSize, toggleSort, sortDir }
}
