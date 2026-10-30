"use client"

import { useState, useCallback, useEffect } from "react"

const DEFAULT_SIZE = 20

export function useClampedPage(page: number, totalPages: number | undefined, setPage: (page: number) => void) {
  useEffect(() => {
    if (totalPages != null && totalPages > 0 && page >= totalPages) setPage(totalPages - 1)
  }, [page, totalPages, setPage])
}

const addressParam = (name: string) => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(name))

const knownSort = (sort: string | null, sortFields: readonly string[] | undefined) => sort != null && (sortFields == null || sortFields.includes(sort))

export function usePagination(defaultSort = "createDate", defaultOrder: "asc" | "desc" = "desc", sortFields?: readonly string[]) {
  const [page, setPageState] = useState(() => Math.max(0, parseInt(addressParam("page") ?? "0", 10) || 0))
  const [size, setSizeState] = useState(() => parseInt(addressParam("size") ?? String(DEFAULT_SIZE), 10) || DEFAULT_SIZE)
  const [sort, setSortState] = useState(() => {
    const addressSort = addressParam("sort")
    return knownSort(addressSort, sortFields) ? (addressSort as string) : defaultSort
  })
  const [order, setOrderState] = useState<"asc" | "desc">(() => {
    const addressOrder = addressParam("order")
    if (!knownSort(addressParam("sort"), sortFields)) return defaultOrder
    return addressOrder === "asc" || addressOrder === "desc" ? addressOrder : defaultOrder
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set("page", String(page))
    params.set("size", String(size))
    if (sort) {
      params.set("sort", sort)
      params.set("order", order)
    } else {
      params.delete("sort")
      params.delete("order")
    }
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}${window.location.hash}`)
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

  const setSortOrder = useCallback((field: string, direction: "asc" | "desc") => {
    setSortState(field)
    setOrderState(direction)
    setPageState(0)
  }, [])

  const sortDir = useCallback(
    (field: string) => (sort === field ? order : null),
    [sort, order],
  )

  return { page, size, sort, order, setPage, setSize, toggleSort, setSortOrder, sortDir }
}
