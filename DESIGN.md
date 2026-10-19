---
name: hrva.cc
description: A free, private, open-source URL shortener where the shorten box comes first and real product UI is the proof.
colors:
  ink: "hsl(240 10% 6%)"
  paper: "hsl(0 0% 100%)"
  zinc-wash: "hsl(240 5% 96%)"
  zinc-hover: "hsl(240 5% 95%)"
  graphite-muted: "hsl(240 4% 42%)"
  hairline: "hsl(240 6% 90%)"
  field-stroke: "hsl(240 6% 86%)"
  electric-blue: "hsl(227 100% 57%)"
  electric-blue-soft: "hsl(227 100% 97%)"
  signal-red: "hsl(0 72% 46%)"
  ledger-green: "hsl(152 62% 30%)"
  amber-ochre: "hsl(30 95% 33%)"
  proof-panel: "#09090b"
  proof-panel-rule: "#27272a"
typography:
  display:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 7vw, 4.5rem)"
    fontWeight: 650
    lineHeight: 1.02
    letterSpacing: "-0.03em"
    fontFeature: "\"ss01\", \"cv11\""
  headline:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 650
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.03em"
  card-title:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  lede:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.625
  prose:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  body:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Host Grotesk, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "normal"
  short-url:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.4
  code:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.78125rem"
    fontWeight: 400
    lineHeight: 1.625
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  2xl: "16px"
  full: "9999px"
spacing:
  control-sm: "36px"
  control: "40px"
  control-lg: "44px"
  control-hero: "56px"
  panel: "20px"
  card: "24px"
  feature-cell: "32px"
  section: "96px"
  section-lg: "112px"
  container-max: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "hsl(240 10% 6% / 0.85)"
  button-hero:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: "0 28px"
    height: "56px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
    height: "40px"
  button-outline-hover:
    backgroundColor: "{colors.zinc-hover}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.graphite-muted}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
    height: "36px"
  button-ghost-hover:
    backgroundColor: "{colors.zinc-hover}"
    textColor: "{colors.ink}"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 12px"
    height: "40px"
  input-hero:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "0 16px 0 48px"
    height: "56px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  badge-success:
    backgroundColor: "hsl(152 62% 30% / 0.1)"
    textColor: "{colors.ledger-green}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-warning:
    backgroundColor: "hsl(30 95% 33% / 0.1)"
    textColor: "{colors.amber-ochre}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-brand:
    backgroundColor: "{colors.electric-blue-soft}"
    textColor: "{colors.electric-blue}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  tooltip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    typography: "{typography.label}"
  nav-link-active:
    backgroundColor: "{colors.zinc-hover}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.graphite-muted}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  proof-panel:
    backgroundColor: "{colors.proof-panel}"
    textColor: "#f4f4f5"
    rounded: "{rounded.2xl}"
    typography: "{typography.code}"
---

# Design System: hrva.cc

## Overview

**Creative North Star: "The Working Tool, Shown Working"**

hrva.cc looks like the category standard for link tools (Dub, Short.io): white and zinc grounds, near-black type, hairline zinc borders, and a single electric blue that marks everything that is a link, a result or a focus. The shorten box comes first; the rest of every surface is real product UI (tables, charts, status pills, code) rather than illustration. The proof is the product, so marketing pages borrow the dashboard's components instead of inventing promotional ones.

Density is calm-dense: 14px body in panels and tables, generous 96 to 112px between landing sections, and 1px hairlines doing the structural work that shadows do elsewhere. Depth is mostly flat with a faint 1px resting shadow; real elevation is reserved for things that float (menus, dialogs, the freshly shortened result) and for the dark proof panels that hold source code.

The system explicitly refuses the dark amber glow, glass panels, gradient text, blurred colour blobs and serif display type. Motion is nearly absent: one authored entrance for a newly shortened link, one pulse on copy, and Radix's stock enter/exit on overlays.

