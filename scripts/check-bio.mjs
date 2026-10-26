import assert from "node:assert/strict"
import {
  BIO_ACCENTS,
  BIO_ICON_LABELS,
  BIO_LIMITS,
  BIO_PAGE_COLORS,
  EMOJI_SUGGESTIONS,
  LINK_STATE_LABELS,
  bioShareUrl,
  contrastRatio,
  defaultButtonTitle,
  displayShareUrl,
  guessIcon,
  handleFormatError,
  initialsOf,
  insertionIndex,
  isSingleEmoji,
  moveItem,
  normalizeHandle,
  ogSafeText,
} from "../lib/bio.ts"

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
    process.exit(1)
  }
}

const LENGTH_TEXT = "A handle must be 3 to 30 characters."
const CHARACTERS_TEXT = "Use only letters, numbers, hyphens and underscores."
const NO_LETTER_TEXT = "A handle needs at least one letter or number."

const hasLoneSurrogate = (value) => /[\uD800-\uDFFF]/u.test(value)

const graphemeCount = (value) => [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(value)].length

check("limits", () => {
  assert.deepEqual(BIO_LIMITS, { handleMin: 3, handleMax: 30, displayName: 50, bio: 160, buttonTitle: 60, buttons: 30 })
})

check("normalizeHandle strips spaces, one leading @ and lower-cases", () => {
  assert.equal(normalizeHandle(" @Ana "), "ana")
  assert.equal(normalizeHandle("ANA"), "ana")
  assert.equal(normalizeHandle(" ana "), "ana")
  assert.equal(normalizeHandle("@@ana"), "@ana")
  assert.equal(normalizeHandle("ana@"), "ana@")
  assert.equal(normalizeHandle(""), "")
  assert.equal(normalizeHandle("\t@Ana-Horvat_1\n"), "ana-horvat_1")
})

check("normalizeHandle strips what Java's String.strip strips, and nothing else", () => {
  assert.equal(normalizeHandle("\u2003Ana\u3000"), "ana")
  assert.equal(normalizeHandle("\u001Cana\u2029"), "ana")
  assert.equal(normalizeHandle("\u00A0ana"), "\u00A0ana")
  assert.equal(normalizeHandle("ana\u202F"), "ana\u202F")
  assert.equal(handleFormatError(normalizeHandle("\u00A0ana")), CHARACTERS_TEXT)
})

check("handleFormatError gives the backend's three texts in order", () => {
  assert.equal(handleFormatError("a"), LENGTH_TEXT)
  assert.equal(handleFormatError(""), LENGTH_TEXT)
  assert.equal(handleFormatError("a".repeat(31)), LENGTH_TEXT)
  assert.equal(handleFormatError("---"), NO_LETTER_TEXT)
  assert.equal(handleFormatError("_-_"), NO_LETTER_TEXT)
  assert.equal(handleFormatError("ana@"), CHARACTERS_TEXT)
  assert.equal(handleFormatError("\u010Dokolada"), CHARACTERS_TEXT)
  assert.equal(handleFormatError("Ana"), CHARACTERS_TEXT)
  assert.equal(handleFormatError("a b"), CHARACTERS_TEXT)
  assert.equal(handleFormatError("@ana"), CHARACTERS_TEXT)
  assert.equal(handleFormatError("ana-horvat_1"), null)
  assert.equal(handleFormatError("abc"), null)
  assert.equal(handleFormatError("a".repeat(30)), null)
  assert.equal(handleFormatError("123"), null)
})

check("normalize then check, as the backend does", () => {
  assert.equal(handleFormatError(normalizeHandle("@Ana")), null)
  assert.equal(handleFormatError(normalizeHandle("@@ana")), CHARACTERS_TEXT)
})

check("share urls", () => {
  assert.equal(bioShareUrl("ana", "https://hrva.cc"), "https://hrva.cc/@ana")
  assert.equal(displayShareUrl("ana", "https://hrva.cc"), "hrva.cc/@ana")
  assert.equal(bioShareUrl("ana", "http://localhost:8080"), "http://localhost:8080/@ana")
  assert.equal(displayShareUrl("ana", "http://localhost:8080"), "localhost:8080/@ana")
})

check("initialsOf", () => {
  assert.equal(initialsOf("Ana Horvat", "ana"), "AH")
  assert.equal(initialsOf("\u{1F600} ana", null), "A")
  assert.equal(initialsOf("", "karlo"), "K")
  assert.equal(initialsOf("", null), "?")
  assert.equal(initialsOf("  ana   horvat  ", null), "AH")
  assert.equal(initialsOf("Ana Marija Horvat", null), "AM")
  assert.equal(initialsOf("\u0111ur\u0111a \u0161imi\u0107", null), "\u0110\u0160")
  assert.equal(initialsOf("2pac shakur", null), "2S")
  assert.equal(initialsOf("\u{1F600} \u{1F3A8}", "karlo"), "K")
  assert.equal(initialsOf("\u{1F600}", null), "?")
  assert.equal(initialsOf("", ""), "?")
})

