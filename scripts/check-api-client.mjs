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

const { SESSION_ENDED, adminApi, onSessionEnded, urlApi, userApi } = await import("../lib/api-client.ts")

let failures = 0
let answer = () => new Response("")
const sent = []
globalThis.fetch = async (url, init) => {
  sent.push({ url, authorization: init?.headers?.Authorization })
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

if (failures > 0) {
  console.error(`${failures} check(s) failed`)
  process.exit(1)
}

console.log("ok")
