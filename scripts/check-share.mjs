import assert from "node:assert/strict"
import { NO_LINK_FOUND, firstHttpUrl, sharedLink } from "../lib/share.ts"

let failures = 0

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const character = (codePoint) => String.fromCodePoint(codePoint)

check("the url field wins over text and title", () => {
  assert.equal(
    sharedLink({ url: "https://url.example/a", text: "https://text.example/b", title: "https://title.example/c" }),
    "https://url.example/a",
  )
})

check("text is next, then title", () => {
  assert.equal(sharedLink({ url: "", text: "https://text.example/b", title: "https://title.example/c" }), "https://text.example/b")
  assert.equal(sharedLink({ url: null, text: "no link here", title: "https://title.example/c" }), "https://title.example/c")
})

check("a link inside words is found", () => {
  assert.equal(
    sharedLink({ text: "Look at this https://example.com/article?id=5&ref=app it's great" }),
    "https://example.com/article?id=5&ref=app",
  )
  assert.equal(sharedLink({ title: "Article title", text: "Article title\nhttps://news.example/x" }), "https://news.example/x")
})

check("trailing punctuation is dropped", () => {
  assert.equal(firstHttpUrl("Read this: https://example.com/page."), "https://example.com/page")
  assert.equal(firstHttpUrl("https://example.com/a, https://example.com/b"), "https://example.com/a")
  assert.equal(firstHttpUrl("Seen it? https://example.com/q?x=1!"), "https://example.com/q?x=1")
  assert.equal(firstHttpUrl("'https://example.com/a'"), "https://example.com/a")
  assert.equal(firstHttpUrl(`${character(0x201e)}https://primjer.hr/a${character(0x201c)}, vidi`), "https://primjer.hr/a")
  assert.equal(firstHttpUrl(`https://example.com/more${character(0x2026)}`), "https://example.com/more")
})

check("brackets are kept only when balanced", () => {
  assert.equal(firstHttpUrl("(see https://example.com/page)"), "https://example.com/page")
  assert.equal(firstHttpUrl("(see https://en.wikipedia.org/wiki/Bar_(band))"), "https://en.wikipedia.org/wiki/Bar_(band)")
  assert.equal(firstHttpUrl("[https://example.com/a]"), "https://example.com/a")
})

check("quotes and angle brackets end a link", () => {
  assert.equal(firstHttpUrl("<https://example.com/a>"), "https://example.com/a")
  assert.equal(firstHttpUrl('"https://example.com/a"'), "https://example.com/a")
  assert.equal(firstHttpUrl("`https://example.com/a`"), "https://example.com/a")
})

check("only http and https links count", () => {
  assert.equal(sharedLink({ url: "intent://scan/#Intent;end", text: "https://ok.example" }), "https://ok.example")
  assert.equal(firstHttpUrl("ftp://example.com then https://ok.example"), "https://ok.example")
  assert.equal(firstHttpUrl("mailto:someone@example.com"), null)
  assert.equal(firstHttpUrl("javascript:alert(1)"), null)
  assert.equal(firstHttpUrl("example.com/no-scheme"), null)
})

check("a broken candidate is skipped for the next one", () => {
  assert.equal(firstHttpUrl("https://. and https://ok.example/x"), "https://ok.example/x")
  assert.equal(firstHttpUrl("https://"), null)
})

check("the link is returned as typed, never re-encoded", () => {
  assert.equal(firstHttpUrl(`https://${character(0x10d)}okolada.hr/put`), `https://${character(0x10d)}okolada.hr/put`)
  assert.equal(firstHttpUrl("HTTPS://EXAMPLE.COM/A"), "HTTPS://EXAMPLE.COM/A")
  assert.equal(firstHttpUrl("http://example.com/a b"), "http://example.com/a")
})

check("a long run of brackets is trimmed in linear time", () => {
  const brackets = ")".repeat(60000)
  const started = performance.now()
  const nearLimit = `https://example.com/a${")".repeat(2000)}`
  for (let round = 0; round < 20; round += 1) assert.equal(firstHttpUrl(nearLimit), "https://example.com/a")
  assert.equal(firstHttpUrl(`https://example.com/a${brackets} https://ok.example`), "https://ok.example")
  assert.equal(firstHttpUrl(`(https://example.com/a${brackets}`), null)
  const elapsed = performance.now() - started
  assert.ok(elapsed < 50, `took ${elapsed.toFixed(1)} ms`)
})

check("a candidate over 2048 characters is skipped", () => {
  assert.equal(firstHttpUrl(`https://example.com/${"a".repeat(2029)} https://ok.example`), "https://ok.example")
  assert.equal(firstHttpUrl(`https://example.com/${"a".repeat(2028)}`), `https://example.com/${"a".repeat(2028)}`)
})

check("nothing shared gives no link", () => {
  assert.equal(sharedLink({}), null)
  assert.equal(sharedLink({ url: null, text: null, title: null }), null)
  assert.equal(sharedLink({ text: "Just words", title: "A title" }), null)
})

check("the no-link line", () => {
  assert.equal(NO_LINK_FOUND, "No link found in what was shared.")
})

if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? "" : "s"} failed`)
  process.exit(1)
}
console.log("ok")
