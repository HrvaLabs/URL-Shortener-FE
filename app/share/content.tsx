"use client"

import { useSearchParams } from "next/navigation"
import { ShortenForm } from "@/components/shorten-form"
import { useAuth } from "@/lib/auth-context"
import { NO_LINK_FOUND, sharedLink } from "@/lib/share"

export function ShareContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const link = sharedLink({
    url: searchParams.get("url"),
    text: searchParams.get("text"),
    title: searchParams.get("title"),
  })

  return (
    <>
      {link ? (
        <div className="mb-5">
          <p className="text-xs text-muted-foreground">Shared link</p>
          <p className="mt-1 font-mono text-sm [overflow-wrap:anywhere]">{link}</p>
        </div>
      ) : (
        <p className="mb-5 text-sm text-muted-foreground">{NO_LINK_FOUND}</p>
      )}
      <ShortenForm key={link ?? ""} initialUrl={link ?? ""} withOptions={Boolean(user)} />
    </>
  )
}

export function ShareLoading() {
  return (
    <div role="status" className="flex justify-center py-4">
      <div aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-foreground" />
      <span className="sr-only">Loading</span>
    </div>
  )
}
