"use client"

import { useEffect, useState } from "react"

const readParam = (name: string) => (typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get(name))

export function useAddressParam<T extends string>(name: string, parse: (value: string | null) => T) {
  const [value, setValue] = useState<T>(() => parse(readParam(name)))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (value === parse(null)) params.delete(name)
    else params.set(name, value)
    const query = params.toString()
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`)
  }, [name, value, parse])

  return [value, setValue] as const
}
