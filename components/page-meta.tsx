"use client"

import { useEffect } from "react"

interface PageMetaProps {
  title: string
  description?: string
  ogTitle?: string
  ogDescription?: string
}

/**
 * Sets page-specific <title> and meta tags for client-rendered pages
 * that cannot use Next.js `export const metadata`.
 *
 * Usage:
 *   <PageMeta title="Dashboard — hrva.cc" description="Manage your URLs" />
 */
export function PageMeta({ title, description, ogTitle, ogDescription }: PageMetaProps) {
  useEffect(() => {
    document.title = title

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

    if (description) setMeta("description", description)
    setMeta("og:title", ogTitle ?? title, true)
    setMeta("og:description", ogDescription ?? (description ?? title), true)

    // Track the previous title so we can restore it on unmount (though this
    // is usually fine since the root layout always sets a default).
    return () => {
      // cleanup is automatic — next page mount will overwrite
    }
  })

  return null
}
