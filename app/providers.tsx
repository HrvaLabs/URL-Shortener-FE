"use client"

import { ThemeProvider } from "next-themes"
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ApiError, retryDelay, shouldRetry } from "@/lib/api-client"
import { AuthProvider } from "@/lib/auth-context"
import { ReconnectingNotice } from "@/components/reconnecting-notice"
import { trackMutation, trackQuery } from "@/lib/reconnecting"
import { EM_DASH, SLOGAN } from "@/lib/seo"
import { reloadIfStaleChunkError } from "@/lib/stale-chunk"
import { useState, useEffect, type ReactNode } from "react"

const reloadUnlessApiError = (error: Error) => {
  if (!(error instanceof ApiError)) reloadIfStaleChunkError(error)
}

const createQueryClient = () => {
  const queryCache = new QueryCache({ onError: reloadUnlessApiError })
  const mutationCache = new MutationCache({ onError: reloadUnlessApiError })
  queryCache.subscribe(trackQuery)
  mutationCache.subscribe(trackMutation)
  return new QueryClient({
    queryCache,
    mutationCache,
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        retry: shouldRetry,
        retryDelay,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createQueryClient)

  useEffect(() => {
    console.log(
      `%c${String.fromCodePoint(0x1f986)} hrva.cc ${EM_DASH} ${SLOGAN}%c\n${String.fromCodePoint(0x1f52e)} try /fortune  ${String.fromCodePoint(0x1f95a)} try /egg`,
      "color: #2251ff; font-size: 16px; font-weight: bold;",
      "color: #6b7280; font-size: 12px;"
    )
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <AuthProvider>{children}</AuthProvider>
        <ReconnectingNotice />
      </ThemeProvider>
    </QueryClientProvider>
  )
}
