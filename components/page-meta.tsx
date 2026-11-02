"use client"

import { useEffect } from "react"

interface PageMetaProps {
  title: string
  description?: string
  ogTitle?: string
  ogDescription?: string
}

const setMeta = (name: string, content: string, property = false) => {
  const attr = property ? "property" : "name"
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute("content", content)
}

/**
 * Sets page-specific <title> and meta tags for client-rendered pages
 * that cannot use Next.js `export const metadata`.
 *
 * Usage:
 *   <PageMeta title="Dashboard — hrva.cc" description="Manage your URLs" />
 */
export function PageMeta({ title, description, ogTitle, ogDescription }: PageMetaProps) {
  // Runs after every render on purpose: Next rewrites <title> on query-string navigations.
  useEffect(() => {
    document.title = title

    if (description) setMeta("description", description)
    setMeta("og:title", ogTitle ?? title, true)
    setMeta("og:description", ogDescription ?? (description ?? title), true)
  })

  return null
}
