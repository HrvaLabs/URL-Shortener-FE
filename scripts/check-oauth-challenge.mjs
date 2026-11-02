import assert from "node:assert/strict"
import {
  OAUTH_VERIFIER_KEY,
  VERIFIER_LIFETIME_MS,
  challengeOf,
  keepSignInVerifier,
  newVerifier,
  prepareSignInChallenge,
  takeSignInVerifier,
} from "../lib/oauth-challenge.ts"

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

const blocked = () => {
  const refuse = () => {
    throw new Error("SecurityError")
  }
  return { getItem: refuse, setItem: refuse, removeItem: refuse }
}

const NOW = 1_793_000_000_000

await check("the RFC 7636 example verifier gives its S256 challenge", async () => {
  assert.equal(await challengeOf("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"), "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM")
})

await check("a verifier is 32 random bytes in base64url, new each time", async () => {
  const verifiers = new Set(Array.from({ length: 50 }, () => newVerifier()))
  assert.equal(verifiers.size, 50)
  for (const verifier of verifiers) assert.match(verifier, /^[A-Za-z0-9_-]{43}$/)
})

await check("a prepared challenge is the S256 of its verifier", async () => {
  const { verifier, challenge } = await prepareSignInChallenge()
  assert.match(challenge, /^[A-Za-z0-9_-]{43}$/)
  assert.equal(await challengeOf(verifier), challenge)
  assert.notEqual(challenge, verifier)
})

await check("the verifier is kept in one slot with a 10-minute expiry, and each start overwrites it", async () => {
  assert.equal(VERIFIER_LIFETIME_MS, 600_000)
  const slot = memoryStorage()
  keepSignInVerifier("first", slot, NOW)
  keepSignInVerifier("second", slot, NOW + 1_000)
  assert.equal(slot.items.size, 1)
  assert.deepEqual(JSON.parse(slot.items.get(OAUTH_VERIFIER_KEY)), { verifier: "second", expiresAt: NOW + 1_000 + 600_000 })
})

await check("the callback takes the verifier once, in any tab of the browser", async () => {
  const slot = memoryStorage()
  keepSignInVerifier("kept", slot, NOW)
  assert.equal(takeSignInVerifier(slot, NOW + 599_999), "kept")
  assert.equal(slot.items.size, 0)
  assert.equal(takeSignInVerifier(slot, NOW + 600_000), null)
})

await check("an expired or foreign value gives no verifier and is cleared", async () => {
  const slot = memoryStorage()
  keepSignInVerifier("old", slot, NOW)
  assert.equal(takeSignInVerifier(slot, NOW + 600_000), null)
  assert.equal(slot.items.size, 0)
  for (const value of ["not json", "\"text\"", "{\"verifier\":1,\"expiresAt\":9e15}", "{\"verifier\":\"v\"}"]) {
    slot.items.set(OAUTH_VERIFIER_KEY, value)
    assert.equal(takeSignInVerifier(slot, NOW), null)
  }
})

await check("blocked storage neither throws nor gives a verifier", async () => {
  keepSignInVerifier("v", blocked(), NOW)
  assert.equal(takeSignInVerifier(blocked(), NOW), null)
})

if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? "" : "s"} failed`)
  process.exit(1)
}
console.log("ok")
