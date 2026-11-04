import type { QueryClient } from "@tanstack/react-query"
import { onBackendRecovered, perQueryRetry } from "./api-client"

/** Gives each query's retries their own restart window, timed from that query's first failure. */
export function timeRetriesPerQuery(client: QueryClient): void {
  const defaultQueryOptions = client.defaultQueryOptions.bind(client)
  client.defaultQueryOptions = ((options) => {
    const defaulted = defaultQueryOptions(options)
    if (typeof defaulted.retry === "function" && defaulted.queryHash) defaulted.retry = perQueryRetry(defaulted.queryHash, defaulted.retry)
    return defaulted
  }) as typeof client.defaultQueryOptions
}

/** Loads again the queries on screen that ended in an error. */
export const refetchFailedQueries = (client: QueryClient): Promise<void> =>
  client.refetchQueries({ type: "active", predicate: (query) => query.state.status === "error" })

/** After the backend answers again, the queries on screen that ended in an error load again by themselves. */
export const refetchFailedQueriesOnRecovery = (client: QueryClient): (() => void) =>
  onBackendRecovered(() => void refetchFailedQueries(client))