**Key Characteristics:**
- Ink-and-paper neutrals (zinc family), light by default, dark mode inverts to zinc-950.
- One accent, electric blue, used only for links, short URLs, focus, selection, progress and chart data.
- Host Grotesk for everything, weight 650 with -0.03em tracking for display; JetBrains Mono for short codes and code.
- Hairline borders and divide-y lists carry structure; shadows stay faint.
- Product UI as proof, with example data labelled as example data.
- One authored entrance only; reduced motion turns it off.

## Colors

A zinc neutral scale with a single saturated electric-blue accent and three muted status hues; every value is an HSL triplet in `app/globals.css` with a matching `.dark` override.

### Primary
- **Electric Blue** (electric-blue): the only accent. Links (`.text-brand-link`, link button variant), short URLs in mono, focus rings and the input focus halo, text selection at 18% alpha, the text caret, progress fills, chart bars (today at full strength, prior days at 20%), the marked line in code panels, and checkbox `accent-color`. In dark mode it lifts to `hsl(227 100% 72%)`.
- **Electric Blue Soft** (electric-blue-soft): the tinted ground behind brand badges (password / protected states), selected tags and selected table rows. Dark: `hsl(227 45% 15%)`.

### Neutral
- **Ink** (ink): body text, headings, and the primary button fill. The same ink surface carries tooltips and the closing call-to-action band. Dark mode flips ink to near-white `hsl(0 0% 96%)` with near-black `hsl(240 6% 8%)` text on primary fills.
- **Paper** (paper): page, card, popover and input ground. Dark: `hsl(240 10% 4%)` page, `hsl(240 5% 9%)` cards and popovers.
- **Zinc Wash** (zinc-wash): secondary buttons, muted fills, inline code chips, table headers at 50%, the privacy section band at 40%, the auth page ground at 40%.
- **Zinc Hover** (zinc-hover): the accent surface for ghost/outline hover, menu item focus and the active nav item.
- **Graphite Muted** (graphite-muted): secondary text, descriptions, table header labels, placeholders (at 85%), icons beside titles. Dark: `hsl(240 5% 65%)`.
- **Hairline** (hairline): every border and divider; applied globally to `*`. Dark: `hsl(240 4% 17%)`.
- **Field Stroke** (field-stroke): the slightly firmer stroke on inputs and outline buttons. Dark: `hsl(240 4% 22%)`.
- **Proof Panel** (proof-panel) with **Proof Panel Rule** (proof-panel-rule): zinc-950 ground and zinc-800 rules for code figures. These stay dark in both themes; text is zinc-100, line numbers zinc-600, chrome text zinc-400.

### Status
- **Ledger Green** (ledger-green): active, success, healthy. Dark: `hsl(152 55% 50%)`.
- **Amber Ochre** (amber-ochre): limits, expiry soon, warnings. Dark: `hsl(38 92% 58%)`.
- **Signal Red** (signal-red): destructive actions and invalid fields. Dark: `hsl(0 72% 60%)`.

### Named Rules
**The Ink Is Not The Accent Rule.** `primary` is near-black (near-white in dark) and exists for primary buttons, tooltips and the single closing CTA band. It is never used for links or data. Blue is never a button fill on product surfaces.

**The One Blue Rule.** Electric blue is the only chromatic accent. If something is blue, it is a link, a short URL, a focus state, a selection, or a data value. Decoration never gets blue.

**The Ten Percent Tint Rule.** Status is shown as a 10% alpha tint of the status hue behind full-strength text of the same hue (`bg-success/10 text-success`). Protected/password state uses brand-soft with brand text. Expired or inactive drops to muted ground and muted text. Status hues never fill large areas.

## Typography

**Display Font:** Host Grotesk (with system-ui, sans-serif), self-hosted via `next/font`
**Body Font:** Host Grotesk (same family, stylistic sets `ss01` and `cv11` on `body`)
**Label/Mono Font:** JetBrains Mono 400/500 (with ui-monospace, SFMono-Regular, Menlo)

