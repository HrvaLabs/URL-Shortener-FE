"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"

export function useAddressParam<T extends string>(name: string, parse: (value: string | null) => T) {
  const address = parse(useSearchParams().get(name))
  const [value, setValue] = useState<T>(address)
  const [seen, setSeen] = useState<T>(address)

  if (address !== seen) {
    setSeen(address)
    if (address !== value) setValue(address)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (value === parse(null)) params.delete(name)
    else params.set(name, value)
    const query = params.toString()
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`)
  }, [name, value, parse])

  return [value, setValue] as const
}
