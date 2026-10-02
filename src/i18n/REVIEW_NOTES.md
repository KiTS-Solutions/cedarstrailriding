# Translation review notes

> **All AR/FR translations approved — 2026-10-01.** This covers every string currently in
> `ar.json` / `fr.json`, both the translation-pack transcriptions and the build-added strings
> listed below (the list stays as provenance). Strings added after this date need their own
> review: log them here. Not covered (copy, not translation): client sign-off on the new
> **EN** hero Act II/III and v2 ridge/loader copy (`hero.*`, `hero.v2.*`, `loader.*`).

Most `ar.json` / `fr.json` strings are transcribed verbatim from
`brief/12_translation_pack.md` (client-review drafts, MT-quality per that file).

Strings below were **added by the build** (not present in the translation pack); they were
approved in the same 2026-10-01 pass:

- `form.success` (AR/FR) — the brief's success message promised a 24h WhatsApp reply
  ("Request sent! We'll reply on WhatsApp within 24 hours."). The build shipped a softer,
  no-fixed-SLA version instead (per this session's decision), so the AR/FR wording here is
  a fresh translation of that softer EN string, not from the brief.
- `footer.explore`, `footer.company`, `footer.contact`, `footer.follow`,
  `footer.siteLanguage`, `footer.lebanonMapLabel` (AR/FR) — footer chrome labels have no
  entry in the translation pack; these are straightforward draft translations.
- `home.eyebrow`, `home.trustBar`, `label.ratedGoogle`, `label.languages`,
  `label.operateAllLebanon` (AR/FR) — hero trust-bar/chip microcopy, added so the hero
  doesn't visually mix English fragments into an AR/FR page; draft translations, not from
  the brief.
- `nav.menu`, `nav.close`, `a11y.skip` (AR/FR) — mobile menu button/drawer labels and the
  skip-to-content link, added by the mobile pass; draft translations.
- `hero.*` (AR/FR, all 14 keys) — scroll-hero chapter labels, Act II/III story copy, skip link,
  location caption and scroll cue. Not in the translation pack; fresh draft translations.
  EN Act II/III copy is also new (not in the brief) and needs client sign-off.

Any key NOT present in `ar.json`/`fr.json` at all (e.g. most `about.*`, `treks.*`, gallery
copy) intentionally falls back to English via `useTranslations()` — per the translation
pack's own instruction #3, don't ship broken/half-translated AR or FR. Extend the locale
files as the client approves more translated copy.
- `nav.menu` (AR/FR) — mobile menu label added by the mobile UX pass.
- 46 strings added to AR/FR by the mobile/i18n pass (2026-09-20): home rides/treks/groups cards, trails intro, about, gallery, contact.hours, all form select options + consent/disclaimer, treks/horses placeholders. Draft-quality; needs native review. "REAF"/"Berytech" kept untranslated.
- `trail.<id>.descriptor` for pine/beit-eddine/panoramic/rocky/custom and `trail.<id>.duration` (AR/FR) — drafts.
- `hero.v2.chapter2`, `hero.v2.act2.body`, `loader.welcome`, `loader.skip` (EN/AR/FR, 2026-10-01) —
  v2 hero footage (ridge, not river) and the welcome screen. New EN copy, not in the brief: needs
  client sign-off; AR/FR are drafts. The v1 `hero.chapter2` / `hero.act2.body` ("River") stay for
  the fallback variant.
- `hero.pause`, `hero.play` (EN/AR/FR, 2026-10-01) — accessible labels for the autoplaying
  hero's pause/play button (replaces the removed `hero.scrollCue`). AR/FR are drafts.
- `footer.credit.by`, `footer.credit.pitch`, `footer.credit.whatsapp` (EN/AR/FR, 2026-10-01) — the
  KiTS agency credit in the footer (`SiteCredit.astro`). Agency copy, not client copy; AR/FR are
  drafts.
- `nav.trailsDesc`, `nav.treksDesc`, `nav.groupsDesc`, `nav.aboutDesc`, `nav.galleryDesc`,
  `nav.faqDesc` (EN/AR/FR, 2026-10-01) — one-line descriptions under each item in the mobile menu
  drawer. Trails/treks/groups/about are trimmed from existing brief copy (`home.*CardDesc`,
  positioning) and their existing AR/FR translations; gallery and FAQ lines are new EN copy.
  **Approved 2026-10-01** (EN copy and AR/FR wording) — no further review needed for these six keys.
- `cta.exploreTreks` (EN/AR/FR, 2026-10-01) — replaces the home treks band's generic "Learn more"
  (Lighthouse link-text). Built from the existing `nav.treks` wording; AR/FR are drafts.
- `nav.horsesShort`, `nav.horsesDesc` (EN/AR/FR, 2026-10-02, redesign Phase 1) — Horses added to the
  main nav. `horsesShort` is the compact desktop label (AR/FR reuse the approved `nav.horses`
  wording); `horsesDesc` is the mobile-drawer line, trimmed from the approved `home.horsesIntro`.
  AR/FR `horsesDesc` are drafts.
- Removed 2026-10-02: `loader.welcome`, `loader.skip` (welcome screen dropped in the redesign).
- Redesign Phase 2 (EN/AR/FR, 2026-10-03) — **new EN copy needs client sign-off; all AR/FR are drafts**:
  - `a11y.breadcrumb` (page-band breadcrumb label), `trail.ask`, `trail.askMessage` (per-trail
    WhatsApp prefill, `{trail}` = trail name), `trail.level`, `trail.duration` (screen-reader labels).
  - `about.valuesHeading` + `value.<slug>` ×7 — the brief's value list (05_site_facts.json `values`),
    now translated instead of rendered in English on every locale. "inclusivity" → "Open to everyone",
    "safety" → "Safety first" (EN wording is new).
  - `gallery.soon`, `gallery.alt.*` ×8 — alt text moved from `src/data/gallery.ts` into i18n; the 5
    footage stills are described from the frames themselves.
  - `contact.mapTitle` — the map iframe title was hard-coded English.
  - Rewritten (client-facing leaks): `gallery.intro` (said "More imagery is on the way from the
    client") and `treks.feature.body` (said details were "being finalized with the client").

