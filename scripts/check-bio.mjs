import assert from "node:assert/strict"
import {
  AVATAR_EMOJI_REQUIRED,
  BIO_ACCENTS,
  BIO_ICON_LABELS,
  BIO_LIMITS,
  BIO_PAGE_COLORS,
  EMOJI_SUGGESTIONS,
  LINK_STATE_LABELS,
  bioDraftOf,
  bioSaveFieldErrors,
  bioShareUrl,
  bioUpdateOf,
  contrastRatio,
  defaultButtonTitle,
  displayShareUrl,
  guessIcon,
  handleFormatError,
  initialsOf,
  insertionIndex,
  isBioIcon,
  isSingleEmoji,
  moveItem,
  normalizeHandle,
  ogInitials,
  ogSafeText,
  rebaseBioDraft,
  sameBioDraft,
} from "../lib/bio.ts"

const check = (name, run) => {
  try {
    run()
  } catch (error) {
    console.error(`FAIL ${name}\n  ${String(error.message).split("\n").join("\n  ")}`)
    process.exit(1)
  }
}

const text = (...parts) => parts.map((part) => (typeof part === "number" ? String.fromCodePoint(part) : part)).join("")

const ZERO_WIDTH_JOINER = text(0x200d)
const VARIATION_SELECTOR_16 = text(0xfe0f)
const GRINNING_FACE = text(0x1f600)
const ARTIST_PALETTE = text(0x1f3a8)
const CAMERA_WITH_FLASH = text(0x1f4f8)
const FAMILY = text(0x1f468, ZERO_WIDTH_JOINER, 0x1f469, ZERO_WIDTH_JOINER, 0x1f467, ZERO_WIDTH_JOINER, 0x1f466)
const CROATIAN_FLAG = text(0x1f1ed, 0x1f1f7)

const LENGTH_TEXT = "A handle must be 3 to 30 characters."
const CHARACTERS_TEXT = "Use only letters, numbers, hyphens and underscores."
const NO_LETTER_TEXT = "A handle needs at least one letter or number."

const hasLoneSurrogate = (value) => /\p{Cs}/u.test(value)

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
  assert.equal(normalizeHandle(text(0x2003, "Ana", 0x3000)), "ana")
  assert.equal(normalizeHandle(text(0x001c, "ana", 0x2029)), "ana")
  assert.equal(normalizeHandle(text(0x00a0, "ana")), text(0x00a0, "ana"))
  assert.equal(normalizeHandle(text("ana", 0x202f)), text("ana", 0x202f))
  assert.equal(handleFormatError(normalizeHandle(text(0x00a0, "ana"))), CHARACTERS_TEXT)
})

check("handleFormatError gives the backend's three texts in order", () => {
  assert.equal(handleFormatError("a"), LENGTH_TEXT)
  assert.equal(handleFormatError(""), LENGTH_TEXT)
  assert.equal(handleFormatError("a".repeat(31)), LENGTH_TEXT)
  assert.equal(handleFormatError("---"), NO_LETTER_TEXT)
  assert.equal(handleFormatError("_-_"), NO_LETTER_TEXT)
  assert.equal(handleFormatError("ana@"), CHARACTERS_TEXT)
  assert.equal(handleFormatError(text(0x010d, "okolada")), CHARACTERS_TEXT)
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
  assert.equal(initialsOf(`${GRINNING_FACE} ana`, null), "A")
  assert.equal(initialsOf("", "karlo"), "K")
  assert.equal(initialsOf("", "_ana"), "A")
  assert.equal(initialsOf("", "-9lives"), "9")
  assert.equal(initialsOf("", null), "?")
  assert.equal(initialsOf("  ana   horvat  ", null), "AH")
  assert.equal(initialsOf("Ana Marija Horvat", null), "AM")
  assert.equal(initialsOf(text(0x0111, "ur", 0x0111, "a ", 0x0161, "imi", 0x0107), null), text(0x0110, 0x0160))
  assert.equal(initialsOf("2pac shakur", null), "2S")
  assert.equal(initialsOf(`${GRINNING_FACE} ${ARTIST_PALETTE}`, "karlo"), "K")
  assert.equal(initialsOf(GRINNING_FACE, null), "?")
  assert.equal(initialsOf("", ""), "?")
})

