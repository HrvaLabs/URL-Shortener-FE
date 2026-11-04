import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

const { tokenExpired, answerToRefusal } = await import("../lib/session-check.ts")
const { SESSION_ENDED } = await import("../lib/api-client.ts")

let failures = 0
const check = (name, run) => {
  try {
    run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const base64url = (value) => Buffer.from(JSON.stringify(value)).toString("base64url")
const jwt = (claims) => `Bearer ${base64url({ alg: "HS512" })}.${base64url(claims)}.signature`
const NOW = Date.UTC(2026, 10, 4, 12, 0, 0)
const live = jwt({ sub: "admin@localhost", exp: NOW / 1000 + 3600 })
const expired = jwt({ sub: "admin@localhost", exp: NOW / 1000 - 1 })

check("a token is expired from its exp claim, read without checking the signature", () => {
  assert.equal(tokenExpired(live, NOW), false)
  assert.equal(tokenExpired(expired, NOW), true)
  assert.equal(tokenExpired(live.replace("Bearer ", ""), NOW), false, "with or without the Bearer prefix")
})

check("a token that can't be read counts as expired", () => {
  for (const token of [null, "", "Bearer", "Bearer abc", "Bearer a.b.c", `Bearer x.${base64url({ sub: "x" })}.y`, `Bearer x.${base64url({ exp: "soon" })}.y`]) {
    assert.equal(tokenExpired(token, NOW), true, String(token))
  }
})

check("a refusal signs out at once when the session ended or the token expired or can't be read", () => {
  assert.equal(answerToRefusal(live, NOW, 0, SESSION_ENDED), "sign-out")
  assert.equal(answerToRefusal(expired, NOW, 0, "Sign in to continue."), "sign-out")
  assert.equal(answerToRefusal("Bearer junk", NOW, 0, "Sign in to continue."), "sign-out")
})

check("the first refusal of an unexpired token waits; the second in a row signs out", () => {
  assert.equal(answerToRefusal(live, NOW, 0, "Sign in to continue."), "wait")
  assert.equal(answerToRefusal(live, NOW, 0, "Access denied"), "wait")
  assert.equal(answerToRefusal(live, NOW, 1, "Sign in to continue."), "sign-out")
})

if (failures > 0) process.exit(1)
console.log("ok")