check("ogSafeText keeps only what the bundled font can draw", () => {
  assert.equal(ogSafeText("\u0110ur\u0111a \u{1F600} \u0160imi\u0107 \u65E5\u672C"), "\u0110ur\u0111a \u0160imi\u0107")
  assert.equal(ogSafeText("<b>x</b>"), "<b>x</b>")
  assert.equal(ogSafeText("<script>alert(1)</script>"), "<script>alert(1)</script>")
  assert.equal(ogSafeText("\u0424\u043E\u0442\u043E \u0438\u0437 \u0417\u0430\u0433\u0440\u0435\u0431\u0430"), "\u0424\u043E\u0442\u043E \u0438\u0437 \u0417\u0430\u0433\u0440\u0435\u0431\u0430")
  assert.equal(ogSafeText("  Ana \n\t Horvat  "), "Ana Horvat")
  assert.equal(ogSafeText("Ana\nHorvat"), "Ana Horvat")
  assert.equal(ogSafeText("\u{1F600}\u{1F3A8}"), "")
  assert.equal(ogSafeText(""), "")
})

check("ogSafeText drops bidi overrides and combining marks and never leaves half a surrogate", () => {
  const overridden = ogSafeText("Shop\u202Enow")
  assert.equal(overridden, "Shopnow")
  const marked = ogSafeText(`a${"\u0301".repeat(40)}`)
  assert.equal(marked, "a")
  for (const value of ["\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} family", "\u{1F1ED}\u{1F1F7} Zagreb", "a\uD83D", "\uDE00b", "\u{1D400}\u{1D401}\u{1D402}"]) {
    assert.equal(hasLoneSurrogate(ogSafeText(value)), false, value)
  }
  assert.equal(ogSafeText("\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466} family"), "family")
})

check("ogSafeText range edges", () => {
  assert.equal(ogSafeText("\u001F\u0020\u007E\u007F"), "~")
  assert.equal(ogSafeText("x\u00ACx\u00ADx\u00AEx"), "x\u00ACxx\u00AEx")
  assert.equal(ogSafeText("\u0113\u0114\u0115\u0116"), "\u0113\u0116")
  assert.equal(ogSafeText("\u012B\u012C\u012D\u012E"), "\u012B\u012E")
  assert.equal(ogSafeText("\u0137\u0138\u0139"), "\u0137\u0139")
  assert.equal(ogSafeText("\u013E\u013F\u0140\u0141"), "\u013E\u0141")
  assert.equal(ogSafeText("\u0148\u0149\u014A"), "\u0148\u014A")
  assert.equal(ogSafeText("\u014D\u014E\u014F\u0150"), "\u014D\u0150")
  assert.equal(ogSafeText("\u017E\u017F"), "\u017E")
  assert.equal(ogSafeText("\u03FF\u0400\u045F\u0460"), "\u0400\u045F")
})

check("contrastRatio follows the WCAG formula", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21)
  assert.equal(contrastRatio("#fff", "#ffffff"), 1)
  assert.equal(contrastRatio("#1d4ed8", "#ffffff"), contrastRatio("#ffffff", "#1d4ed8"))
  const measured = [
    ["#1d4ed8", "#ffffff", "6.70"],
    ["#93c5fd", "#0b0b0e", "10.90"],
    ["#6d28d9", "#ffffff", "7.10"],
    ["#c4b5fd", "#0b0b0e", "10.65"],
    ["#be185d", "#ffffff", "6.04"],
    ["#f9a8d4", "#0b0b0e", "10.84"],
    ["#b91c1c", "#ffffff", "6.47"],
    ["#fca5a5", "#0b0b0e", "10.36"],
    ["#c2410c", "#ffffff", "5.18"],
    ["#fdba74", "#0b0b0e", "11.65"],
    ["#15803d", "#ffffff", "5.02"],
    ["#86efac", "#0b0b0e", "14.00"],
    ["#0f766e", "#ffffff", "5.47"],
    ["#5eead4", "#0b0b0e", "13.29"],
    ["#334155", "#ffffff", "10.35"],
    ["#cbd5e1", "#0b0b0e", "13.24"],
    ["#0e0e11", "#ffffff", "19.27"],
    ["#5c5c66", "#ffffff", "6.61"],
    ["#f5f5f5", "#0b0b0e", "18.03"],
    ["#a1a1aa", "#0b0b0e", "7.67"],
  ]
  for (const [foreground, background, ratio] of measured) {
    assert.equal(contrastRatio(foreground, background).toFixed(2), ratio, `${foreground} on ${background}`)
  }
})

