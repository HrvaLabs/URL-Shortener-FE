// Bump VERSION whenever app/offline/route.ts changes, so installed copies fetch the new offline page.
const VERSION = "1"
const CACHE_PREFIX = "hrva-offline-"
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`
const OFFLINE_URL = "/offline"

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add(new Request(OFFLINE_URL, { cache: "reload" })))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (self.registration.navigationPreload) await self.registration.navigationPreload.enable()
      const names = await caches.keys()
      await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map((name) => caches.delete(name)))
      await self.clients.claim()
    })(),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.mode !== "navigate" || request.method !== "GET") return

  event.respondWith(
    (async () => {
      try {
        const preloaded = await event.preloadResponse
        return preloaded ?? (await fetch(request))
      } catch {
        const offline = await caches.match(OFFLINE_URL, { cacheName: CACHE_NAME })
        return offline ?? Response.error()
      }
    })(),
  )
})
