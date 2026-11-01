export const STATIC_PATH_PREFIX = "/_next/static/"
export const STALE_CHUNK_RELOAD_KEY = "hrva:stale-chunk-reload"
export const STALE_CHUNK_RELOAD_WINDOW_MS = 30_000

const CHUNK_LOAD_ERROR = "ChunkLoadError"
const FAILED_IMPORT_MESSAGE =
  /Loading CSS chunk|Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i
const URL_IN_MESSAGE = /(https?:\/\/[^\s"'`)]+|\/_next\/[^\s"'`)]+)/g
const MOST_CAUSES = 5

export const isOwnStaticUrl = (url: string | null | undefined, origin: string): boolean => {
  if (!url) return false
  try {
    const parsed = new URL(url, origin)
    return parsed.origin === origin && parsed.pathname.startsWith(STATIC_PATH_PREFIX)
  } catch {
    return false
  }
}

const isStaleChunkErrorItself = (error: unknown, origin: string): boolean => {
  if (typeof error !== "object" || error === null) return false
  const name = "name" in error ? String(error.name) : ""
  const message = "message" in error ? String(error.message) : ""
  const urls = message.match(URL_IN_MESSAGE) ?? []
  const namesOwnChunk = urls.some((url) => isOwnStaticUrl(url, origin))
  if (name === CHUNK_LOAD_ERROR) return urls.length === 0 || namesOwnChunk
  return FAILED_IMPORT_MESSAGE.test(message) && namesOwnChunk
}

export const isStaleChunkError = (error: unknown, origin: string): boolean => {
  let current = error
  for (let depth = 0; current && depth < MOST_CAUSES; depth++) {
    if (isStaleChunkErrorItself(current, origin)) return true
    current = typeof current === "object" && "cause" in current ? current.cause : undefined
  }
  return false
}

export interface ChunkElement {
  tagName: string
  src?: string
  href?: string
  rel?: string
}

export const isStaleChunkElement = (element: ChunkElement | null | undefined, origin: string): boolean => {
  if (!element) return false
  const tag = element.tagName.toUpperCase()
  if (tag === "SCRIPT") return isOwnStaticUrl(element.src, origin)
  if (tag === "LINK") return (element.rel ?? "").split(/\s+/).includes("stylesheet") && isOwnStaticUrl(element.href, origin)
  return false
}

export const reloadMarker = (path: string, now: number): string => JSON.stringify({ path, at: now })

export const reloadedRecently = (stored: string | null, path: string, now: number): boolean => {
  if (!stored) return false
  try {
    const marker: unknown = JSON.parse(stored)
    if (typeof marker !== "object" || marker === null || !("path" in marker) || !("at" in marker)) return false
    const at = Number(marker.at)
    return marker.path === path && Number.isFinite(at) && now - at >= 0 && now - at < STALE_CHUNK_RELOAD_WINDOW_MS
  } catch {
    return false
  }
}

export interface ReloadOnce {
  storage: () => Pick<Storage, "getItem" | "setItem">
  path: string
  now: number
  online: boolean
  reload: () => void
}

export const reloadOnce = ({ storage, path, now, online, reload }: ReloadOnce): boolean => {
  if (!online) return false
  try {
    const store = storage()
    if (reloadedRecently(store.getItem(STALE_CHUNK_RELOAD_KEY), path, now)) return false
    const marker = reloadMarker(path, now)
    store.setItem(STALE_CHUNK_RELOAD_KEY, marker)
    if (store.getItem(STALE_CHUNK_RELOAD_KEY) !== marker) return false
  } catch {
    return false
  }
  reload()
  return true
}

export const reloadForStaleChunk = (): boolean =>
  reloadOnce({
    storage: () => window.sessionStorage,
    path: window.location.pathname,
    now: Date.now(),
    online: navigator.onLine !== false,
    reload: () => window.location.reload(),
  })

export const reloadIfStaleChunkError = (error: unknown): boolean =>
  isStaleChunkError(error, window.location.origin) && reloadForStaleChunk()