check("accent palette and page colours", () => {
  assert.deepEqual(BIO_ACCENTS, {
    BLUE: { label: "Blue", light: "#1d4ed8", dark: "#93c5fd" },
    VIOLET: { label: "Violet", light: "#6d28d9", dark: "#c4b5fd" },
    PINK: { label: "Pink", light: "#be185d", dark: "#f9a8d4" },
    RED: { label: "Red", light: "#b91c1c", dark: "#fca5a5" },
    ORANGE: { label: "Orange", light: "#c2410c", dark: "#fdba74" },
    GREEN: { label: "Green", light: "#15803d", dark: "#86efac" },
    TEAL: { label: "Teal", light: "#0f766e", dark: "#5eead4" },
    SLATE: { label: "Slate", light: "#334155", dark: "#cbd5e1" },
  })
  assert.deepEqual(BIO_PAGE_COLORS, {
    light: { bg: "#ffffff", fg: "#0e0e11", muted: "#5c5c66" },
    dark: { bg: "#0b0b0e", fg: "#f5f5f5", muted: "#a1a1aa" },
    onAccentLight: "#ffffff",
    onAccentDark: "#0b0b0e",
  })
})

check("every accent and muted colour reaches 4.5:1", () => {
  for (const [key, accent] of Object.entries(BIO_ACCENTS)) {
    assert.ok(contrastRatio(accent.light, "#ffffff") >= 4.5, `${key} light`)
    assert.ok(contrastRatio(accent.dark, "#0b0b0e") >= 4.5, `${key} dark`)
    assert.ok(contrastRatio(accent.light, BIO_PAGE_COLORS.onAccentLight) >= 4.5, `${key} light on-accent`)
    assert.ok(contrastRatio(accent.dark, BIO_PAGE_COLORS.onAccentDark) >= 4.5, `${key} dark on-accent`)
  }
  assert.ok(contrastRatio(BIO_PAGE_COLORS.light.muted, BIO_PAGE_COLORS.light.bg) >= 4.5)
  assert.ok(contrastRatio(BIO_PAGE_COLORS.dark.muted, BIO_PAGE_COLORS.dark.bg) >= 4.5)
  assert.ok(contrastRatio(BIO_PAGE_COLORS.light.fg, BIO_PAGE_COLORS.light.bg) >= 4.5)
  assert.ok(contrastRatio(BIO_PAGE_COLORS.dark.fg, BIO_PAGE_COLORS.dark.bg) >= 4.5)
})

check("icon labels", () => {
  assert.deepEqual(BIO_ICON_LABELS, {
    WEBSITE: "Website",
    EMAIL: "Email",
    INSTAGRAM: "Instagram",
    TIKTOK: "TikTok",
    YOUTUBE: "YouTube",
    X: "X",
    FACEBOOK: "Facebook",
    LINKEDIN: "LinkedIn",
    GITHUB: "GitHub",
    SPOTIFY: "Spotify",
    WHATSAPP: "WhatsApp",
    TELEGRAM: "Telegram",
  })
})

check("guessIcon", () => {
  assert.equal(guessIcon("www.instagram.com"), "INSTAGRAM")
  assert.equal(guessIcon("youtu.be"), "YOUTUBE")
  assert.equal(guessIcon("example.com"), "WEBSITE")
  const domains = [
    ["instagram.com", "INSTAGRAM"],
    ["tiktok.com", "TIKTOK"],
    ["youtube.com", "YOUTUBE"],
    ["youtu.be", "YOUTUBE"],
    ["x.com", "X"],
    ["twitter.com", "X"],
    ["facebook.com", "FACEBOOK"],
    ["fb.com", "FACEBOOK"],
    ["fb.me", "FACEBOOK"],
    ["linkedin.com", "LINKEDIN"],
    ["lnkd.in", "LINKEDIN"],
    ["github.com", "GITHUB"],
    ["spotify.com", "SPOTIFY"],
    ["spotify.link", "SPOTIFY"],
    ["wa.me", "WHATSAPP"],
    ["whatsapp.com", "WHATSAPP"],
    ["t.me", "TELEGRAM"],
    ["telegram.me", "TELEGRAM"],
    ["telegram.org", "TELEGRAM"],
  ]
  for (const [domain, icon] of domains) {
    assert.equal(guessIcon(domain), icon, domain)
    assert.equal(guessIcon(`sub.${domain}`), icon, `sub.${domain}`)
  }
  assert.equal(guessIcon("INSTAGRAM.COM"), "INSTAGRAM")
  assert.equal(guessIcon("notinstagram.com"), "WEBSITE")
  assert.equal(guessIcon("instagram.com.evil.example"), "WEBSITE")
  assert.equal(guessIcon("dropbox.com"), "WEBSITE")
  assert.equal(guessIcon("chat.me"), "WEBSITE")
  assert.equal(guessIcon(""), "WEBSITE")
})

