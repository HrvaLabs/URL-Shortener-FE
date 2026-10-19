"use client"

import { Suspense } from "react"
import { AuthCallbackContent, AuthCallbackLoading } from "./content"

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackLoading />}>
      <AuthCallbackContent />
    </Suspense>
  )
}
