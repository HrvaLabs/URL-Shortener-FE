import { cache } from "react"
import { handleFormatError, normalizeHandle } from "./bio"
import type { PublicBioPage } from "./types"
import { getServerApiBaseUrl } from "./utils"

export const loadPublicBioPage = cache(async (handle: string): Promise<PublicBioPage | null> => {
  const normalized = normalizeHandle(handle)
  if (handleFormatError(normalized)) return null
  const response = await fetch(`${getServerApiBaseUrl()}/public/bio-pages/${normalized}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  })
  if (response.status === 404) return null
  if (!response.ok) throw new Error("Bio page failed to load: " + response.status)
  return (await response.json()) as PublicBioPage
})