check("ogSafeText keeps only what the bundled font can draw", () => {
  const durda = text(0x0110, "ur", 0x0111, "a")
  const simic = text(0x0160, "imi", 0x0107)
  assert.equal(ogSafeText(`${durda} ${GRINNING_FACE} ${simic} ${text(0x65e5, 0x672c)}`), `${durda} ${simic}`)
  assert.equal(ogSafeText("<b>x</b>"), "<b>x</b>")
  assert.equal(ogSafeText("<script>alert(1)</script>"), "<script>alert(1)</script>")
  const cyrillic = text(0x0424, 0x043e, 0x0442, 0x043e, " ", 0x0438, 0x0437, " ", 0x0417, 0x0430, 0x0433, 0x0440, 0x0435, 0x0431, 0x0430)
  assert.equal(ogSafeText(cyrillic), cyrillic)
  assert.equal(ogSafeText("  Ana \n\t Horvat  "), "Ana Horvat")
  assert.equal(ogSafeText("Ana\nHorvat"), "Ana Horvat")
  assert.equal(ogSafeText(`${GRINNING_FACE}${ARTIST_PALETTE}`), "")
  assert.equal(ogSafeText(""), "")
})

check("ogSafeText drops bidi overrides and combining marks and never leaves half a surrogate", () => {
  const overridden = ogSafeText(text("Shop", 0x202e, "now"))
  assert.equal(overridden, "Shopnow")
  const marked = ogSafeText(`a${text(0x0301).repeat(40)}`)
  assert.equal(marked, "a")
  for (const value of [`${FAMILY} family`, `${CROATIAN_FLAG} Zagreb`, text("a", 0xd83d), text(0xde00, "b"), text(0x1d400, 0x1d401, 0x1d402)]) {
    assert.equal(hasLoneSurrogate(ogSafeText(value)), false, value)
  }
  assert.equal(ogSafeText(`${FAMILY} family`), "family")
})

check("ogSafeText range edges", () => {
  assert.equal(ogSafeText(text(0x001f, 0x0020, 0x007e, 0x007f)), "~")
  assert.equal(ogSafeText(text("x", 0x00ac, "x", 0x00ad, "x", 0x00ae, "x")), text("x", 0x00ac, "xx", 0x00ae, "x"))
  assert.equal(ogSafeText(text(0x0113, 0x0114, 0x0115, 0x0116)), text(0x0113, 0x0116))
  assert.equal(ogSafeText(text(0x012b, 0x012c, 0x012d, 0x012e)), text(0x012b, 0x012e))
  assert.equal(ogSafeText(text(0x0137, 0x0138, 0x0139)), text(0x0137, 0x0139))
  assert.equal(ogSafeText(text(0x013e, 0x013f, 0x0140, 0x0141)), text(0x013e, 0x0141))
  assert.equal(ogSafeText(text(0x0148, 0x0149, 0x014a)), text(0x0148, 0x014a))
  assert.equal(ogSafeText(text(0x014d, 0x014e, 0x014f, 0x0150)), text(0x014d, 0x0150))
  assert.equal(ogSafeText(text(0x017e, 0x017f)), text(0x017e))
  assert.equal(ogSafeText(text(0x03ff, 0x0400, 0x045f, 0x0460)), text(0x0400, 0x045f))
})

