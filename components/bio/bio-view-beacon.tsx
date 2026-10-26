"use client"

import { useEffect, useRef } from "react"
import { getApiBaseUrl } from "@/lib/utils"

export function BioViewBeacon({ handle }: { handle: string }) {
  const sentForHandle = useRef<string | null>(null)

  useEffect(() => {
    if (sentForHandle.current === handle) return
    sentForHandle.current = handle
    fetch(`${getApiBaseUrl()}/public/bio-pages/${encodeURIComponent(handle)}/views`, {
      method: "POST",
      keepalive: true,
      credentials: "omit",
    }).catch(() => undefined)
  }, [handle])

  return null
}
