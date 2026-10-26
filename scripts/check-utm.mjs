import assert from "node:assert/strict"
import {
  CANT_TAKE_UTM,
  MAX_DESTINATION_LENGTH,
  QUICK_SOURCES,
  UTM_KEYS,
  destinationToSend,
  followTags,
  hasUtm,
  pickQuickSource,
  readUtm,
  recentUtm,
  rememberUtm,
  tooLongMessage,
  tooLongWithUtm,
  utmSignature,
  valuesNotAdded,
  withScheme,
  withUtm,
} from "../lib/utm.ts"

let failures = 0

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    failures += 1
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
  }
}

const withWindow = (fakeWindow, run) => {
  globalThis.window = fakeWindow
  try {
    run()
  } finally {
    delete globalThis.window
  }
}

const memoryStorage = () => {
  const items = new Map()
  return {
    items,
    getItem: (key) => (items.has(key) ? items.get(key) : null),
    setItem: (key, value) => items.set(key, String(value)),
    removeItem: (key) => items.delete(key),
  }
}

const noRecent = { utm_source: [], utm_medium: [], utm_campaign: [], utm_term: [], utm_content: [] }

check("constants", () => {
  assert.deepEqual([...UTM_KEYS], ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"])
  assert.deepEqual(QUICK_SOURCES, [
    { source: "instagram", medium: "social" },
    { source: "facebook", medium: "social" },
    { source: "tiktok", medium: "social" },
    { source: "linkedin", medium: "social" },
    { source: "x", medium: "social" },
    { source: "newsletter", medium: "email" },
    { source: "qr", medium: "qr" },
  ])
})

check("RF1 keeps the query and fragment and replaces old tags", () => {
  assert.equal(
    withUtm("https://shop.example/sale?ref=home&utm_source=old&page=2#reviews", { utm_source: "instagram", utm_medium: "social" }),
    "https://shop.example/sale?ref=home&page=2&utm_source=instagram&utm_medium=social#reviews",
  )
})

check("RF1 removes duplicate tags instead of adding another", () => {
  assert.equal(
    withUtm("https://a.example/?utm_source=a&utm_source=b&utm_campaign=x&id=7", { utm_campaign: "autumn-sale" }),
    "https://a.example/?id=7&utm_campaign=autumn-sale",
  )
})

check("RF1 keeps the other parameters byte for byte", () => {
  assert.equal(
    withUtm("https://a.example/p?q=a%20b&path=/x/y&flag&utm_medium=old", { utm_medium: "email" }),
    "https://a.example/p?q=a%20b&path=/x/y&flag&utm_medium=email",
  )
})

check("RF1 leaves utm keys outside the five alone", () => {
  assert.equal(withUtm("https://a.example/?utm_id=42&utm_source=old", { utm_source: "qr" }), "https://a.example/?utm_id=42&utm_source=qr")
})

check("RF1 leaves a hash route alone", () => {
  assert.equal(
    withUtm("https://app.example/#/page?utm_source=x", { utm_source: "newsletter" }),
    "https://app.example/?utm_source=newsletter#/page?utm_source=x",
  )
})

check("RF1 trims values, skips empty ones and keeps the key order", () => {
  assert.equal(
    withUtm("https://a.example", { utm_content: " hero ", utm_term: "", utm_source: "x" }),
    "https://a.example?utm_source=x&utm_content=hero",
  )
})

check("RF1 with every value empty drops the old tags", () => {
  assert.equal(withUtm("https://a.example/?utm_source=old&utm_medium=social", {}), "https://a.example/")
  assert.equal(withUtm("https://a.example/x?keep=1&utm_source=old#top", { utm_source: "  " }), "https://a.example/x?keep=1#top")
  assert.equal(withUtm("https://a.example/x", {}), "https://a.example/x")
})

const awkward = {
  utm_source: "news letter",
  utm_medium: "a&b",
  utm_campaign: "50%=off#1",
  utm_term: "jesen čokolada",
  utm_content: "a+b/c?d",
}
const awkwardUrl =
  "https://a.example/?x=1&utm_source=news%20letter&utm_medium=a%26b&utm_campaign=50%25%3Doff%231&utm_term=jesen%20%C4%8Dokolada&utm_content=a%2Bb%2Fc%3Fd"

check("RF2 encodes spaces, &, #, = and non-ASCII", () => {
  assert.equal(withUtm("https://a.example/?x=1", awkward), awkwardUrl)
  const parsed = new URL(awkwardUrl)
  assert.equal(parsed.hash, "")
  assert.equal(parsed.searchParams.get("x"), "1")
})

check("RF2 every value round-trips through readUtm", () => {
  assert.deepEqual(readUtm(withUtm("https://a.example/?x=1", awkward)), awkward)
})

check("RF2 a non-ASCII destination keeps its bytes", () => {
  assert.equal(withUtm("https://a.example/čaj?x=č", { utm_source: "x" }), "https://a.example/čaj?x=č&utm_source=x")
})

check("RF2 spaces are %20 and a literal + is %2B, as in Google's Campaign URL Builder", () => {
  assert.equal(
    withUtm("https://a.example/", { utm_campaign: "autumn sale", utm_content: "a+b" }),
    "https://a.example/?utm_campaign=autumn%20sale&utm_content=a%2Bb",
  )
  assert.deepEqual(readUtm("https://a.example/?utm_campaign=autumn%20sale&utm_content=a%2Bb"), { utm_campaign: "autumn sale", utm_content: "a+b" })
  assert.deepEqual(readUtm("https://a.example/?utm_campaign=autumn+sale"), { utm_campaign: "autumn sale" })
})

check("BUG-02 a Croatian domain keeps its host and path byte for byte", () => {
  assert.equal(
    withUtm("https://čokolada.hr/košarica?x=1", { utm_source: "news letter", utm_medium: "a&b", utm_campaign: "50%#1+2", utm_term: "čokolada 🍫" }),
    "https://čokolada.hr/košarica?x=1&utm_source=news%20letter&utm_medium=a%26b&utm_campaign=50%25%231%2B2&utm_term=%C4%8Dokolada%20%F0%9F%8D%AB",
  )
  assert.equal(destinationToSend("čokolada.hr/košarica", true, { utm_source: "qr" }), "https://čokolada.hr/košarica?utm_source=qr")
})

check("RF1 a key that starts with ? is not a utm key, in withUtm and readUtm alike", () => {
  assert.equal(withUtm("https://a.example/p??utm_source=old&a=1", { utm_source: "new" }), "https://a.example/p??utm_source=old&a=1&utm_source=new")
  assert.deepEqual(readUtm("https://a.example/p??utm_source=old&a=1"), {})
})

check("RF1 splice edge cases", () => {
  const v = { utm_source: "new" }
  assert.equal(withUtm("https://a.example/x#top", v), "https://a.example/x?utm_source=new#top")
  assert.equal(withUtm("https://a.example/x?a=1&&b=2&", v), "https://a.example/x?a=1&b=2&utm_source=new")
  assert.equal(withUtm("https://a.example/x?UTM_SOURCE=old", v), "https://a.example/x?UTM_SOURCE=old&utm_source=new")
  assert.deepEqual(readUtm("https://a.example/x?UTM_SOURCE=old"), {})
  assert.equal(withUtm("https://a.example/x?utm%5Fsource=old&a=1", v), "https://a.example/x?a=1&utm_source=new")
  assert.deepEqual(readUtm("https://a.example/x?utm%5Fsource=old&a=1"), { utm_source: "old" })
  assert.equal(withUtm("https://example.com:8080", v), "https://example.com:8080?utm_source=new")
  assert.equal(withUtm("https://[2001:db8::1]:8443/x?a=1#f", v), "https://[2001:db8::1]:8443/x?a=1&utm_source=new#f")
  assert.equal(withUtm("https://a.example/p?utm_source=x#frag", v), "https://a.example/p?utm_source=new#frag")
  assert.equal(withUtm("https://a.example/p?utm_source=x#frag", {}), "https://a.example/p#frag")
})

check("BUG-02 a percent-encoded path, the other parameters and the fragment stay as typed", () => {
  assert.equal(
    withUtm("https://a.example/ko%C5%A1arica/moja%20lista?x=%C4%8D&q=a+b&utm_source=old#Odjeljak%201", { utm_source: "qr" }),
    "https://a.example/ko%C5%A1arica/moja%20lista?x=%C4%8D&q=a+b&utm_source=qr#Odjeljak%201",
  )
  assert.equal(withUtm("HTTPS://Example.COM/Path?A=1", { utm_source: "x" }), "HTTPS://Example.COM/Path?A=1&utm_source=x")
  assert.equal(withUtm("https://user:pw@example.com/x", { utm_source: "x" }), "https://user:pw@example.com/x?utm_source=x")
  assert.equal(withUtm("https://a.example/x?#top", { utm_source: "x" }), "https://a.example/x?utm_source=x#top")
})

check("RF3 needs an absolute http(s) destination", () => {
  for (const destination of ["example.com/x", "example", "", "https://", "ftp://example.com/file", "mailto:a@example.com", "javascript:alert(1)"]) {
    assert.equal(withUtm(destination, { utm_source: "x" }), null, destination)
  }
  assert.deepEqual(readUtm("example.com/?utm_source=x"), {})
  assert.equal(hasUtm("example"), false)
})

check("RF3 never throws on half-typed input", () => {
  for (const destination of ["%", "http://[", "https://exa mple.com", "\u0000", "?utm_source=x", "#", "//example.com", "https://a.example/?%zz=1&utm_source=%"]) {
    const result = withUtm(destination, { utm_source: "x" })
    assert.ok(result === null || typeof result === "string", destination)
    assert.equal(typeof readUtm(destination), "object", destination)
    assert.equal(typeof hasUtm(destination), "boolean", destination)
    assert.ok(destinationToSend(destination, true, { utm_source: "x" }) !== undefined, destination)
  }
})

check("RF3 the scheme rule matches the backend's", () => {
  assert.equal(withScheme("example.com/x"), "https://example.com/x")
  assert.equal(withScheme("  example.com  "), "https://example.com")
  assert.equal(withScheme("HTTP://Example.com"), "HTTP://Example.com")
  assert.equal(withScheme("localhost:3000/x"), "https://localhost:3000/x")
  assert.equal(withScheme("example.com:8080"), "https://example.com:8080")
  assert.equal(withScheme("mailto:a@example.com"), "mailto:a@example.com")
  assert.equal(withScheme("http/example.com"), "http/example.com")
  assert.equal(withScheme(""), "")
})

check("RF3 tags are applied once the scheme rule makes it parse", () => {
  assert.equal(withUtm(withScheme("example.com/x"), { utm_source: "instagram" }), "https://example.com/x?utm_source=instagram")
  assert.equal(destinationToSend("example.com/x", true, { utm_source: "instagram" }), "https://example.com/x?utm_source=instagram")
  assert.equal(destinationToSend("mailto:a@example.com", true, { utm_source: "x" }), null)
})

check("RF4 readUtm and hasUtm", () => {
  assert.deepEqual(readUtm("https://a.example/?utm_source=ig&x=1&utm_medium=social"), { utm_source: "ig", utm_medium: "social" })
  assert.deepEqual(readUtm("https://a.example/?utm_source=first&utm_source=second&utm_term="), { utm_source: "first" })
  assert.deepEqual(readUtm("https://a.example/?x=1"), {})
  assert.equal(hasUtm("https://a.example/?utm_campaign=sale"), true)
  assert.equal(hasUtm("https://a.example/?utm_id=1&utm_source="), false)
})

check("RF5 collapsed sends the destination as typed, pasted tags included", () => {
  assert.equal(destinationToSend("https://Shop.example/?utm_source=old", false, { utm_source: "new" }), "https://Shop.example/?utm_source=old")
  assert.equal(destinationToSend("example.com/x", false, { utm_source: "new" }), "example.com/x")
})

check("RF5 open with every field empty and no tags sends it as typed", () => {
  assert.equal(destinationToSend("example.com/x", true, {}), "example.com/x")
  assert.equal(destinationToSend("https://a.example", true, { utm_source: " ", utm_medium: "" }), "https://a.example")
})

check("RF5 an emptied field removes that tag", () => {
  assert.equal(
    destinationToSend("https://a.example/?utm_source=old&utm_medium=social&utm_campaign=sale", true, { utm_medium: "social", utm_campaign: "sale" }),
    "https://a.example/?utm_medium=social&utm_campaign=sale",
  )
})

check("RF5 open with the pasted tags cleared removes them", () => {
  assert.equal(destinationToSend("https://a.example/?ref=1&utm_source=old", true, {}), "https://a.example/?ref=1")
})

check("RF5 untouched tags send the destination byte for byte", () => {
  const pasted = "https://a.example/landing?utm_source=Mail%20Chimp&lang=hr&utm_campaign=oct"
  assert.equal(destinationToSend(pasted, true, readUtm(pasted)), pasted)
  assert.equal(destinationToSend(pasted, true, { utm_source: " Mail Chimp ", utm_campaign: "oct", utm_term: "" }), pasted)
  assert.equal(destinationToSend("shop.example/?utm_source=a", true, { utm_source: "a" }), "shop.example/?utm_source=a")
  assert.equal(
    destinationToSend(pasted, true, { utm_source: "Mail Chimp", utm_campaign: "nov" }),
    "https://a.example/landing?lang=hr&utm_source=Mail%20Chimp&utm_campaign=nov",
  )
})

check("admin guard: an untouched stored destination comes back unchanged", () => {
  for (const stored of [
    "https://example.org/landing?utm_source=Newsletter%20Oct&utm_medium=email&utm_campaign=oct-25&lang=hr",
    "https://example.com/reg?a=1&utm_source=Mail+Chimp&utm_campaign=oct",
    "https://example.com/plain",
    "https://Example.com",
  ]) {
    assert.equal(destinationToSend(stored, true, readUtm(stored)), stored, stored)
    assert.equal(destinationToSend(stored, false, readUtm(stored)), stored, stored)
  }
})

check("BUG-03 the composed link may be 2048 characters, not 2049", () => {
  assert.equal(MAX_DESTINATION_LENGTH, 2048)
  const fits = `example.com/${"a".repeat(2014)}`
  const fitsSent = destinationToSend(fits, true, { utm_source: "qr" })
  assert.equal(fitsSent.length, 2048)
  assert.equal(tooLongWithUtm(fits, fitsSent), false)
  const over = `example.com/${"a".repeat(2015)}`
  const overSent = destinationToSend(over, true, { utm_source: "qr" })
  assert.equal(over.length, 2027)
  assert.equal(overSent.length, 2049)
  assert.equal(tooLongWithUtm(over, overSent), true)
})

check("BUG-03 only tags added by the builder trigger the message", () => {
  const long = `https://example.com/${"a".repeat(2040)}?utm_source=qr`
  assert.equal(tooLongWithUtm(long, destinationToSend(long, true, readUtm(long))), false)
  assert.equal(tooLongWithUtm(long, destinationToSend(long, false, { utm_source: "x" })), false)
  assert.equal(tooLongWithUtm("mailto:a@example.com", destinationToSend("mailto:a@example.com", true, { utm_source: "x" })), false)
})

check("BUG-03 and preview copy", () => {
  assert.equal(
    tooLongMessage("long URL"),
    "With the UTM parameters added, the link is longer than 2048 characters. Shorten a value or the long URL.",
  )
  assert.equal(tooLongMessage("destination"), "With the UTM parameters added, the link is longer than 2048 characters. Shorten a value or the destination.")
  assert.equal(CANT_TAKE_UTM, "This address can't take UTM parameters.")
})

const previousTags = { utm_source: "instagram", utm_medium: "social", utm_campaign: "autumn sale" }
const pastedTagged = "https://shop.example.org/winter?utm_source=mailchimp&utm_medium=email&utm_campaign=winter-2026"
const pastedTags = { utm_source: "mailchimp", utm_medium: "email", utm_campaign: "winter-2026" }

check("BUG-01 after a create clears the fields, a pasted tagged link keeps its own tags", () => {
  const next = followTags({}, readUtm(pastedTagged), {})
  assert.deepEqual(next, { value: pastedTags, reveal: true })
  assert.equal(destinationToSend(pastedTagged, true, next.value), pastedTagged)
})

check("BUG-01 a destination that brings other tags wins over the fields", () => {
  assert.deepEqual(followTags({}, pastedTags, previousTags), { value: pastedTags, reveal: true })
  assert.deepEqual(followTags({ utm_source: "a" }, pastedTags, { utm_source: "typed" }), { value: pastedTags, reveal: false })
  assert.deepEqual(followTags({ utm_source: "a" }, { utm_source: "ab" }, { utm_source: "a" }), { value: { utm_source: "ab" }, reveal: false })
})

check("BUG-01 after a create of a tagged link, a paste with other tags reveals the section", () => {
  assert.deepEqual(followTags({ utm_source: "a" }, pastedTags, {}), { value: pastedTags, reveal: true })
})

check("BUG-01 a destination that loses its tags clears mirrored fields only", () => {
  assert.deepEqual(followTags(pastedTags, {}, pastedTags), { value: {}, reveal: false })
  assert.equal(followTags(pastedTags, {}, previousTags), null)
  assert.equal(followTags({}, {}, previousTags), null)
})

check("BUG-01 unchanged tags fill empty fields and leave typed ones", () => {
  assert.deepEqual(followTags(pastedTags, pastedTags, {}), { value: pastedTags, reveal: false })
  assert.equal(followTags(pastedTags, pastedTags, previousTags), null)
})

const instagram = QUICK_SOURCES[0]
const newsletter = QUICK_SOURCES[5]

check("BUG-05 a chip sets Source, and Medium when it is empty", () => {
  assert.deepEqual(pickQuickSource({}, instagram, null), { value: { utm_source: "instagram", utm_medium: "social" }, chipMedium: "social" })
  assert.deepEqual(pickQuickSource({ utm_medium: "paid" }, instagram, null), { value: { utm_source: "instagram", utm_medium: "paid" }, chipMedium: null })
})

check("BUG-05 pressing the picked chip clears Source and the Medium it set", () => {
  assert.deepEqual(
    pickQuickSource({ utm_source: "instagram", utm_medium: "social", utm_campaign: "sale" }, instagram, "social"),
    { value: { utm_source: "", utm_medium: "", utm_campaign: "sale" }, chipMedium: null },
  )
  assert.deepEqual(
    pickQuickSource({ utm_source: "instagram", utm_medium: "paid" }, instagram, null),
    { value: { utm_source: "", utm_medium: "paid" }, chipMedium: null },
  )
  assert.deepEqual(
    pickQuickSource({ utm_source: "instagram", utm_medium: "social" }, instagram, null),
    { value: { utm_source: "", utm_medium: "social" }, chipMedium: null },
  )
})

check("item 15 a second chip replaces the Medium the first chip set", () => {
  assert.deepEqual(
    pickQuickSource({ utm_source: "instagram", utm_medium: "social" }, newsletter, "social"),
    { value: { utm_source: "newsletter", utm_medium: "email" }, chipMedium: "email" },
  )
  assert.deepEqual(
    pickQuickSource({ utm_source: "instagram", utm_medium: "paid-social" }, newsletter, "social"),
    { value: { utm_source: "newsletter", utm_medium: "paid-social" }, chipMedium: null },
  )
})

check("item 12 counts the values a collapsed section leaves out", () => {
  assert.equal(valuesNotAdded({}, {}), 0)
  assert.equal(valuesNotAdded(previousTags, {}), 3)
  assert.equal(valuesNotAdded({ utm_source: " ", utm_term: "" }, {}), 0)
  assert.equal(valuesNotAdded(pastedTags, pastedTags), 0)
  assert.equal(valuesNotAdded({ utm_source: " mailchimp ", utm_medium: "social" }, pastedTags), 1)
})

check("utmSignature ignores blanks, surrounding spaces and key order", () => {
  assert.equal(utmSignature({ utm_medium: " social ", utm_source: "ig", utm_term: "" }), utmSignature({ utm_source: "ig", utm_medium: "social" }))
  assert.notEqual(utmSignature({ utm_source: "ig" }), utmSignature({ utm_medium: "ig" }))
})

check("recent values without a window", () => {
  assert.deepEqual(recentUtm(), noRecent)
  rememberUtm({ utm_source: "x" })
})

check("recent values keep the last five distinct, newest first", () => {
  const storage = memoryStorage()
  withWindow({ localStorage: storage }, () => {
    for (const source of ["a", "b", "a", "c", "d", "e", "f"]) rememberUtm({ utm_source: source })
    rememberUtm({ utm_medium: "  ", utm_campaign: " sale " })
    assert.deepEqual(recentUtm(), { ...noRecent, utm_source: ["f", "e", "d", "c", "a"], utm_campaign: ["sale"] })
    assert.deepEqual(JSON.parse(storage.getItem("hrva:utm-recent")).utm_source, ["f", "e", "d", "c", "a"])
  })
})

check("recent values survive corrupt storage", () => {
  const storage = memoryStorage()
  withWindow({ localStorage: storage }, () => {
    storage.setItem("hrva:utm-recent", "{not json")
    assert.deepEqual(recentUtm(), noRecent)
    storage.setItem("hrva:utm-recent", JSON.stringify({ utm_source: "x", utm_medium: [1, "email", null, " "] }))
    assert.deepEqual(recentUtm(), { ...noRecent, utm_medium: ["email"] })
    storage.setItem("hrva:utm-recent", JSON.stringify({ utm_campaign: ["a", "a", "b", "a", "c", "d", "e", "f"] }))
    assert.deepEqual(recentUtm(), { ...noRecent, utm_campaign: ["a", "b", "c", "d", "e"] })
  })
})

check("recent values with storage blocked", () => {
  const blocked = {
    get localStorage() {
      throw new Error("SecurityError")
    },
  }
  withWindow(blocked, () => {
    assert.deepEqual(recentUtm(), noRecent)
    rememberUtm({ utm_source: "x" })
  })
  const full = { localStorage: { ...memoryStorage(), setItem: () => { throw new Error("QuotaExceededError") } } }
  withWindow(full, () => {
    rememberUtm({ utm_source: "x" })
    assert.deepEqual(recentUtm(), noRecent)
  })
})

if (failures > 0) {
  console.error(`${failures} check${failures === 1 ? "" : "s"} failed`)
  process.exit(1)
}
console.log("ok")
