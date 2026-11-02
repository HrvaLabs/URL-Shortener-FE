import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

const stored = new Map()
globalThis.localStorage = {
  getItem: (key) => stored.get(key) ?? null,
  setItem: (key, value) => stored.set(key, String(value)),
  removeItem: (key) => stored.delete(key),
}
globalThis.document = { createElement: () => ({ click() {}, appendChild() {} }), createTextNode: () => ({}), getElementsByTagName: () => [{ appendChild() {} }], head: { appendChild() {} } }
URL.createObjectURL = () => "blob:check"
URL.revokeObjectURL = () => {}

const { SESSION_ENDED, adminApi, authApi, onAdminTwoStepRequired, onSessionEnded, urlApi, userApi } = await import("../lib/api-client.ts")
const { ADMIN_TWO_STEP_REQUIRED } = await import("../lib/admin-two-step.ts")
const { VISIT_LIMIT_HINT, opensText, shortLinkOf } = await import("../lib/utils.ts")

let failures = 0
let answer = () => new Response("")
const sent = []
globalThis.fetch = async (url, init) => {
  sent.push({ url, authorization: init?.headers?.Authorization, body: init?.body })
  return answer()
}

const check = async (name, run) => {
  try {
    await run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const problem = (status, detail) =>
  new Response(JSON.stringify({ type: "about:blank", title: "Unauthorized", status, detail }), { status, headers: { "Content-Type": "application/problem+json" } })

const downloads = [
  ["urlApi.exportCsv", () => urlApi.exportCsv(), "id,shortUrl\n"],
  ["userApi.exportMyData", () => userApi.exportMyData(), "{\"email\":\"ana@hrva.cc\"}"],
  ["adminApi.exportUrlsCsv", () => adminApi.exportUrlsCsv(), "id,shortUrl\n"],
]

for (const [name, download, body] of downloads) {
  await check(`${name} signs out when the session ended elsewhere`, async () => {
    stored.set("auth-token", "Bearer ended")
    const heard = []
    onSessionEnded((message) => heard.push(message))
    answer = () => problem(401, SESSION_ENDED)
    await assert.rejects(download(), (error) => error.message === SESSION_ENDED && error.status === 401)
    assert.equal(localStorage.getItem("auth-token"), null)
    assert.deepEqual(heard, [SESSION_ENDED])
    onSessionEnded(null)
  })

  await check(`${name} keeps other errors' text and the token`, async () => {
    stored.set("auth-token", "Bearer kept")
    answer = () => problem(429, "Too many exports. Try again in an hour.")
    await assert.rejects(download(), (error) => error.message === "Too many exports. Try again in an hour." && error.status === 429)
    assert.equal(localStorage.getItem("auth-token"), "Bearer kept")
  })

  await check(`${name} keeps a renewed token`, async () => {
    stored.set("auth-token", "Bearer old")
    sent.length = 0
    answer = () => new Response(body, { status: 200, headers: { Authorization: "Bearer renewed" } })
    await download()
    assert.equal(sent[0].authorization, "Bearer old")
    assert.equal(localStorage.getItem("auth-token"), "Bearer renewed")
  })
}

await check("a page's own toast of the session-ended error joins the sign-out toast", async () => {
  const { toast } = await import("sonner")
  const shown = []
  toast.error = (message, data) => shown.push({ message, id: data?.id })
  const { SESSION_ENDED_TOAST_ID, showSessionEndedOnce } = await import("../lib/session-ended-toast.ts")
  showSessionEndedOnce()
  showSessionEndedOnce()

  toast.error(SESSION_ENDED, { id: SESSION_ENDED_TOAST_ID })
  toast.error(SESSION_ENDED)
  toast.error(SESSION_ENDED, { duration: 5000 })
  toast.error("Too many exports. Try again in an hour.")

  assert.deepEqual(shown.map((entry) => entry.id), [SESSION_ENDED_TOAST_ID, SESSION_ENDED_TOAST_ID, SESSION_ENDED_TOAST_ID, undefined])
  assert.equal(new Set(shown.filter((entry) => entry.message === SESSION_ENDED).map((entry) => entry.id)).size, 1)
})

await check("an admin page answering the two-step 403 tells the listener and keeps the token", async () => {
  stored.set("auth-token", "Bearer admin")
  const heard = []
  onAdminTwoStepRequired((message) => heard.push(message))
  answer = () => problem(403, ADMIN_TWO_STEP_REQUIRED)
  await assert.rejects(adminApi.getReviewQueue({ size: 1 }), (error) => error.message === ADMIN_TWO_STEP_REQUIRED && error.status === 403)
  await assert.rejects(adminApi.exportUrlsCsv(), (error) => error.message === ADMIN_TWO_STEP_REQUIRED && error.status === 403)
  assert.deepEqual(heard, [ADMIN_TWO_STEP_REQUIRED, ADMIN_TWO_STEP_REQUIRED])
  assert.equal(localStorage.getItem("auth-token"), "Bearer admin")
  onAdminTwoStepRequired(null)
})

await check("any other 403 doesn't", async () => {
  stored.set("auth-token", "Bearer user")
  const heard = []
  onAdminTwoStepRequired((message) => heard.push(message))
  answer = () => problem(403, "Access denied")
  await assert.rejects(adminApi.getReviewQueue({ size: 1 }), (error) => error.message === "Access denied")
  assert.deepEqual(heard, [])
  onAdminTwoStepRequired(null)
})

await check("urlApi.create reads a 201 answer with its shortLink", async () => {
  stored.set("auth-token", "Bearer kept")
  const created = { id: 7, shortUrl: "Ab3", longUrl: "https://example.com", shortLink: "https://hrva.cc/Ab3" }
  answer = () => new Response(JSON.stringify(created), { status: 201, headers: { "Content-Type": "application/json", Location: "https://hrva.cc/api/v1/urls/Ab3/peek" } })
  const link = await urlApi.create({ longUrl: "https://example.com" })
  assert.equal(link.shortLink, "https://hrva.cc/Ab3")
  assert.equal(shortLinkOf(link), "https://hrva.cc/Ab3")
})

await check("shortLinkOf prefers the answer's shortLink and builds one for older answers", () => {
  assert.equal(shortLinkOf({ shortUrl: "menu", shortLink: "https://go.example.com/menu", domain: { id: 7, hostname: "go.example.com" } }), "https://go.example.com/menu")
  assert.equal(shortLinkOf({ shortUrl: "menu", domain: { id: 7, hostname: "go.example.com" } }), "https://go.example.com/menu")
  assert.match(shortLinkOf({ shortUrl: "Ab3" }), /\/Ab3$/)
})

await check("a visit limit counts clicks, not unique visitors", () => {
  assert.equal(VISIT_LIMIT_HINT, "Every click counts, not counting bots.")
  assert.equal(opensText({ opens: 3, visitLimit: 5 }), "3 of 5 clicks used")
  assert.equal(opensText({ opens: 1, visitLimit: 1 }), "1 of 1 click used")
  assert.equal(opensText({ visitLimit: 1200 }), "0 of 1,200 clicks used")
})

await check("the OAuth code is exchanged with the verifier of the browser that started the sign-in", async () => {
  sent.length = 0
  answer = () => new Response(JSON.stringify({ token: "Bearer jwt" }), { status: 200, headers: { "Content-Type": "application/json" } })
  await authApi.exchangeOAuthCode("one-time-code", "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk")
  assert.equal(sent.length, 1)
  assert.match(sent[0].url, /\/auth\/oauth\/exchange$/)
  assert.deepEqual(JSON.parse(sent[0].body), { code: "one-time-code", verifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk" })
})

if (failures > 0) {
  console.error(`${failures} check(s) failed`)
  process.exit(1)
}

console.log("ok")
