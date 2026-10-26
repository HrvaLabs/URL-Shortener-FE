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
  container-admin: "1536px"
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
- **Signal Red** (signal-red): destructive actions and invalid fields. Dark: `hsl(0 72% 60%)`. One chart series uses it on purpose: Failed on the admin "Emails per day" chart, because failures are the series an admin looks for (see Charts).

### Named Rules
**The Ink Is Not The Accent Rule.** `primary` is near-black (near-white in dark) and exists for primary buttons, tooltips and the single closing CTA band. It is never used for links or data. Blue is never a button fill on product surfaces.

**The One Blue Rule.** Electric blue is the only chromatic accent. If something is blue, it is a link, a short URL, a focus state, a selection, or a data value. Decoration never gets blue. The single recorded exception is the Failed series on the admin emails chart, drawn in signal red.

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

Single centred container capped at 1200px with 20px side padding, 24px from `sm`, 32px from `lg`. Admin pages are the exception: their header and content use a 1536px container (`max-w-(--breakpoint-2xl)`, 20px side padding) with a 13rem sidebar beside the content from `md`, and `main` is the single `@container`, so admin tables choose their columns with container queries on the content area, not viewport breakpoints. Landing sections stack vertically with 96px vertical padding (112px from `sm`) and are separated by hairline `border-t`/`border-y`, with one muted band (the privacy section) for rhythm. Two-column splits use asymmetric `minmax(0,1fr) minmax(0,1.2fr)` or `1fr 1.5fr` grids at `lg`, collapsing to one column below.

The first viewport is centred: headline, one lede sentence, then the hero shorten field at max ~42rem (672px) with a 56px input and button, followed by the framed dashboard preview that starts above the fold and fades out through a bottom mask.

Product surfaces are denser: a sticky 56px dashboard nav (64px on public pages), content in `rounded-xl` panels with 20 to 24px padding, a `1fr 360px` main-plus-rail layout on the signed-in home. Control heights step 32 (nav items), 36 (small buttons, option fields), 40 (default), 44 (large), 56 (hero). Mobile: forms stack the button under the input; below `md` the dashboard nav moves its links to a second row under the logo bar that scrolls sideways (no menu dropdown), and the admin sidebar becomes a scrolling chip row; table columns that don't fit move into a cell that stays, as extra lines, so nothing disappears.

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
- **Columns by container:** admin tables show or hide columns with container variants on `main` (`@4xl:table-cell`, `@min-[57rem]:table-cell`), each threshold the measured min-content width of that column set (a named size when one fits, otherwise an arbitrary rem value, so Users, the audit log and the email log show every column at the 1280 px window, where `main` is 1000 px). A long free-text column such as All URLs' Long URL gets its own column only where it can be about 28rem wide; below that it folds under the first cell, so rows stay a few lines tall. A column may hide below its threshold only when its values move into a cell that stays, as muted extra lines: the first cell, or in the two logs, whose first cell is the time, the action badge (audit log) or the recipient (email log). When a hidden column carries a sort header, a "Sort by" select appears above the table for as long as the header is hidden. A table still wider than its card scrolls inside the card.
- **Wrap, never truncate:** every value is shown in full and wraps (`[overflow-wrap:anywhere]` for URLs, emails and aliases); nothing is cut off with "…" and a tooltip, and nothing lives only in a tooltip or `title` (a relative time such as "3 hours ago" carries its local date and time alongside or beneath). Wrapping columns get a `min-w-*` so they never fall to one word per line, short values (dates, counts, badges) stay on one line, and a table wider than its card scrolls inside the card, never the page.

### Navigation
- **Public header:** sticky, 64px, hairline bottom border, LogoMark plus `hrva` with a muted `.cc`; text links 14px muted turning ink on hover; ghost "Sign in" and primary "Get started" at the small size; below `md` the links fold into a dropdown behind a menu icon.
- **Dashboard nav:** sticky, 56px, solid paper ground. Items are 32px, 6px radius; active is zinc-hover fill with medium ink text and `aria-current`; inactive is muted, hovering to a 60% zinc-hover fill. Admin is one link, carrying the open review count, active on every admin route.
- **Admin sidebar:** the admin pages sit in a sticky 13rem sidebar in four groups, Overview, Moderation, Links and accounts, and Logs, each under a 12px muted group label (a `p`, not a heading), with dashboard-nav items (icon, label, the review count on Review queue). Below `md` the same items become a horizontally scrolling chip row of bordered nav items above the content, with a hairline divider between groups, the active chip scrolled clear of the edges, and a 32px fade (a mask, no colour) on each edge that has more chips beyond it.
- **Row actions:** an icon button is fine for one obvious action; a row with several consequential choices (the review queue) shows the common ones as labelled outline buttons ("Looks fine", "Block link" in destructive text) and puts the rest in a "More" menu, stacked vertically until the table has room for them in a row.

