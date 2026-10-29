import openNextWorker from "./.open-next/worker.js"
import { withBioEdgeCache } from "./lib/bio-edge-cache"

const worker = {
  fetch: withBioEdgeCache(openNextWorker.fetch),
}

export default worker
