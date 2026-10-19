"use client"

import { Suspense } from "react"
import { ConnectContent, ConnectLoading } from "./content"

export default function ConnectPage() {
  return (
    <Suspense fallback={<ConnectLoading />}>
      <ConnectContent />
    </Suspense>
  )
}
