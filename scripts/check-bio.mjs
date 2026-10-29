import assert from "node:assert/strict"
import "./resolve-ts-imports.mjs"

const {
  AVATAR_EMOJI_REQUIRED,
  BIO_ACCENTS,
  BIO_LINK_DELETED,
  BIO_PAGE_CHANGED,
  BIO_ICON_LABELS,
  BIO_LIMITS,
  BIO_PAGE_COLORS,
  EMOJI_SUGGESTIONS,
  LINK_STATE_LABELS,
  bioConflictText,
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
  isOlderBioPage,
  isLinkNotWorkingError,
  isSingleEmoji,
  linkStateHint,
  moveItem,
  normalizeHandle,
  ogInitials,
  ogSafeText,
  rebaseBioDraft,
  rebaseSavedBioDraft,
  sameBioDraft,
  suggestHandle,
  BUTTON_TITLE_REQUIRED,
  BUTTON_TITLE_TOO_LONG,
  bioButtonLabel,
  bioButtonTitleErrors,
  bioSaveErrors,
  buttonTitleError,
  cleanBioText,
  cleanBioLines,
  bioOnOneLine,
  destinationHostOf,
  linkStateLabel,
  newBioButton,
  freshBioPagePath,
} = await import("../lib/bio.ts")

const { BIO_CACHE_CONTROL, BIO_CACHE_STATUS_HEADER, bioCacheKey, isStorableBioResponse, withBioEdgeCache } = await import("../lib/bio-edge-cache.ts")

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
  assert.deepEqual(LINK_STATE_LABELS, {
    IN_REVIEW: { badge: "Waiting for review", hint: "Not shown on your page until an admin has checked the link." },
    DEACTIVATED: { badge: "Link turned off", hint: "Turn {alias} back on on the URLs page to show it again." },
    EXPIRED: { badge: "Link expired", hint: "Give {alias} a later expiry date on the URLs page to show it again." },
    LIMIT_REACHED: { badge: "Visit limit reached", hint: "Raise the visit limit of {alias} on the URLs page to show it again." },
    BLOCKED: { badge: "Link blocked", hint: "Blocked links can't be shown. Remove this button." },
  })
})

check("link state hints name the link and say how to fix it", () => {
  assert.equal(linkStateHint("DEACTIVATED", "turnoff"), "Turn /turnoff back on on the URLs page to show it again.")
  assert.equal(linkStateHint("EXPIRED", "willexpire"), "Give /willexpire a later expiry date on the URLs page to show it again.")
  assert.equal(linkStateHint("LIMIT_REACHED", "limit1"), "Raise the visit limit of /limit1 on the URLs page to show it again.")
  assert.equal(linkStateHint("BLOCKED", "bad"), "Blocked links can't be shown. Remove this button.")
  assert.equal(linkStateHint("IN_REVIEW", "wa"), "Not shown on your page until an admin has checked the link.")
  assert.equal(linkStateHint("LIVE", "ok"), null)
  assert.equal(linkStateHint("toString", "ok"), null)
})

check("isLinkNotWorkingError matches only the dead-link refusal", () => {
  assert.equal(isLinkNotWorkingError("Only working links can be added. /blog isn't working right now."), true)
  assert.equal(isLinkNotWorkingError("Each link can be on your page only once."), false)
  assert.equal(isLinkNotWorkingError(""), false)
})

check("suggestHandle offers a usable handle for dots, spaces and accents", () => {
  assert.equal(suggestHandle("Ana Horvat"), "ana-horvat")
  assert.equal(suggestHandle("ana.horvat"), "ana-horvat")
  assert.equal(suggestHandle("@Ana.Horvat"), "ana-horvat")
  assert.equal(suggestHandle("  ana . horvat  "), "ana-horvat")
  assert.equal(suggestHandle(text(0x160, "imi", 0x107, " Ana")), "simic-ana")
  assert.equal(suggestHandle("ana!horvat"), "anahorvat")
  assert.equal(suggestHandle(".ana."), "ana")
  assert.equal(suggestHandle("ana-horvat"), null)
  assert.equal(suggestHandle("a.b"), "a-b")
  assert.equal(suggestHandle("a.."), null)
  assert.equal(suggestHandle("..."), null)
  assert.equal(suggestHandle(""), null)
  assert.equal(suggestHandle("x".repeat(31)), null)
  for (const raw of ["Ana Horvat", "ana.horvat", text(0x160, "imi", 0x107, " Ana"), "ana!horvat"]) assert.equal(handleFormatError(suggestHandle(raw)), null, raw)
})

