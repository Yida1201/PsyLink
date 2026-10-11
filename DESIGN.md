# Bloomie — Design system

Modern tactile design for Chinese caregivers of preschool children. One continuous experience across conversation, library, daily activities and care. The product name is Bloomie.

## Direction
Modern tactile: a calm instrument for families. Warm stoneware, cloth-bound books and glazed ceramics in a softly lit room, combined with three influences tuned for anxious caregivers rather than copied: Apple Liquid Glass for floating layers, Smartisan-style physical controls (keycaps that press, sprung toggle switches, LED indicators, screws on devices), and Nothing-style dot grid plus mono micro-labels. Never copy proprietary assets. Interactive edges remain visible; no full-interface neumorphism.

## Material system (2026-10-11)
- **Tokens** live only in `app/tokens.css` (light + `[data-theme="dark"]`). `globals.css` owns layout and references tokens; `app/material.css` owns materials. Do not add raw hex colours to UI rules; illustrated objects (books, vinyl, ceramics, spheres) may keep literal colours.
- **Room**: page background is a fine dot grid over two or three large blurred colour lights (sage, peach, sky) so glass has something to refract.
- **Glass** is reserved for floating layers: sidebar, conversation shell and composer, modals, mobile tab bar, hero bands. A pointer-following specular highlight (`<Specular/>`) moves across glass panels; its selector list in `components/psylink/material.tsx` and `material.css` stays in sync.
- **Stoneware plates** for content cards: opaque paper, top light, fine rim, soft long shadow.
- **Keycaps**: primary = forest gradient with a 3px pressed edge; secondary = light keycap. Both travel down on `:active`. Segmented controls are inset wells with a raised selected key.
- **Switches & LEDs**: settings toggles are inset tracks with a glossy sprung knob; checkboxes are small LED keys; status/active indicators are a breathing clay LED (the single warm signal colour).
- **Process track**: activity steps are joined by a dotted line; the first node glows.
- **Dark mode**: a quiet night-garden. `data-theme` on `<html>` is set before paint from `bloomie-theme` in localStorage, else `prefers-color-scheme`. The theme switch shows the current mode on the knob and the other in the track.

## Tokens
- Light: background #edece6, paper #fbfaf6, ink #1f2d28, forest #2f5444, clay #c0643f.
- Dark: background #0e1110, paper #1a1f1c, ink #eef1ea, forest #8fc7a6, clay #ff7a4d.
- Type: Space Grotesk for UI and display headings (self-hosted via `next/font`, no runtime requests), system CJK fallbacks (PingFang SC / Noto Sans SC); Space Mono for uppercase micro-labels (12px minimum for CJK); Doto only for large readouts (thin below ~20px). Book covers keep editorial serif because they are printed objects.
- Body 15–16px, line height 1.7; 26px panel radius, 14px controls, 44px touch targets.
- Motion 120–380ms with a spring for knobs; respect prefers-reduced-motion and prefers-reduced-transparency (glass becomes opaque paper).

## Illustration
One drawing per object, rendered as real materials:
- **Planter** (`Planter` in `art.tsx`): speckled glazed stoneware with cylindrical shading, a glaze streak, thick rim, grainy soil, veined translucent leaves and a contact shadow. The welcome version keeps the smiling face; the library version sits in a glass halo.
- **Books**: cloth weave, hinge groove, page block, blind-stamped motifs (light lower edge, dark upper edge).
- **Spheres and sun dial**: glazed ceramic with a hotspot, rim light and soft cast shadow; orbits are fine wire.
- **Turntable**: wood-tone plinth with brushed grain and four screws, metal platter, deep vinyl grooves.
- In dark mode objects are dimmed slightly rather than recoloured.
- **Hourglass** (Today Together hero): oak caps and posts with glass bulbs and a slow sand stream; replaces the earlier ceramic sun, which read as an abstract symbol rather than an object.
- **Category tiles**: activity categories are small glazed ceramic tiles (reading sage, routine ochre, emotion clay, movement blue) with a debossed glyph. Don't redraw each activity as its own illustration; colour carries the category.
- **Week lamps**: seven glass lamps in chrome bezels on a recessed brushed strip (dark anodised in dark mode); a lit lamp glows forest green with a leaf. No scores or streaks.
- **Sample people** (Find support): round glazed ceramic pebbles with a groove ring and raised initial. Avoid arched shapes with a centred letter (they read as gravestones) and avoid realistic faces for fictional people. Cards are horizontal: identity, a stamped "sample person" plate, a dashed spec strip (label over value) and a compact keycap action. Demo time slots are keycaps; the chosen one stays pressed.

## Product rules
Demo services have persistent labels and explicit action confirmation. No fabricated qualifications, reviews, expert endorsement or appointments. Editorial provenance does not imply clinical review. Chat is ephemeral. Notifications are opt-in. Icon buttons have labels; modals trap and restore focus.

## References
- https://developer.apple.com/design/human-interface-guidelines
- https://www.coloros.com/version/coloros17/
- https://www.smartisan.com/os/ (legacy site did not render useful detail; historical inspiration only)

Initial direction: 2026-10-09, based on the authorized brief.

## Listening corner
Library includes reading and podcast formats. The turntable is a playable object: an oak plinth with a brushed champagne plate, screws, a machined platter with strobe ring, grooved vinyl under a static reflection, a chrome tonearm with counterweight and finger lift, an LCD time readout and a start key. Lowering the tonearm onto the record plays; lifting it pauses; dropping the stylus partway seeks; the arm tracks progress inwards. Keyboard and screen-reader users get the arm as a switch and a separate start key.

