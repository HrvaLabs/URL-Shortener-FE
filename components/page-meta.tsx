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
 * React rewrites the <title> from the layout's metadata right after hydration, and Next rewrites it on
 * query-string navigations, so a single write in an effect can be undone. The title is therefore put
 * back whenever something else changes it, until this page unmounts or the path changes.
 *
 * Usage:
 *   <PageMeta title="Dashboard — hrva.cc" description="Manage your URLs" />
 */
export function PageMeta({ title, description, ogTitle, ogDescription }: PageMetaProps) {
  useEffect(() => {
    document.title = title

    if (description) setMeta("description", description)
    setMeta("og:title", ogTitle ?? title, true)
    setMeta("og:description", ogDescription ?? (description ?? title), true)

    const path = window.location.pathname
    const observer = new MutationObserver(() => {
      if (window.location.pathname === path && document.title !== title) document.title = title
    })
    observer.observe(document.head, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [title, description, ogTitle, ogDescription])

  return null
}