check("suggestHandle spells out letters that have no accent to strip, so Đurđa becomes durda, not ura", () => {
  const durda = text(0x0110, "ur", 0x0111, "a")
  assert.equal(suggestHandle(durda), "durda")
  assert.equal(suggestHandle(text(0x0111, "ur", 0x0111, "a")), "durda")
  assert.equal(suggestHandle(text(0x0110, "UR", 0x0110, "A")), "durda")
  assert.equal(suggestHandle(text("Stra", 0x00df, "e")), "strasse")
  assert.equal(suggestHandle(text("STRA", 0x1e9e, "E")), "strasse")
  assert.equal(suggestHandle(text(0x0141, 0x00f3, "d", 0x017a)), "lodz")
  assert.equal(suggestHandle(text("Pawe", 0x0142)), "pawel")
  assert.equal(suggestHandle(text("S", 0x00f8, "ren")), "soren")
  assert.equal(suggestHandle(text(0x00d8, "ster")), "oster")
  assert.equal(suggestHandle(text("Ana ", 0x0110, "ur", 0x0111, "i", 0x0107)), "ana-durdic")
  for (const raw of [durda, text("Stra", 0x00df, "e"), text(0x0141, 0x00f3, "d", 0x017a), text("S", 0x00f8, "ren")]) {
    assert.equal(handleFormatError(suggestHandle(raw)), null, raw)
  }
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
  assert.deepEqual(
    rebaseBioDraft(reordered, before, after).buttons.map((button) => [button.urlId, button.title, button.linkState]),
    [[7, "Blog", "LIVE"], [5, "Instagram", "LIVE"]],
  )
})

const NEW_BUTTON = { id: 0, urlId: 42, shortUrl: "x", destinationHost: "x.com", title: "X", icon: "X", visible: true, linkState: "LIVE", shownOnPage: true }

check("rebaseBioDraft merges newer link states into touched buttons and keeps the owner's order and edits", () => {
  const before = samplePage()
  const after = samplePage({
    updatedAt: "2026-10-26T10:05:00",
    buttons: before.buttons.map((button) =>
      button.urlId === 7 ? { ...button, linkState: "LIVE", shownOnPage: false } : { ...button, linkState: "BLOCKED", shownOnPage: false },
    ),
  })
  const edited = { ...bioDraftOf(before), buttons: [{ ...before.buttons[1], title: "My blog", visible: true }, before.buttons[0], NEW_BUTTON] }
  const rebased = rebaseBioDraft(edited, before, after)
  assert.deepEqual(
    rebased.buttons.map((button) => [button.urlId, button.title, button.icon, button.visible, button.linkState, button.shownOnPage]),
    [
      [7, "My blog", null, true, "LIVE", true],
      [5, "Instagram", "INSTAGRAM", true, "BLOCKED", false],
      [42, "X", "X", true, "LIVE", true],
    ],
  )
  assert.deepEqual(bioUpdateOf(rebased).buttons, bioUpdateOf(edited).buttons)
})

check("bioConflictText says a deleted link's button was removed instead of asking for a reload", () => {
  assert.equal(BIO_PAGE_CHANGED, "This page changed. Reload and try again.")
  assert.equal(bioConflictText(BIO_PAGE_CHANGED), BIO_LINK_DELETED)
  assert.equal(BIO_LINK_DELETED, "A link on your page was deleted, so its button was removed. Check your page and save again.")
  const outdated = "Your bio page changed in another tab or window. We loaded the latest version; check your changes and save again."
  assert.equal(bioConflictText(outdated), outdated)
  assert.equal(bioConflictText("This page changed."), "This page changed.")
})

check("isOlderBioPage spots a page from before the one on screen, so a late read can't undo a save", () => {
  const before = samplePage({ updatedAt: "2026-10-26T10:00:00.123456" })
  const saved = samplePage({ updatedAt: "2026-10-26T10:05:00.5" })
  assert.equal(isOlderBioPage(before, saved), true)
  assert.equal(isOlderBioPage(saved, before), false)
  assert.equal(isOlderBioPage(saved, samplePage({ updatedAt: "2026-10-26T10:05:00.5" })), false)
  assert.equal(isOlderBioPage(samplePage({ updatedAt: "not a date" }), saved), false)

  const viewerZone = process.env.TZ
  process.env.TZ = "Europe/Zagreb"
  try {
    const beforeTheGap = samplePage({ updatedAt: "2026-03-29T02:30:00" })
    const afterTheGap = samplePage({ updatedAt: "2026-03-29T03:00:00" })
    assert.equal(isOlderBioPage(beforeTheGap, afterTheGap), true, "server times are UTC, so a viewer's DST gap doesn't reorder them")
    assert.equal(isOlderBioPage(afterTheGap, beforeTheGap), false)
  } finally {
    if (viewerZone === undefined) delete process.env.TZ
    else process.env.TZ = viewerZone
  }

  const sent = { ...bioDraftOf(before), displayName: "Ana X" }
  const savedPage = samplePage({ displayName: "Ana X", updatedAt: "2026-10-26T10:05:00.5" })
  const correctedDuringSave = { ...sent, displayName: before.displayName }
  const afterSave = rebaseSavedBioDraft(correctedDuringSave, sent, savedPage)
  assert.equal(afterSave.displayName, before.displayName)
  assert.equal(rebaseBioDraft(afterSave, savedPage, { ...savedPage }).displayName, before.displayName)
  assert.equal(sameBioDraft(afterSave, bioDraftOf(savedPage)), false)
})

