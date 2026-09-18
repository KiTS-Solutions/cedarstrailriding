# Translation review notes

Most `ar.json` / `fr.json` strings are transcribed verbatim from
`brief/12_translation_pack.md` (client-review drafts, MT-quality per that file).

Strings below were **added by the build** (not present in the translation pack) and need
the same native-speaker review pass before launch:

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
- `hero.*` (AR/FR, all 14 keys) — scroll-hero chapter labels, Act II/III story copy, skip link,
  location caption and scroll cue. Not in the translation pack; fresh draft translations.
  EN Act II/III copy is also new (not in the brief) and needs client sign-off.

Any key NOT present in `ar.json`/`fr.json` at all (e.g. most `about.*`, `treks.*`, gallery
copy) intentionally falls back to English via `useTranslations()` — per the translation
pack's own instruction #3, don't ship broken/half-translated AR or FR. Extend the locale
files as the client approves more translated copy.