### Charts
- **Stacked bars** (`StackedDailyChart`, admin stats) stay inside the One Blue Rule. A series is a brand lightness step: 100, 55, 40 or 25 (brand mixed in oklab toward the card; in dark 100, 60, 42 and 20 toward the foreground). A chart of two or three plain series uses 100, 55 and 25 in order; the links-created chart uses 100 (website), 55 (AI connector), 40 (bulk) and 25 (API key).
- **At most three shades of a kind.** A chart whose series outnumber the steps shows only the three largest in the range as steps (100, 55, 25, largest at the bottom) and stacks the rest as one muted "Other reasons" segment. "Links blocked per day" does this with its six block reasons; its tooltip still lists every reason with a count, in a fixed order, skipping zeros, and the legend shows only what the chart draws.
- **Hatch means "no account", and nothing else.** A 45° hatch (a 6px pattern with a 1px card-coloured line) marks the anonymous channels on the links-created chart, at the step of their signed-in twin. No other chart hatches.
- **Failed is red.** On "Emails per day" the Failed series is solid signal red (`--destructive`): the one deliberate exception to the One Blue Rule, because failures are what an admin scans that chart for.
- `unknown`, and any key the chart has no fill for, is muted (`muted-foreground` at 0.75 alpha) and stacks last.
- In light mode every step under 3:1 against the card gets a 1px brand edge wherever the segment has at least 5px of room (the sides when it's at least 5px wide, top and bottom when it's at least 5px tall): steps 55 (2.32:1), 40 (1.81:1) and 25 (1.43:1); step 100 (5.59:1) stands on its own. Dark needs no edge; every dark step is 6:1 or more. Stacked segments are split by a 2px gap (1px under 6px tall). Legend and tooltip swatches render the same fill, hatch and edge.
- **Buckets by range:** every admin stats chart (the stacked bars and the Traffic clicks chart, `ClicksChart bucketed`) shows days at 7 and 30 days, weeks from Monday at 90 days and months at 1 year, summing the counts, and the title follows ("Links created per week"). Tooltips read "Oct 26, 2026", "Week of Oct 6" or "October 2026"; on the 1-year range the axis shows month names with the year only on January ("Jan 2026"), thinned when narrow.
- **Today is in progress:** the last bucket holds today, so it is drawn as unfinished: bars at 45% opacity, lines with a dashed final stretch (the already-dashed unique visitors line goes dotted). Its tooltip adds "(today so far)" or "(so far)", and the legend explains it in neutral grey, never in a series colour: "Faded: today so far" with a solid-and-faded pair on bars, "Last stretch: today so far" with a dashed line on lines ("this week" / "this month" when bucketed). A first week or month that starts before the range is drawn the same way and its tooltip adds "(from Jul 29)". The user analytics page keeps its daily chart without this marking.

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

### Bio pages
The public page at `/bio/[handle]` and its previews (the editor's phone preview and the landing's Bio pages card) are the one surface outside the One Blue Rule. The owner picks an accent, and it fills only the buttons and the avatar; text, the handle, the bio and the footer links stay in the page colours, and the accent never colours text on the page ground, borders or decoration. Buttons are full width, at least 48px tall, 12px radius, medium weight; the avatar is a 96px circle. The page follows its own theme (`.bio-theme-light`, `.bio-theme-dark`, and `.bio-theme-auto` on `prefers-color-scheme`), never the site's `.dark` class, and the public page carries that theme out to `html` and `body`, the overscroll area and `theme-color` included. The landing card puts its text and the phone mock side by side from `md` up. The landing card's mock uses the Teal pair with the site's `dark:` variant, because it sits on a site surface.

| Accent | Light theme button (white text) | Dark theme button (`#0b0b0e` text) |
|---|---|---|
| Blue | `#1d4ed8` (6.70) | `#93c5fd` (10.90) |
| Violet | `#6d28d9` (7.10) | `#c4b5fd` (10.65) |
| Pink | `#be185d` (6.04) | `#f9a8d4` (10.84) |
| Red | `#b91c1c` (6.47) | `#fca5a5` (10.36) |
| Orange | `#c2410c` (5.18) | `#fdba74` (11.65) |
| Green | `#15803d` (5.02) | `#86efac` (14.00) |
| Teal | `#0f766e` (5.47) | `#5eead4` (13.29) |
| Slate | `#334155` (10.35) | `#cbd5e1` (13.24) |

Page colours, with WCAG contrast against the background (`scripts/check-bio.mjs` pins every ratio):
- **Light:** background `#ffffff`, text `#0e0e11` (19.27), muted `#5c5c66` (6.61).
- **Dark:** background `#0b0b0e`, text `#f5f5f5` (18.03), muted `#a1a1aa` (7.67).

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
- **Don't** cut a value off with "…" and a tooltip (`truncate` plus `title`); show it in full and let it wrap.
- **Don't** add section entrance animations or scroll-triggered reveals; the shortened result is the only authored entrance.
- **Don't** use a serif or a separate display family; display is Host Grotesk at 650 with -0.03em.
- **Don't** load fonts or assets from third-party hosts; fonts are self-hosted through `next/font`.
