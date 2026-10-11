# Bloomie — Design system

Modern tactile design for Chinese caregivers of preschool children. One continuous experience across conversation, library, daily activities and care. The product name is Bloomie.

## Direction
Warm paper, ceramic objects, lightly frosted navigation, restrained dimensionality. Borrow iOS hierarchy, ColorOS fluidity, and Smartisan physical affordances; never copy proprietary assets. Avoid full-interface neumorphism: interactive edges remain visible.

## Tokens
- Background #f5f4ef; paper #fffefb; ink #293e38; secondary #69746c.
- Primary forest #38594c; sage #e5ebe1; clay #b87d64; peach #f2e5da.
- Text: PingFang SC / Microsoft YaHei; editorial headings: Songti SC / Noto Serif CJK SC. No external fonts.
- Body 15–16px, line height 1.75; page title 28px; display 38px desktop / 30px mobile.
- 4px spacing scale; 20–28px card radius, 12px controls, 44px touch targets.
- Soft shadows plus fine borders. Books have spines, paper edges and shelf shadows.
- Main shell fills the space beside the desktop 224px navigation; mobile uses a bottom tab bar. Reading and daily activity content can retain centered width limits for readability. Outer page headers and support sections follow the viewport width with balanced side padding.
- Motion 180–260ms; respect prefers-reduced-motion.

## Product rules
Demo services have persistent labels and explicit action confirmation. No fabricated qualifications, reviews, expert endorsement or appointments. Editorial provenance does not imply clinical review. Chat is ephemeral. Notifications are opt-in. Icon buttons have labels; modals trap and restore focus.

## References
- https://developer.apple.com/design/human-interface-guidelines
- https://www.coloros.com/version/coloros17/
- https://www.smartisan.com/os/ (legacy site did not render useful detail; historical inspiration only)

Initial direction: 2026-10-09, based on the authorized brief.

## Listening corner
Library includes reading and podcast formats. Turntable uses warm wood, brushed metal, vinyl grooves and paper sleeves; the same forest controls and muted palette continue across books and audio. Demo podcasts never imitate playback or imply expert recordings. Selection and local bookmarks work; the listening action explains missing audio and links to curated reading.

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