check("ogInitials re-filters the upper-cased initials through the font's letters", () => {
  const MICRO_SIGN = text(0x00b5)
  const GREEK_CAPITAL_MU = text(0x039c)
  assert.equal(initialsOf(`${MICRO_SIGN}abc`, null), GREEK_CAPITAL_MU)
  assert.equal(ogSafeText(MICRO_SIGN), MICRO_SIGN)
  assert.equal(ogInitials(`${MICRO_SIGN}abc`, "ana"), "A")
  assert.equal(ogInitials(`${MICRO_SIGN} Studio`, "ana"), "S")
  assert.equal(ogInitials(MICRO_SIGN, "ana"), "A")
  for (const name of [`${MICRO_SIGN}abc`, `${MICRO_SIGN} Studio`, MICRO_SIGN, `${MICRO_SIGN}${MICRO_SIGN} ${MICRO_SIGN}x`]) {
    assert.equal(ogInitials(name, "ana").includes(GREEK_CAPITAL_MU), false, name)
  }
  assert.equal(ogInitials("Ana Horvat", "ana"), "AH")
  assert.equal(ogInitials(text(0x0111, "ur", 0x0111, "a ", 0x0161, "imi", 0x0107), "ana"), text(0x0110, 0x0160))
  assert.equal(ogInitials(`${GRINNING_FACE} ${text(0x65e5, 0x672c)}`, "_karlo"), "K")
  assert.equal(ogInitials("", "9lives"), "9")
  assert.equal(ogInitials(text(0x0391, 0x03bd, 0x03b1), "ana"), "A")
  assert.equal(ogInitials(text(0x00df, "tefan"), "ana"), "SS")
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

check("isBioIcon accepts only the icons the FE can draw", () => {
  for (const icon of Object.keys(BIO_ICON_LABELS)) assert.equal(isBioIcon(icon), true, icon)
  for (const value of ["THREADS", "website", "", "toString", "constructor", "__proto__", "hasOwnProperty", null, undefined, 1]) {
    assert.equal(isBioIcon(value), false, String(value))
  }
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
  const straddling = `${"a".repeat(59)}${GRINNING_FACE}.example`
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
  assert.equal(isSingleEmoji(FAMILY), true)
  assert.equal(isSingleEmoji(CROATIAN_FLAG), true)
  assert.equal(isSingleEmoji(CAMERA_WITH_FLASH), true)
  assert.equal(isSingleEmoji(text(0x2764, VARIATION_SELECTOR_16)), true)
  assert.equal(isSingleEmoji(CAMERA_WITH_FLASH.repeat(2)), false)
  assert.equal(isSingleEmoji("#"), false)
  assert.equal(isSingleEmoji(text("#", VARIATION_SELECTOR_16, 0x20e3)), false)
  assert.equal(isSingleEmoji("a"), false)
  assert.equal(isSingleEmoji("1"), false)
  assert.equal(isSingleEmoji(""), false)
  assert.equal(isSingleEmoji(text(0x00e9)), false)
  assert.equal(isSingleEmoji(`${CAMERA_WITH_FLASH} `), false)
  assert.equal(isSingleEmoji(text(0x1f02c)), false)
  assert.equal(isSingleEmoji(text(0x1f094)), false)
  assert.equal(isSingleEmoji(text(0x1f3fb)), true)
  assert.equal(isSingleEmoji(text(0x1f4f8, 0x200d)), false)
  assert.equal(isSingleEmoji(text(0x200d, 0x1f4f8)), false)
  assert.equal(isSingleEmoji(text(0x1f4f8, 0x200c)), false)
  assert.equal(isSingleEmoji(text(0x200c, 0x1f4f8)), false)
  const longFamily = text(0x1f468, 0x1f3fb, ZERO_WIDTH_JOINER, 0x1f469, 0x1f3fb, ZERO_WIDTH_JOINER, 0x1f467, 0x1f3fb, ZERO_WIDTH_JOINER, 0x1f466, 0x1f3fb)
  assert.equal(graphemeCount(longFamily), 1)
  assert.ok(longFamily.length > 16)
  assert.equal(isSingleEmoji(longFamily), false)
})

check("emoji suggestions are each one emoji", () => {
  assert.deepEqual([...EMOJI_SUGGESTIONS], [text(0x2728), text(0x1f3a8), text(0x1f4f8), text(0x1f3b5), text(0x1f3ae), text(0x1f4bc), text(0x1f33f), text(0x2615), text(0x1f680), text(0x1f4a1), text(0x2764, VARIATION_SELECTOR_16), text(0x1f43e)])
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

const samplePage = (overrides = {}) => ({
  id: 1,
  handle: "ana",
  displayName: "Ana",
  bio: "Hi",
  avatarKind: "INITIALS",
  avatarEmoji: null,
  accent: "BLUE",
  theme: "AUTO",
  indexable: false,
  hidden: false,
  hiddenReason: null,
  handleRevokedReason: null,
  buttons: [
    { id: 10, urlId: 5, shortUrl: "ig", destinationHost: "instagram.com", title: "Instagram", icon: "INSTAGRAM", visible: true, linkState: "LIVE", shownOnPage: true },
    { id: 11, urlId: 7, shortUrl: "blog", destinationHost: "karlo.cc", title: "Blog", icon: null, visible: false, linkState: "DEACTIVATED", shownOnPage: false },
  ],
  createdAt: "2026-10-26T10:00:00",
  updatedAt: "2026-10-26T10:00:00",
  ...overrides,
})

check("bioUpdateOf sends every button in order and the emoji only for an emoji avatar", () => {
  const draft = bioDraftOf(samplePage())
  assert.equal(draft.avatarEmoji, "")
  assert.deepEqual(bioUpdateOf(draft), {
    displayName: "Ana",
    bio: "Hi",
    avatarKind: "INITIALS",
    avatarEmoji: null,
    accent: "BLUE",
    theme: "AUTO",
    indexable: false,
    buttons: [
      { urlId: 5, title: "Instagram", icon: "INSTAGRAM", visible: true },
      { urlId: 7, title: "Blog", icon: null, visible: false },
    ],
  })
  assert.equal(bioUpdateOf({ ...draft, avatarKind: "EMOJI", avatarEmoji: ` ${CAMERA_WITH_FLASH} ` }).avatarEmoji, CAMERA_WITH_FLASH)
  assert.equal(bioUpdateOf({ ...draft, avatarKind: "INITIALS", avatarEmoji: CAMERA_WITH_FLASH }).avatarEmoji, null)
  assert.deepEqual(bioUpdateOf({ ...draft, buttons: [] }).buttons, [])
})

check("sameBioDraft: a fresh draft is never dirty, and only real edits count", () => {
  const page = samplePage()
  const draft = bioDraftOf(page)
  assert.equal(sameBioDraft(bioDraftOf(page), bioDraftOf(page)), true)
  const emojiPage = samplePage({ avatarKind: "EMOJI", avatarEmoji: CAMERA_WITH_FLASH })
  assert.equal(sameBioDraft(bioDraftOf(emojiPage), bioDraftOf(emojiPage)), true)
  assert.equal(sameBioDraft({ ...draft, avatarEmoji: CAMERA_WITH_FLASH }, draft), true)
  assert.equal(sameBioDraft({ ...draft, avatarKind: "EMOJI", avatarEmoji: CAMERA_WITH_FLASH }, draft), false)
  assert.equal(sameBioDraft({ ...draft, displayName: "Ana " }, draft), false)
  assert.equal(sameBioDraft({ ...draft, bio: "" }, draft), false)
  assert.equal(sameBioDraft({ ...draft, accent: "PINK" }, draft), false)
  assert.equal(sameBioDraft({ ...draft, theme: "DARK" }, draft), false)
  assert.equal(sameBioDraft({ ...draft, indexable: true }, draft), false)
  assert.equal(sameBioDraft({ ...draft, buttons: [...draft.buttons].reverse() }, draft), false)
  assert.equal(sameBioDraft({ ...draft, buttons: draft.buttons.map((button) => ({ ...button, linkState: "BLOCKED", shownOnPage: false })) }, draft), true)
})

check("rebaseBioDraft keeps the owner's edits and takes the rest from the newer page", () => {
  const before = samplePage()
  const after = samplePage({
    handle: "ana-2",
    bio: "New bio",
    updatedAt: "2026-10-26T10:05:00",
    buttons: before.buttons.map((button) => (button.urlId === 7 ? { ...button, linkState: "LIVE" } : button)),
  })
  const edited = { ...bioDraftOf(before), displayName: "Ana Horvat", theme: "DARK" }
  const rebased = rebaseBioDraft(edited, before, after)
  assert.equal(rebased.displayName, "Ana Horvat")
  assert.equal(rebased.theme, "DARK")
  assert.equal(rebased.bio, "New bio")
  assert.deepEqual(rebased.buttons, after.buttons)
  assert.deepEqual(rebaseBioDraft(bioDraftOf(before), before, after), bioDraftOf(after))
  const reordered = { ...bioDraftOf(before), buttons: [...before.buttons].reverse() }
  assert.deepEqual(rebaseBioDraft(reordered, before, after).buttons, reordered.buttons)
})

check("bioSaveFieldErrors maps the backend's profile texts to their fields, and nothing else", () => {
  assert.equal(AVATAR_EMOJI_REQUIRED, "Pick one emoji for the avatar.")
  assert.deepEqual(bioSaveFieldErrors("Name must be 50 characters or fewer"), { displayName: "Name must be 50 characters or fewer" })
  assert.deepEqual(bioSaveFieldErrors("Bio must be 160 characters or fewer"), { bio: "Bio must be 160 characters or fewer" })
  assert.deepEqual(bioSaveFieldErrors("Bio must be 160 characters or fewer. Name must be 50 characters or fewer"), {
    bio: "Bio must be 160 characters or fewer",
    displayName: "Name must be 50 characters or fewer",
  })
  assert.deepEqual(bioSaveFieldErrors("Pick one emoji for the avatar."), { avatarEmoji: "Pick one emoji for the avatar." })
  assert.equal(bioSaveFieldErrors("This page changed. Reload and try again."), null)
  assert.equal(bioSaveFieldErrors("Name must be 50 characters or fewer. Pick a link"), null)
  assert.equal(bioSaveFieldErrors("Only working links can be added. /abc isn't working right now."), null)
  assert.equal(bioSaveFieldErrors("You've saved your bio page a lot in a short time. Try again in a few minutes."), null)
  assert.equal(bioSaveFieldErrors("toString"), null)
  assert.equal(bioSaveFieldErrors(""), null)
})

console.log("ok")