**Character:** One grotesk carries the whole interface; hierarchy comes from size and the `.font-display` treatment (weight 650, -0.03em), not from a second display family. Mono appears only where the content is literally machine text: short codes, aliases, API keys, code.

### Hierarchy
- **Display** (650, `clamp(2.5rem, 7vw, 4.5rem)`, 1.02): the landing hero headline only.
- **Headline** (650, 1.875rem rising to 2.25rem at `sm`, ~1.25): section headings on marketing pages and the signed-in home heading.
- **Title** (650, 1.5rem): page titles on auth, dashboard and admin screens; blog `h2`.
- **Card Title** (600, 1.125rem, tight tracking): card and dialog titles.
- **Lede** (400, 1.125rem, relaxed): one-sentence subheads under section headings, in muted text, max ~36 to 42rem.
- **Prose** (400, 1rem, 1.75): blog and legal bodies, FAQ answers and the result row's short URL; the size people read at length.
- **Body** (400, 0.875rem): the working size for panels, tables, forms and descriptions.
- **Label** (500, 0.75rem, normal tracking, sentence case): table column headers, field labels in the shorten options, badges, chart captions.
- **Short URL** (JetBrains Mono 500, 13px; 1rem in the result row): every rendered short link, always in electric blue.
- **Code** (JetBrains Mono 400, 12.5px, relaxed): code inside proof panels; inline code chips at 0.85em on a muted ground with a hairline border.

### Named Rules
**The Sentence-Case Label Rule.** Labels, column headers and badges are sentence case at normal tracking. There are no uppercase tracked micro-labels and no eyebrow or kicker line above any heading; a heading stands on its own, followed by at most one lede sentence.

**The Mono Means Machine Rule.** Monospace is reserved for strings a machine reads: short URLs, aliases, API keys, headers, code. Never use it for decoration or numerals in prose; numerals use `tabular-nums` in the grotesk.

## Layout

Single centred container capped at 1200px with 20px side padding, 24px from `sm`, 32px from `lg`. Landing sections stack vertically with 96px vertical padding (112px from `sm`) and are separated by hairline `border-t`/`border-y`, with one muted band (the privacy section) for rhythm. Two-column splits use asymmetric `minmax(0,1fr) minmax(0,1.2fr)` or `1fr 1.5fr` grids at `lg`, collapsing to one column below.

The first viewport is centred: headline, one lede sentence, then the hero shorten field at max ~42rem (672px) with a 56px input and button, followed by the framed dashboard preview that starts above the fold and fades out through a bottom mask.

Product surfaces are denser: a sticky 56px dashboard nav (64px on public pages), content in `rounded-xl` panels with 20 to 24px padding, a `1fr 360px` main-plus-rail layout on the signed-in home. Control heights step 32 (nav items), 36 (small buttons, option fields), 40 (default), 44 (large), 56 (hero). Mobile: forms stack the button under the input, nav links collapse into a menu dropdown, table columns drop to short link plus visits.

Text measure: ledes cap around 28 to 42rem; FAQ answers keep an 8-unit right gutter; blog prose uses `.prose-custom` at 1rem/1.75 at every width.

## Elevation & Depth

Flat with hairlines. Structure comes from 1px zinc borders and `divide-y` lists; at rest, cards and inputs carry a near-invisible 1px shadow that only adds crispness. Real elevation is a response to floating: menus, tooltips, dialogs and the shortened result. The dark proof panels carry the deepest shadow because they are the one inverted surface on a light page.