Audio: only the "家长也需要充电 / Parents need to recharge, too" episode has a ~2-minute demo, voiced by two synthetic OpenAI TTS hosts (zh-CN and en-US files in `public/audio/`; other locales hear English and are told so). The audio itself opens with an AI/demo disclosure, the UI labels it "AI 合成演示音频", and the disclosure under the deck states the hosts are not real people or experts and the content awaits professional review. Episodes without audio let the arm drop, then return it with a notice. Never present demo audio as an expert recording.

## Conversation UI
Chat uses a quiet sage canvas, white incoming bubbles and forest outgoing bubbles. Rounded asymmetric corners identify the speaker; readable 15–16px text replaces small editorial typography. A restrained translucent header and floating pill composer provide the control layer, with opaque message content. Source details expand below the response and recommendations remain secondary. Mobile input stays at 16px to avoid focus zoom; primary controls are at least 44px. Respect reduced motion/transparency settings. Keep demo/safety labels, provenance and service limitations visible.

References: [iOS 27](https://www.apple.com/os/ios/) and [Apple HIG Materials](https://developer.apple.com/design/human-interface-guidelines/materials). This is a web adaptation, not native Liquid Glass rendering.

The brand illustration appears in sidebar branding, not in chat headers or per-message avatars. Chat controls overlay the scrolling canvas with visible frosting, white edge highlights and restrained sage/cream variation behind them. Composer height is measured so content remains scrollable above the floating input.

## English typography

English uses a system sans-serif for controls and conversation, Georgia for editorial titles. Headings use 1.25–1.3 line height with restrained negative tracking; prose uses 1.65–1.7. Book titles wrap at word boundaries without preserving Chinese line breaks. Recommendations flow as a complete English sentence. Keep source notes readable at 11px, wrap reading actions, and give search placeholders enough width. English rules are scoped to `en-US`; switching languages restores that language's typography. Align desktop consultation actions across cards and reserve space beneath video copy for the self preview.

## Chinese book covers

Chinese cover titles preserve authored line breaks. Their font size scales with the cover's content width using container units so the longest curated seven-character line fits, including punctuation. Covers use consistent heights (285px desktop, 245px mobile, 225px below 350px), with flexible illustration space; title length must not stretch an individual shelf. These rules are scoped to `zh-CN`, preserving the separate English typography. Longer managed titles may use up to three cover lines; the full title remains in the reading label and book information.


## Community programs
Real New Haven annual projects continue the sage, clay and warm paper cards. Status chips distinguish announced schedules from next editions awaiting confirmation. Official source links, verification dates and the difference between Bloomie interest and organizer registration remain visible. The admin community workspace reuses the content studio typography, forms and frosted action area. RSVP personal data is restricted to administrators.

## Voice input
An empty composer shows a sage microphone with press-and-hold input. Recording and transcription use a subtle sage, cream and clay light ring around the existing frosted capsule; the upward send gesture strengthens the forest control. Release normally returns editable words. Status and privacy copy support all five interface locales, independently of the language spoken. Reduced motion keeps the ring static; controls support keyboard hold/release and Escape cancellation.

## Today Together and Weekly Family Circle

Chat activity attachments use a light translucent surface with a compact identity/date header, separate title and review status, age/duration chips, numbered step rows, and a quiet rationale inset. Multiple age recommendations have section dividers. The footer keeps browser-only storage disclosure beside a simple navigation action. Material styling never reduces text readability or hides editorial review status.

Four main tabs retain the same quiet navigation. Daily activities use warm paper cards, a restrained ceramic sun, sage category icons and numbered steps; frosted weekly review shows seven gentle dots. No scores, streaks, comparisons or missed-day penalties. Age selection permits multiple children without names or birthdays. Activity drafts and local-only storage remain visible. Family circle cards reuse the care palette and ceramic shapes, with persistent sample labels, intent-only RSVP disclosure and tentative calendar downloads. Mobile preferences are reachable from a small header control. Content is bilingual Chinese/English; other selected languages currently use the English activity copy.

## First visit

A first-visit introduction uses the existing cream, sage and forest palette, a frosted entry card and a smiling ceramic planter animated in CSS/SVG. Language selection precedes the introduction and remains available during the 1.8-second wordless opening. The Bloomie icon and wordmark then appear in the center and animate as one element into their measured header position over 1.3 seconds before the page content appears. Visitors without a saved language follow their browser’s preferred supported language, with English fallback; an explicit saved choice takes precedence. All five languages cover the introduction. Animation can be skipped and reduced-motion preferences bypass it. Email login and guest exploration are both available; optional age groups reuse browser-only preferences without names or birthdays. Returning visitors and authenticated users enter the app directly. Mobile places the entry card before feature details to keep the path short.

## Multilingual typography

Spanish shares Latin-script heading, prose and flexible-control rules with English. Japanese uses Japanese system sans-serif for UI and Mincho for editorial headings, strict punctuation-aware line breaks and 1.85 prose line height. Korean uses Korean system fonts, keeps words together when possible and breaks overlong words only to prevent overflow. Chinese cover metrics remain separate. Spanish, Japanese and Korean book titles flow naturally within consistent cover heights; long cover titles may use four lines while the complete title remains below the cover and in the reader. Reading actions, source metadata and localized controls wrap without squeezing icons. Bookmarks align beside the title. Introduction copy follows the same language-specific rhythm.
