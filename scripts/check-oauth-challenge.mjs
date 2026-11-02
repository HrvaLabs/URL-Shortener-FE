import assert from "node:assert/strict"
import { OAUTH_VERIFIER_KEY, challengeOf, newVerifier, startSignInChallenge, takeSignInVerifier } from "../lib/oauth-challenge.ts"

let failures = 0

const check = async (name, run) => {
  try {
    await run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const memoryStorage = () => {
  const items = new Map()
  return {
    items,
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  }
}

await check("the RFC 7636 example verifier gives its S256 challenge", async () => {
  assert.equal(await challengeOf("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
})

await check("a verifier is 32 random bytes in base64url, new each time", async () => {
  const verifiers = new Set(Array.from({ length: 50 }, () => newVerifier()))
  assert.equal(verifiers.size, 50)
  for (const verifier of verifiers) assert.match(verifier, /^[A-Za-z0-9_-]{43}$/)
})

await check("starting keeps the verifier and answers its challenge", async () => {
  const storage = memoryStorage()
  const challenge = await startSignInChallenge(storage)
  const verifier = storage.items.get(OAUTH_VERIFIER_KEY)
  assert.match(challenge, /^[A-Za-z0-9_-]{43}$/)
  assert.equal(await challengeOf(verifier), challenge)
  assert.notEqual(challenge, verifier)
})

await check("the callback takes the verifier once", async () => {
  const storage = memoryStorage()
  await startSignInChallenge(storage)
  const verifier = storage.items.get(OAUTH_VERIFIER_KEY)
  assert.equal(takeSignInVerifier(storage), verifier)
  assert.equal(storage.items.size, 0)
  assert.equal(takeSignInVerifier(storage), null)
})

await check("blocked storage gives no verifier instead of throwing", async () => {
  const blocked = {
    getItem: () => {
      throw new Error("SecurityError")
    },
    removeItem: () => {
      throw new Error("SecurityError")
    },
  }
  assert.equal(takeSignInVerifier(blocked), null)
})

if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? "" : "s"} failed`)
  process.exit(1)
}
console.log("ok")