### Shadow Vocabulary
- **Rest** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.04)`): cards, inputs, the alias field.
- **Press** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.14)`): primary buttons; outline buttons use 0.05.
- **Result** (`box-shadow: 0 8px 24px -12px rgb(0 0 0 / 0.15)`): the freshly shortened link row and comparable lifted result cards.
- **Float** (`box-shadow: 0 4px 12px -2px rgb(0 0 0 / 0.2)`): tooltips and small floating labels.
- **Menu** (`box-shadow: 0 12px 32px -8px rgb(0 0 0 / 0.18)`): dropdown menu and select content.
- **Modal** (`box-shadow: 0 24px 48px -12px rgb(0 0 0 / 0.28)`): dialogs and alert dialogs, over a 50% black overlay.
- **Proof** (`box-shadow: 0 24px 48px -24px rgb(0 0 0 / 0.4)`): zinc-950 code panels.

### Named Rules
**The Hairline First Rule.** Separate with a 1px border or `divide-y` before reaching for a shadow. A grid of cells is drawn as `gap-px` over a hairline-coloured ground inside one rounded frame, not as separate bordered cards.

**The Opaque Surface Rule.** Cards, dialogs, menus, sections and both sticky headers (public site and product nav) are opaque, with no backdrop blur anywhere.

## Shapes

Softly rounded rectangles, never pills for containers. The radius root is `--radius` 10px (lg) with md 8px and sm 6px derived from it; Tailwind's xl 12px is the dominant container radius and 2xl 16px frames whole showcase blocks.

- 6px: badges, status pills, nav items, inline code, tooltips.
- 8px to 10px: buttons, inputs, menu items, small inset panels.
- 12px: cards, dashboard panels, the result row, dialogs, the hero input and button.
- 16px: the feature grid frame, proof panels, the dashboard preview (top corners only), the closing CTA band.
- Full: progress tracks, colour swatches, avatars.

The LogoMark is the system in miniature: a near-black rounded square (8 on a 32 grid), a long bar and a short bar in the ground colour, and one brand-blue dot; it inverts with the theme.

## Components

### Buttons
Quiet and solid; ink on paper, never coloured.
- **Shape:** gently rounded (10px; 8px at `sm`; 12px on the hero shorten button).
- **Primary:** ink fill, paper text, 14px medium, 40px tall with 16px side padding; hover drops the fill to 85%; press nudges down 1px (`active:translate-y-px`).
- **Outline:** paper ground with a field-stroke border and rest shadow; hover fills zinc-hover.
- **Ghost:** no ground, muted text; hover fills zinc-hover and darkens text to ink. Used for header actions and icon buttons.
- **Secondary / Destructive / Link:** zinc-wash fill; signal-red fill; brand-blue text with underline on hover.
- **Focus:** 2px electric-blue ring with 2px offset against the page.
- **On ink:** inside the ink CTA band, the primary inverts (paper fill, ink text) and the outline uses a 25% paper border.

### Badges / Status Pills
- **Style:** 6px radius, 2px by 8px padding, 12px medium, no border on tinted variants.
- **Variants:** success, warning and destructive at 10% tint with full-strength text; brand on brand-soft; outline for neutral metadata; muted for expired. Optional 12px leading icon (lock for password, timer for expiry).

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** card (paper; zinc-900 equivalent in dark).
- **Shadow Strategy:** Rest shadow only (see Elevation).
- **Border:** 1px hairline.
- **Internal Padding:** 24px (20px for compact panels, 32px for auth cards).
- Cards never nest. Inner structure inside a card uses hairline rows, `divide-y`, or a header strip with `border-b`; product mock fragments inside a showcase cell are inset panels on the page ground, not cards.

### Inputs / Fields
- **Style:** paper ground, 1px field-stroke border, 10px radius, 40px tall (36px in option rows, 56px with a leading link icon in the hero), rest shadow.
- **Focus:** border turns electric blue and a 4px halo at 15% blue appears; no offset ring.
- **Prefix fields:** the alias input carries a muted `hrva.cc/` prefix segment divided by a hairline, with the alias itself in mono.
- **Error / Disabled:** `aria-invalid` turns the border signal-red; disabled drops to 50% opacity with a not-allowed cursor.