check("rebaseBioDraft drops touched buttons whose links were deleted and keeps the buttons added here", () => {
  const before = samplePage()
  const after = samplePage({ updatedAt: "2026-10-26T10:05:00", buttons: before.buttons.filter((button) => button.urlId !== 7) })
  const edited = { ...bioDraftOf(before), buttons: [before.buttons[1], { ...before.buttons[0], title: "Insta" }, NEW_BUTTON] }
  assert.deepEqual(
    rebaseBioDraft(edited, before, after).buttons.map((button) => [button.urlId, button.id, button.title]),
    [[5, 10, "Insta"], [42, 0, "X"]],
  )
  assert.deepEqual(rebaseBioDraft(bioDraftOf(before), before, after).buttons, after.buttons)

  const sent = { ...bioDraftOf(before), buttons: [...before.buttons, NEW_BUTTON] }
  const saved = samplePage({ buttons: [before.buttons[0], { ...NEW_BUTTON, id: 12 }] })
  const typedDuringSave = { ...sent, buttons: [{ ...before.buttons[0], title: "Insta" }, before.buttons[1], NEW_BUTTON, { ...NEW_BUTTON, urlId: 43, shortUrl: "y" }] }
  assert.deepEqual(
    rebaseSavedBioDraft(typedDuringSave, sent, saved).buttons.map((button) => [button.urlId, button.id, button.title]),
    [[5, 10, "Insta"], [42, 12, "X"], [43, 0, "X"]],
  )
})