check("defaultButtonTitle", () => {
  assert.equal(defaultButtonTitle("open.spotify.com"), "Spotify")
  assert.equal(defaultButtonTitle("www.karlo.cc"), "karlo.cc")
  assert.equal(defaultButtonTitle("karlo.cc"), "karlo.cc")
  assert.equal(defaultButtonTitle("m.youtube.com"), "YouTube")
  assert.equal(defaultButtonTitle("x.com"), "X")
  const long = `${"a".repeat(70)}.example`
  assert.equal(defaultButtonTitle(long), "a".repeat(60))
  const straddling = `${"a".repeat(59)}\u{1F600}.example`
  const title = defaultButtonTitle(straddling)
  assert.ok(title.length <= BIO_LIMITS.buttonTitle, title)
  assert.equal(hasLoneSurrogate(title), false)
  assert.equal(title, "a".repeat(59))
})

check("moveItem never mutates", () => {
  const items = [1, 2, 3]
  assert.deepEqual(moveItem(items, 0, 2), [2, 3, 1])
  assert.deepEqual(items, [1, 2, 3])
  assert.deepEqual(moveItem(items, 2, 0), [3, 1, 2])
  assert.deepEqual(moveItem(items, 1, 1), [1, 2, 3])
  assert.notEqual(moveItem(items, 1, 1), items)
  assert.deepEqual(moveItem(items, 5, 0), [1, 2, 3])
  assert.deepEqual(moveItem(items, 0, 5), [1, 2, 3])
  assert.deepEqual(items, [1, 2, 3])
})

check("insertionIndex counts the midpoints above y", () => {
  assert.equal(insertionIndex([10, 30, 50], 35), 2)
  assert.equal(insertionIndex([10, 30, 50], 5), 0)
  assert.equal(insertionIndex([10, 30, 50], 60), 3)
  assert.equal(insertionIndex([], 10), 0)
})

check("isSingleEmoji", () => {
  assert.equal(isSingleEmoji("\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}"), true)
  assert.equal(isSingleEmoji("\u{1F1ED}\u{1F1F7}"), true)
  assert.equal(isSingleEmoji("\u{1F4F8}"), true)
  assert.equal(isSingleEmoji("\u2764\uFE0F"), true)
  assert.equal(isSingleEmoji("\u{1F4F8}\u{1F4F8}"), false)
  assert.equal(isSingleEmoji("#"), false)
  assert.equal(isSingleEmoji("#\uFE0F\u20E3"), false)
  assert.equal(isSingleEmoji("a"), false)
  assert.equal(isSingleEmoji("1"), false)
  assert.equal(isSingleEmoji(""), false)
  assert.equal(isSingleEmoji("\u00E9"), false)
  assert.equal(isSingleEmoji("\u{1F4F8} "), false)
  const longFamily = "\u{1F468}\u{1F3FB}\u200D\u{1F469}\u{1F3FB}\u200D\u{1F467}\u{1F3FB}\u200D\u{1F466}\u{1F3FB}"
  assert.equal(graphemeCount(longFamily), 1)
  assert.ok(longFamily.length > 16)
  assert.equal(isSingleEmoji(longFamily), false)
})

check("emoji suggestions are each one emoji", () => {
  assert.deepEqual([...EMOJI_SUGGESTIONS], ["\u2728", "\u{1F3A8}", "\u{1F4F8}", "\u{1F3B5}", "\u{1F3AE}", "\u{1F4BC}", "\u{1F33F}", "\u2615", "\u{1F680}", "\u{1F4A1}", "\u2764\uFE0F", "\u{1F43E}"])
  for (const emoji of EMOJI_SUGGESTIONS) assert.equal(isSingleEmoji(emoji), true, emoji)
})

check("link state labels", () => {
  const stopped = "Not shown on your page until the link works again."
  assert.deepEqual(LINK_STATE_LABELS, {
    IN_REVIEW: { badge: "Waiting for review", hint: "Not shown on your page until an admin has checked the link." },
    DEACTIVATED: { badge: "Link turned off", hint: stopped },
    EXPIRED: { badge: "Link expired", hint: stopped },
    LIMIT_REACHED: { badge: "Visit limit reached", hint: stopped },
    BLOCKED: { badge: "Link blocked", hint: "Not shown on your page. Blocked links can't be shown." },
  })
})

console.log("ok")