### Tables
- Header row on zinc-wash at 50% with 12px medium muted labels; 40px header, 12px by 16px cells; rows divided by hairlines, hover at muted 40%, selected rows on brand-soft. Numerals are tabular.

### Navigation
- **Public header:** sticky, 64px, hairline bottom border, LogoMark plus `hrva` with a muted `.cc`; text links 14px muted turning ink on hover; ghost "Sign in" and primary "Get started" at the small size; below `md` the links fold into a dropdown behind a menu icon.
- **Dashboard nav:** sticky, 56px, solid paper ground. Items are 32px, 6px radius; active is zinc-hover fill with medium ink text and `aria-current`; inactive is muted, hovering to a 60% zinc-hover fill. Admin routes sit behind one dropdown.

### Overlays
- **Dialog:** paper ground, 12px radius from `sm`, 24px padding, Modal shadow, 50% black scrim, Radix fade and 95% zoom.
- **Tooltip:** ink ground, paper text, 12px medium, 6px radius, Float shadow.
- **Menus / Select:** popover ground, hairline border, Menu shadow; focused items fill zinc-hover.

### Shortened Result (signature)
The moment the product exists for. A 12px-radius card row with the Result shadow: an optional 64px QR on white, the short URL in 16px mono electric blue, the destination truncated beneath in muted text, then a primary "Copy" button and an outline open-destination icon button. It enters with the system's one authored animation, `result-in` (420ms, `cubic-bezier(0.16, 1, 0.3, 1)`, rising 6px from 0 opacity with a 3px blur settling to sharp). Copying swaps the icon to a check and pulses the button (`copy-pulse`, 300ms, scale to 1.12). `prefers-reduced-motion` disables both.

### Proof Panel (signature)
Dark zinc-950 figures that hold real source or API calls in both themes: a header strip with the filename or label in 12px mono zinc-400 and a "View on GitHub" or copy action, 12.5px mono code with zinc-600 line numbers, and a highlighted line marked by a 20% blue wash plus a 2px brand inset bar. A caption strip under a zinc-800 rule explains the code in 12px text.

### Product Preview
The landing's framed dashboard: real table markup (short link, destination, visits, status pills) in a 16px top-rounded card that fades out through a bottom mask, captioned "Example data" above its right edge. Any illustrative data on a marketing surface is labelled as an example.

## Do's and Don'ts

### Do:
- **Do** keep the shorten field first on any public entry surface, at 56px tall with an ink "Shorten" button.
- **Do** render every short URL in JetBrains Mono, electric blue, 13px (16px in the result row).
- **Do** use the 10% tint pattern for status and brand-soft for protected/password state.
- **Do** separate content with 1px hairlines and `divide-y` before adding shadows; frame grids of cells with `gap-px` over the hairline colour.
- **Do** use a zinc-950 proof panel when showing code or a real implementation detail, with one brand-marked line where it matters.
- **Do** label illustrative data as example data.
- **Do** use `tabular-nums` for counts, dates and table numerals.
- **Do** give every interactive element the electric-blue focus ring (2px with 2px offset), and inputs the border-plus-4px-halo focus.
- **Do** honour `prefers-reduced-motion` for any authored animation.

### Don't:
- **Don't** fill buttons with brand blue on product or marketing surfaces; primary actions are ink.
- **Don't** introduce a second accent hue; status colours are signals, not decoration.
- **Don't** put an eyebrow, kicker or uppercase tracked micro-label above a heading.
- **Don't** use gradient text, blurred colour blobs, glows or amber-on-dark lighting.
- **Don't** make cards, dialogs or sections translucent glass panels.
- **Don't** nest a bordered card inside another card.
- **Don't** add section entrance animations or scroll-triggered reveals; the shortened result is the only authored entrance.
- **Don't** use a serif or a separate display family; display is Host Grotesk at 650 with -0.03em.
- **Don't** load fonts or assets from third-party hosts; fonts are self-hosted through `next/font`.
