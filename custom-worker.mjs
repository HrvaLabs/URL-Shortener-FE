import openNextWorker from "./.open-next/worker.js"
import { withBioEdgeCache } from "./lib/bio-edge-cache"

// Re-export any Durable Object class added later (e.g. OpenNext's DOQueueHandler or DOShardedTagCache) from ./.open-next/worker.js here.
const worker = {
  fetch: withBioEdgeCache(openNextWorker.fetch),
}

export default worker
