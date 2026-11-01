import openNextWorker from "./.open-next/worker.js"
import { withBioEdgeCache } from "./lib/bio-edge-cache"
import { junkPathResponse } from "./lib/junk-paths"
import { withContentSecurityPolicy } from "./lib/security-headers"

// Re-export any Durable Object class added later (e.g. OpenNext's DOQueueHandler or DOShardedTagCache) from ./.open-next/worker.js here.
const nextFetch = withBioEdgeCache(openNextWorker.fetch)

const worker = {
  fetch: async (request, env, context) => junkPathResponse(request) ?? withContentSecurityPolicy(await nextFetch(request, env, context)),
}

export default worker
