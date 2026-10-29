"use client"

import { useEffect } from "react"

const SERVICE_WORKER_HOST = "app.hrva.cc"

export function ServiceWorker() {
  useEffect(() => {
    if (window.location.hostname !== SERVICE_WORKER_HOST || !("serviceWorker" in navigator)) return
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => undefined)
  }, [])

  return null
}