check("rebaseSavedBioDraft takes the server's cleaned values and keeps edits typed during the save", () => {
  const page = samplePage()
  const sent = { ...bioDraftOf(page), displayName: "Ana  Horvat", bio: "Photos   and films", avatarKind: "EMOJI", avatarEmoji: ` ${CAMERA_WITH_FLASH} ` }
  const saved = samplePage({
    displayName: "Ana Horvat",
    bio: "Photos and films",
    avatarKind: "EMOJI",
    avatarEmoji: CAMERA_WITH_FLASH,
    updatedAt: "2026-10-26T10:05:00",
  })
  assert.deepEqual(rebaseSavedBioDraft(sent, sent, saved), bioDraftOf(saved))
  assert.equal(sameBioDraft(rebaseSavedBioDraft(sent, sent, saved), bioDraftOf(saved)), true)
  const typedDuringSave = { ...sent, displayName: "Ana Horvat Jr", theme: "DARK" }
  const rebased = rebaseSavedBioDraft(typedDuringSave, sent, saved)
  assert.equal(rebased.displayName, "Ana Horvat Jr")
  assert.equal(rebased.theme, "DARK")
  assert.equal(rebased.bio, "Photos and films")
  assert.equal(rebased.avatarEmoji, CAMERA_WITH_FLASH)
  assert.equal(sameBioDraft(rebased, bioDraftOf(saved)), false)

  const sentWithNew = { ...bioDraftOf(page), buttons: [...page.buttons, NEW_BUTTON] }
  const savedWithNew = samplePage({ buttons: [...page.buttons, { ...NEW_BUTTON, id: 12, linkState: "IN_REVIEW", shownOnPage: false }] })
  assert.deepEqual(rebaseSavedBioDraft(sentWithNew, sentWithNew, savedWithNew).buttons, savedWithNew.buttons)
  const addedDuringSave = { ...sentWithNew, buttons: [...sentWithNew.buttons, { ...NEW_BUTTON, urlId: 43, shortUrl: "y" }] }
  assert.deepEqual(
    rebaseSavedBioDraft(addedDuringSave, sentWithNew, savedWithNew).buttons.map((button) => [button.urlId, button.id, button.linkState]),
    [[5, 10, "LIVE"], [7, 11, "DEACTIVATED"], [42, 12, "IN_REVIEW"], [43, 0, "LIVE"]],
  )
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

const ACUTE = 0x0301
const marksOf = (value) => [...value].filter((character) => /\p{M}/u.test(character)).length

check("cleanBioText collapses whitespace and keeps text as typed", () => {
  assert.equal(cleanBioText("  Ana   Horvat "), "Ana Horvat")
  assert.equal(cleanBioText("Ana\nHorvat"), "Ana Horvat")
  assert.equal(cleanBioText("Ana\t\tHorvat"), "Ana Horvat")
  assert.equal(cleanBioText(text("Ana", 0x2028, "Horvat")), "Ana Horvat")
  assert.equal(cleanBioText(text("Ana", 0x2029, "Horvat")), "Ana Horvat")
  assert.equal(cleanBioText(text("Ana", 0x00a0, "Horvat")), "Ana Horvat")
  assert.equal(cleanBioText(text("Ana", 0x3000, "Horvat")), "Ana Horvat")
  assert.equal(cleanBioText("<script>alert(1)</script>"), "<script>alert(1)</script>")
  assert.equal(cleanBioText("javascript:alert(1)"), "javascript:alert(1)")
  assert.equal(cleanBioText(""), "")
})

check("cleanBioText strips controls, format characters and fillers, as the backend does", () => {
  assert.equal(cleanBioText(text("Insta", 0x200b, "gram")), "Instagram")
  assert.equal(cleanBioText(text("a", 0x202e, "b")), "ab")
  assert.equal(cleanBioText(text("a", 0x2066, "b", 0x2069)), "ab")
  assert.equal(cleanBioText(text("a", 0x200e, 0x200f, 0x061c, "b")), "ab")
  assert.equal(cleanBioText(text("a", 0x00ad, "b")), "ab")
  assert.equal(cleanBioText(text("a", 0x180e, "b")), "ab")
  assert.equal(cleanBioText(text("a", 0xfeff, "b")), "ab")
  assert.equal(cleanBioText(text("a", 0x2065, "b")), "ab")
  assert.equal(cleanBioText(text("a", 0x0007, "b")), "ab")
  assert.equal(cleanBioText(text("a", 0x001c, "b")), "ab")
  assert.equal(cleanBioText(text("a", 0x0085, "b")), "ab")
  assert.equal(cleanBioText(text("a", 0x3164, "b")), "ab")
  assert.equal(cleanBioText(text("a", 0x115f, 0x1160, 0xffa0, "b")), "ab")
})

check("cleanBioText keeps emoji sequences whole", () => {
  assert.equal(cleanBioText(FAMILY), FAMILY)
  assert.equal(cleanBioText(CROATIAN_FLAG), CROATIAN_FLAG)
  assert.equal(cleanBioText(text(0x2764, VARIATION_SELECTOR_16)), text(0x2764, VARIATION_SELECTOR_16))
  const england = text(0x1f3f4, 0xe0067, 0xe0062, 0xe0065, 0xe006e, 0xe0067, 0xe007f)
  assert.equal(cleanBioText(england), england)
  assert.equal(cleanBioText(text("Hi ", 0x1f44b, 0x1f3fd)), text("Hi ", 0x1f44b, 0x1f3fd))
})

check("cleanBioText caps stacked marks at four after NFC", () => {
  const zalgo = text("x", ...Array(40).fill(ACUTE))
  assert.equal(cleanBioText(zalgo), text("x", ACUTE, ACUTE, ACUTE, ACUTE))
  assert.equal(cleanBioText(text("a", ...Array(40).fill(ACUTE))), text(0x00e1, ACUTE, ACUTE, ACUTE, ACUTE))
  const joined = text("x", ...Array(10).fill([ACUTE, 0x200d]).flat())
  assert.equal(marksOf(cleanBioText(joined)), 4)
  assert.equal(marksOf(cleanBioText(text("x", ...Array(10).fill(0x20dd)))), 4)
  assert.equal(cleanBioText(text("x", ACUTE, ACUTE, ACUTE, ACUTE)), text("x", ACUTE, ACUTE, ACUTE, ACUTE))
})

check("cleanBioLines keeps line breaks, as the backend's cleanBio does", () => {
  assert.equal(cleanBioLines(text(CAMERA_WITH_FLASH, " Photographer\nZagreb\nDMs open")), text(CAMERA_WITH_FLASH, " Photographer\nZagreb\nDMs open"))
})

check("cleanBioLines turns CRLF and lone CR into newlines", () => {
  assert.equal(cleanBioLines("Photographer\r\nZagreb"), "Photographer\nZagreb")
  assert.equal(cleanBioLines("Photographer\rZagreb"), "Photographer\nZagreb")
  assert.equal(cleanBioLines("Photographer\r\n\r\nZagreb\r\rDMs open"), "Photographer\nZagreb\nDMs open")
  assert.equal(cleanBioLines("Photographer\n\rZagreb"), "Photographer\nZagreb")
})

check("cleanBioLines drops blank lines", () => {
  assert.equal(cleanBioLines("Photographer\n\n\nZagreb"), "Photographer\nZagreb")
  assert.equal(cleanBioLines("Photographer\n   \n\t\nZagreb"), "Photographer\nZagreb")
  assert.equal(cleanBioLines("\n\n  Photographer  \n\n"), "Photographer")
})

check("cleanBioLines keeps four line breaks and joins the rest with spaces", () => {
  assert.equal(cleanBioLines("one\ntwo\nthree\nfour\nfive"), "one\ntwo\nthree\nfour\nfive")
  assert.equal(cleanBioLines("one\ntwo\nthree\nfour\nfive\nsix"), "one\ntwo\nthree\nfour\nfive six")
  assert.equal(cleanBioLines("one\ntwo\n\nthree\nfour\n\n\nfive\nsix\nseven"), "one\ntwo\nthree\nfour\nfive six seven")
})

check("cleanBioLines collapses spaces within each line and trims every line", () => {
  assert.equal(cleanBioLines("Photographer  \n  Zagreb"), "Photographer\nZagreb")
  assert.equal(cleanBioLines(" Photos \t from   Zagreb \n DMs\t\topen "), "Photos from Zagreb\nDMs open")
})

check("cleanBioLines drops invisible characters before it looks for blank lines", () => {
  assert.equal(cleanBioLines(text("Photographer", 0x200b, "\n", 0x200b, "Zagreb")), "Photographer\nZagreb")
  assert.equal(cleanBioLines(text("Photographer\n", 0x200b, "\nZagreb")), "Photographer\nZagreb")
  assert.equal(cleanBioLines(text("Photographer\n", 0x202e, 0x0007, "\n", 0x3164, "\nZagreb")), "Photographer\nZagreb")
  assert.equal(cleanBioLines(text(0x200b, "\n", 0x00ad, "\n", 0x200b)), "")
})

check("cleanBioLines makes other whitespace a space, not a line break", () => {
  for (const codePoint of [0x000b, 0x000c, 0x00a0, 0x2028, 0x2029, 0x3000]) {
    assert.equal(cleanBioLines(text("Photographer", codePoint, "Zagreb")), "Photographer Zagreb", codePoint.toString(16))
  }
  assert.equal(cleanBioLines(text("Photographer", 0x0085, "Zagreb")), "PhotographerZagreb")
})

check("cleanBioLines answers empty for only line breaks and spaces", () => {
  assert.equal(cleanBioLines("\n \r\n\t\n"), "")
  assert.equal(cleanBioLines(""), "")
})

check("cleanBioLines caps marks on each line", () => {
  const acute = text(ACUTE)
  assert.equal(cleanBioLines(text("x", acute.repeat(10), "\nq", acute.repeat(10))), text("x", acute.repeat(4), "\nq", acute.repeat(4)))
})

check("cleanBioText still collapses line breaks in names and titles", () => {
  assert.equal(cleanBioText("Ana\nHorvat"), "Ana Horvat")
  assert.equal(cleanBioText("Ana\r\n\r\nHorvat"), "Ana Horvat")
})

check("cleanBioLines drops lines with nothing visible on them", () => {
  assert.equal(cleanBioLines(text("Photographer\n", 0x200d, "\nZagreb")), "Photographer\nZagreb")
  assert.equal(cleanBioLines(text("Photographer\n", ACUTE, "\nZagreb")), "Photographer\nZagreb")
  assert.equal(cleanBioLines(text("Photographer\n", 0x20dd, "\nZagreb")), "Photographer\nZagreb")
  assert.equal(cleanBioLines(text("Photographer\n", 0x2800, "\nZagreb")), "Photographer\nZagreb")
  assert.equal(cleanBioLines(text("Photographer\n ", 0xfffc, " ", 0x200c, " \nZagreb")), "Photographer\nZagreb")
})

check("lines with nothing visible don't count towards the four line breaks", () => {
  assert.equal(cleanBioLines(text("one\n", 0x200d, "\ntwo\n", 0x2800, "\nthree\nfour\nfive\nsix")), "one\ntwo\nthree\nfour\nfive six")
})

check("kept invisible characters beside visible text on a line stay", () => {
  assert.equal(cleanBioLines(text("Photographer\nZagreb ", 0x2800)), text("Photographer\nZagreb ", 0x2800))
  const familyOfThree = text(0x1f468, ZERO_WIDTH_JOINER, 0x1f469, ZERO_WIDTH_JOINER, 0x1f467)
  assert.equal(cleanBioLines(text("Family\n", familyOfThree)), text("Family\n", familyOfThree))
})

check("a bio of only kept invisible characters becomes empty", () => {
  for (const only of [
    text(0x200d),
    text(0x200c),
    text(0xfe0f),
    text(0x034f),
    text(0x0301),
    text(0x20dd),
    text(0xe0041, 0xe0042),
    text(0x17b4),
    text(0x180b),
    text(0x0301).repeat(3),
    text(0x200d, 0x0020, 0x200c, 0x0020, 0xfe0f),
    text(0x200d, 0x0301, 0x20dd, 0xe007f),
    text(0x2800),
    text(0x2800, 0x2800, 0x2800),
    text(0xfffc),
    text(0x2800, 0x0020, 0xfffc, 0x200d),
  ]) {
    assert.equal(cleanBioLines(only), "", JSON.stringify(only))
    assert.equal(cleanBioLines(`${only}\n${only}`), "", JSON.stringify(only))
  }
})

check("bioOnOneLine joins a bio's lines with a middle dot for share text", () => {
  assert.equal(bioOnOneLine("Photographer\nZagreb\nDMs open"), text("Photographer ", 0x00b7, " Zagreb ", 0x00b7, " DMs open"))
  assert.equal(bioOnOneLine("One line"), "One line")
  assert.equal(bioOnOneLine(""), "")
})

check("cleanBioText answers empty when nothing visible is left", () => {
  for (const blank of [
    " ",
    "\t\n",
    text(0x200b),
    text(0x200b, 0x200b, 0x2060),
    text(0x2800),
    text(0xfffc),
    text(0x2800, " ", 0xfffc),
    text(0x3164),
    text(0x200d),
    text(0x200c),
    text(0x200d, VARIATION_SELECTOR_16),
    text(ACUTE, ACUTE),
    text(0x034f),
    text(0xe0067, 0xe007f),
    text(0x00a0, 0x2007, 0x202f),
  ]) {
    assert.equal(cleanBioText(blank), "", JSON.stringify(blank))
  }
  assert.equal(cleanBioText(text("Hi ", 0x2800)), text("Hi ", 0x2800))
  assert.equal(cleanBioText(text(0xfffc, "a")), text(0xfffc, "a"))
})

check("buttonTitleError gives the backend's two title texts", () => {
  assert.equal(BUTTON_TITLE_REQUIRED, "Give the button a title")
  assert.equal(BUTTON_TITLE_TOO_LONG, "Button title must be 60 characters or fewer")
  assert.equal(buttonTitleError("Instagram"), null)
  assert.equal(buttonTitleError(" Instagram "), null)
  assert.equal(buttonTitleError(""), BUTTON_TITLE_REQUIRED)
  assert.equal(buttonTitleError("   "), BUTTON_TITLE_REQUIRED)
  assert.equal(buttonTitleError(text(0x200b)), BUTTON_TITLE_REQUIRED)
  assert.equal(buttonTitleError(text(0x2800)), BUTTON_TITLE_REQUIRED)
  assert.equal(buttonTitleError(text(0xfffc)), BUTTON_TITLE_REQUIRED)
  assert.equal(buttonTitleError(text(0x3164)), BUTTON_TITLE_REQUIRED)
  assert.equal(buttonTitleError("a".repeat(60)), null)
  assert.equal(buttonTitleError("a".repeat(61)), BUTTON_TITLE_TOO_LONG)
  assert.equal(buttonTitleError(text(...Array(30).fill(0x0958))), null)
  assert.equal(buttonTitleError(text(...Array(31).fill(0x0958))), BUTTON_TITLE_TOO_LONG)
  assert.equal(buttonTitleError(`${"a".repeat(58)}${GRINNING_FACE}`), null)
})

check("bioButtonTitleErrors keys the title errors by link id, in order", () => {
  assert.deepEqual(bioButtonTitleErrors([]), {})
  assert.deepEqual(
    bioButtonTitleErrors([
      { urlId: 5, title: "Instagram" },
      { urlId: 7, title: text(0x200b) },
      { urlId: 9, title: "a".repeat(61) },
    ]),
    { 7: { field: "title", text: BUTTON_TITLE_REQUIRED }, 9: { field: "title", text: BUTTON_TITLE_TOO_LONG } },
  )
})

check("destinationHostOf mirrors the backend's host", () => {
  assert.equal(destinationHostOf("https://www.Instagram.com/ana"), "www.instagram.com")
  assert.equal(destinationHostOf("instagram.com/ana"), "instagram.com")
  assert.equal(destinationHostOf("https://user:pw@Example.COM:8443/x?y#z"), "example.com")
  assert.equal(destinationHostOf(text("https://k", 0x00f6, "ln.de/")), "xn--kln-sna.de")
  assert.equal(destinationHostOf("not a url"), "")
  assert.equal(destinationHostOf("::::"), "")
  assert.equal(destinationHostOf(""), "")
  assert.equal(destinationHostOf("   "), "")
})

check("newBioButton guesses the title and icon, and falls back to the alias, then Link", () => {
  assert.deepEqual(newBioButton({ id: 5, shortUrl: "ig", longUrl: "https://www.instagram.com/ana" }), {
    id: 0,
    urlId: 5,
    shortUrl: "ig",
    destinationHost: "www.instagram.com",
    title: "Instagram",
    icon: "INSTAGRAM",
    visible: true,
    linkState: "LIVE",
    shownOnPage: true,
  })
  const website = newBioButton({ id: 6, shortUrl: "blog", longUrl: "https://www.karlo.cc/blog" })
  assert.equal(website.title, "karlo.cc")
  assert.equal(website.icon, "WEBSITE")
  const idn = newBioButton({ id: 8, shortUrl: "k", longUrl: text("https://k", 0x00f6, "ln.de/") })
  assert.equal(idn.destinationHost, "xn--kln-sna.de")
  assert.equal(idn.title, "xn--kln-sna.de")
  const unparsable = newBioButton({ id: 7, shortUrl: "my-alias", longUrl: "::::" })
  assert.equal(unparsable.destinationHost, "")
  assert.equal(unparsable.title, "my-alias")
  assert.equal(unparsable.icon, "WEBSITE")
  assert.equal(newBioButton({ id: 9, shortUrl: "", longUrl: "::::" }).title, "Link")
  assert.equal(newBioButton({ id: 10, shortUrl: "a".repeat(70), longUrl: "" }).title, "a".repeat(60))
  for (const button of [website, idn, unparsable]) assert.equal(buttonTitleError(button.title), null)
})

check("bioButtonLabel names a button by its title, else its alias", () => {
  assert.equal(bioButtonLabel({ title: "  Insta   gram ", shortUrl: "ig" }), "Insta gram")
  assert.equal(bioButtonLabel({ title: "", shortUrl: "ig" }), "/ig")
  assert.equal(bioButtonLabel({ title: text(0x200b), shortUrl: "ig" }), "/ig")
})

check("linkStateLabel guards states the FE doesn't know", () => {
  assert.equal(linkStateLabel("LIVE"), null)
  assert.deepEqual(linkStateLabel("DEACTIVATED"), LINK_STATE_LABELS.DEACTIVATED)
  assert.deepEqual(linkStateLabel("BLOCKED"), LINK_STATE_LABELS.BLOCKED)
  for (const unknown of ["PAUSED", "toString", "constructor", "__proto__", "", null, undefined]) {
    assert.equal(linkStateLabel(unknown), null, String(unknown))
  }
})

const sentButtons = [
  { urlId: 5, shortUrl: "ig", title: "Instagram" },
  { urlId: 7, shortUrl: "blog", title: text(0x200b) },
  { urlId: 9, shortUrl: "yt", title: "a".repeat(61) },
]

check("bioSaveErrors maps indexed field errors to their buttons and profile fields", () => {
  assert.deepEqual(bioSaveErrors("Give the button a title", { "buttons[1].title": "Give the button a title" }, sentButtons), {
    profile: {},
    buttons: { 7: { field: "title", text: "Give the button a title" } },
  })
  assert.deepEqual(
    bioSaveErrors("x", { displayName: "Name must be 50 characters or fewer", "buttons[2].title": BUTTON_TITLE_TOO_LONG, "buttons[0].urlId": "Pick a link" }, sentButtons),
    {
      profile: { displayName: "Name must be 50 characters or fewer" },
      buttons: { 9: { field: "title", text: BUTTON_TITLE_TOO_LONG }, 5: { field: "link", text: "Pick a link" } },
    },
  )
  assert.deepEqual(bioSaveErrors("Pick a link", { "buttons[0]": "Pick a link" }, sentButtons), {
    profile: {},
    buttons: { 5: { field: "link", text: "Pick a link" } },
  })
  assert.deepEqual(bioSaveErrors("x", { bio: "Bio must be 160 characters or fewer" }, sentButtons), {
    profile: { bio: "Bio must be 160 characters or fewer" },
    buttons: {},
  })
  assert.equal(bioSaveErrors("x", { "buttons[3].title": BUTTON_TITLE_REQUIRED }, sentButtons), null)
  assert.equal(bioSaveErrors("x", { "buttons[01].title": BUTTON_TITLE_REQUIRED }, sentButtons), null)
  assert.equal(bioSaveErrors("x", { buttons: "A page can have at most 30 buttons" }, sentButtons), null)
  assert.equal(bioSaveErrors("x", { accent: "Choose an accent colour" }, sentButtons), null)
  assert.equal(bioSaveErrors("x", { toString: "x" }, sentButtons), null)
  assert.equal(bioSaveErrors("x", { "buttons[0].title": BUTTON_TITLE_REQUIRED, theme: "Choose a theme" }, sentButtons), null)
})

check("bioSaveErrors maps unindexed texts to the button they belong to", () => {
  assert.deepEqual(bioSaveErrors(BUTTON_TITLE_REQUIRED, {}, sentButtons), {
    profile: {},
    buttons: { 7: { field: "title", text: BUTTON_TITLE_REQUIRED } },
  })
  assert.deepEqual(bioSaveErrors(BUTTON_TITLE_TOO_LONG, {}, sentButtons), {
    profile: {},
    buttons: { 9: { field: "title", text: BUTTON_TITLE_TOO_LONG } },
  })
  assert.equal(bioSaveErrors(BUTTON_TITLE_REQUIRED, {}, [sentButtons[0]]), null)
  assert.deepEqual(bioSaveErrors("Only working links can be added. /blog isn't working right now.", {}, sentButtons), {
    profile: {},
    buttons: { 7: { field: "link", text: "Only working links can be added. /blog isn't working right now." } },
  })
  assert.equal(bioSaveErrors("Only working links can be added. /gone isn't working right now.", {}, sentButtons), null)
  assert.deepEqual(bioSaveErrors("Name must be 50 characters or fewer", {}, sentButtons), {
    profile: { displayName: "Name must be 50 characters or fewer" },
    buttons: {},
  })
  for (const unmapped of [
    "You can only add your own short links.",
    "Each link can be on your page only once.",
    "This page changed. Reload and try again.",
    "You've saved your bio page a lot in a short time. Try again in a few minutes.",
    "",
  ]) {
    assert.equal(bioSaveErrors(unmapped, {}, sentButtons), null, unmapped)
  }
})

check("freshBioPagePath adds the save time so the editor's View page skips the edge cache", () => {
  assert.equal(freshBioPagePath("ana", "2026-10-29T10:15:30.123456"), "/bio/ana?saved=2026-10-29T10%3A15%3A30.123456")
  assert.equal(freshBioPagePath("ana", null), "/bio/ana")
  assert.equal(freshBioPagePath("ana", undefined), "/bio/ana")
})

check("bioCacheKey takes only plain GETs of a bio page or its share image", () => {
  const get = (path, headers = {}, method = "GET") => new Request(`https://app.hrva.cc${path}`, { method, headers })
  assert.equal(bioCacheKey(get("/bio/ana"), "v1"), "https://app.hrva.cc/bio/ana?v=v1")
  assert.equal(bioCacheKey(get("/bio/ana"), undefined), "https://app.hrva.cc/bio/ana?v=local")
  assert.equal(bioCacheKey(get("/bio/ana", { "User-Agent": "facebookexternalhit/1.1", Cookie: "a=b" }), "v1"), "https://app.hrva.cc/bio/ana?v=v1")
  assert.equal(bioCacheKey(get("/bio/ana/opengraph-image?eb30aa1b04ca6d45"), "v1"), "https://app.hrva.cc/bio/ana/opengraph-image?v=v1")
  assert.equal(bioCacheKey(get("/bio/ana?saved=2026"), "v1"), null)
  assert.equal(bioCacheKey(get("/bio/ana?_rsc=abc"), "v1"), null)
  assert.equal(bioCacheKey(get("/bio/ana/opengraph-image?_rsc=abc"), "v1"), null)
  assert.equal(bioCacheKey(get("/bio/ana", { RSC: "1" }), "v1"), null)
  assert.equal(bioCacheKey(get("/bio/ana", { "Next-Router-Prefetch": "1" }), "v1"), null)
  assert.equal(bioCacheKey(get("/bio/ana", { "Next-Router-State-Tree": "x" }), "v1"), null)
  assert.equal(bioCacheKey(get("/bio/ana", {}, "HEAD"), "v1"), null)
  assert.equal(bioCacheKey(get("/bio/ana", {}, "POST"), "v1"), null)
  for (const path of ["/bio/Ana", "/bio/%40ana", "/bio/ab", "/bio/ana/", "/bio/ana/other", "/bio", "/dashboard", "/", "/bio/ana/opengraph-image/x"]) {
    assert.equal(bioCacheKey(get(path), "v1"), null, path)
  }
})

check("isStorableBioResponse keeps only cookie-free 200s", () => {
  assert.equal(isStorableBioResponse(new Response("page", { status: 200 })), true)
  assert.equal(isStorableBioResponse(new Response("missing", { status: 404 })), false)
  assert.equal(isStorableBioResponse(new Response("failed", { status: 500 })), false)
  assert.equal(isStorableBioResponse(new Response(null, { status: 308, headers: { Location: "/bio/ana" } })), false)
  assert.equal(isStorableBioResponse(new Response("page", { status: 200, headers: { "Set-Cookie": "a=b" } })), false)
})

const fakeEdgeCache = () => {
  const entries = new Map()
  return {
    entries,
    match: async (key) => entries.get(key)?.clone(),
    put: async (key, response) => {
      entries.set(key, new Response(await response.arrayBuffer(), response))
    },
  }
}

const runEdgeCache = async () => {
  const cache = fakeEdgeCache()
  globalThis.caches = { default: cache }
  let rendered = 0
  const statusFor = { "/bio/ana": 200, "/bio/gone": 404, "/bio/broken": 500 }
  const handler = async (request) => {
    rendered += 1
    const status = statusFor[new URL(request.url).pathname] ?? 200
    return new Response(`render ${rendered}`, {
      status,
      headers: { "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate", Vary: "RSC, Next-Router-State-Tree" },
    })
  }
  const pending = []
  const context = { waitUntil: (promise) => pending.push(promise) }
  const env = { CF_VERSION_METADATA: { id: "v1" } }
  const worker = withBioEdgeCache(handler)
  const call = async (path, init) => {
    const response = await worker(new Request(`https://app.hrva.cc${path}`, init), env, context)
    await Promise.all(pending.splice(0))
    return response
  }

  const first = await call("/bio/ana")
  assert.equal(first.headers.get(BIO_CACHE_STATUS_HEADER), "MISS")
  assert.equal(first.headers.get("Cache-Control"), BIO_CACHE_CONTROL)
  assert.equal(first.headers.get("Vary"), "Accept-Encoding")
  assert.equal(await first.text(), "render 1")
  const second = await call("/bio/ana", { headers: { Cookie: "theme=dark", Authorization: "Bearer x" } })
  assert.equal(second.headers.get(BIO_CACHE_STATUS_HEADER), "HIT")
  assert.equal(await second.text(), "render 1")
  assert.equal(rendered, 1)

  const router = await call("/bio/ana", { headers: { RSC: "1" } })
  assert.equal(router.headers.get(BIO_CACHE_STATUS_HEADER), null)
  assert.equal(await router.text(), "render 2")

  for (const path of ["/bio/gone", "/bio/gone", "/bio/broken", "/bio/broken"]) {
    const response = await call(path)
    assert.equal(response.headers.get(BIO_CACHE_STATUS_HEADER), null, path)
    assert.match(response.headers.get("Cache-Control"), /no-store/, path)
  }
  assert.equal(rendered, 6)
  assert.deepEqual([...cache.entries.keys()], ["https://app.hrva.cc/bio/ana?v=v1"])

  const otherVersion = await worker(new Request("https://app.hrva.cc/bio/ana"), { CF_VERSION_METADATA: { id: "v2" } }, context)
  await Promise.all(pending.splice(0))
  assert.equal(otherVersion.headers.get(BIO_CACHE_STATUS_HEADER), "MISS")

  delete globalThis.caches
  const withoutCache = await call("/bio/ana")
  assert.equal(withoutCache.headers.get(BIO_CACHE_STATUS_HEADER), null)
}

try {
  await runEdgeCache()
} catch (error) {
  console.error(`FAIL withBioEdgeCache\n  ${String(error.message).split("\n").join("\n  ")}`)
  process.exit(1)
}

console.log("ok")
