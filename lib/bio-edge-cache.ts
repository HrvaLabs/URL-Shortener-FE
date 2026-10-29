export const BIO_EDGE_CACHE_SECONDS = 300

export const BIO_CACHE_STATUS_HEADER = "X-Bio-Cache"

export const BIO_CACHE_CONTROL = `public, max-age=0, s-maxage=${BIO_EDGE_CACHE_SECONDS}`

const BIO_URL = /^https?:\/\/[^/?#]+\/bio\/[a-z0-9_-]{3,30}(\/opengraph-image)?(?=[?#]|$)/

const ROUTER_HEADERS = ["rsc", "next-router-prefetch", "next-router-state-tree", "next-router-segment-prefetch", "next-action"]

type FetchHandler<Env, Context> = (request: Request, env: Env, context: Context) => Promise<Response>

type EdgeCache = {
  match: (key: string) => Promise<Response | undefined>
  put: (key: string, response: Response) => Promise<void>
}

type WaitUntil = { waitUntil: (promise: Promise<unknown>) => void }

type VersionedEnv = { CF_VERSION_METADATA?: { id?: string } }

export const bioCacheKey = (request: Request, version: string | undefined): string | null => {
  const match = BIO_URL.exec(request.url)
  if (!match || !version || request.method !== "GET") return null
  if (ROUTER_HEADERS.some((header) => request.headers.has(header))) return null
  const url = new URL(request.url)
  if (url.searchParams.has("_rsc")) return null
  const page = match[1] === undefined
  if (page && url.search) return null
  return `${url.origin}${url.pathname}?v=${encodeURIComponent(version)}`
}

export const isStorableBioResponse = (response: Response): boolean =>
  response.status === 200 && !response.headers.has("set-cookie") && response.body !== null

const withCacheStatus = (response: Response, status: "HIT" | "MISS"): Response => {
  const headers = new Headers(response.headers)
  headers.set(BIO_CACHE_STATUS_HEADER, status)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export const shareableBioResponse = (response: Response): Response => {
  const headers = new Headers(response.headers)
  headers.set("Cache-Control", BIO_CACHE_CONTROL)
  headers.set("Vary", "Accept-Encoding")
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

const edgeCache = (): EdgeCache | undefined => (globalThis.caches as unknown as { default?: EdgeCache } | undefined)?.default

export const withBioEdgeCache =
  <Env extends VersionedEnv, Context extends WaitUntil>(handler: FetchHandler<Env, Context>): FetchHandler<Env, Context> =>
  async (request, env, context) => {
    const key = bioCacheKey(request, env?.CF_VERSION_METADATA?.id)
    const cache = key ? edgeCache() : undefined
    if (!key || !cache) return handler(request, env, context)

    const cached = await cache.match(key).catch(() => undefined)
    if (cached) return withCacheStatus(cached, "HIT")

    const response = await handler(request, env, context)
    if (!isStorableBioResponse(response)) return response
    const shareable = shareableBioResponse(response)
    context.waitUntil(cache.put(key, shareable.clone()).catch(() => undefined))
    return withCacheStatus(shareable, "MISS")
  }
