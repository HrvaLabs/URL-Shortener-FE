"use client"

import { Suspense } from "react"
import { PageMeta } from "@/components/page-meta"
import { ConnectContent, ConnectLoading } from "./content"

export default function ConnectPage() {
  return (
    <Suspense fallback={<ConnectLoading />}>
      <PageMeta title="Connect an app" />
      <ConnectContent />
    </Suspense>
  )
}
