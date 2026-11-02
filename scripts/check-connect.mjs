import assert from "node:assert/strict"
import { CLIENT_NAME_NOTE, connectDestinationText, lookalikeWarning } from "../lib/connect.ts"

let failures = 0

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const view = (overrides) => ({ clientName: "Claude", redirectHost: "claude.ai", loopback: false, lookalike: false, ...overrides })

check("the screen says which site the app sends you to", () => {
  assert.equal(connectDestinationText(view()), "After you allow it, hrva.cc sends you to claude.ai.")
  assert.equal(lookalikeWarning(view()), null)
})

check("a desktop app sends you back to this device and names no host", () => {
  assert.equal(connectDestinationText(view({ redirectHost: "localhost", loopback: true })), "After you allow it, hrva.cc sends you back to an app on this device.")
  assert.equal(lookalikeWarning(view({ redirectHost: "localhost", loopback: true, lookalike: true })), null)
})

check("a name that claims a known app while sending you elsewhere is warned about", () => {
  assert.equal(
    lookalikeWarning(view({ redirectHost: "claude.ai.evil.example", lookalike: true })),
    "This app calls itself Claude, but it sends you to claude.ai.evil.example, which is not Claude's site. Don't allow it unless you started this connection yourself.",
  )
})

check("the note says hrva.cc doesn't check the name", () => {
  assert.equal(CLIENT_NAME_NOTE, "The name is chosen by the app and is not checked by hrva.cc.")
})

if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? "" : "s"} failed`)
  process.exit(1)
}
console.log("ok")
