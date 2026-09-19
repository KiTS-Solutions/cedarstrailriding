# Scroll-scrub "Trail Chapters" hero — design

Status: approved in chat 2026-09-19; pending written-spec review.
Source prototype: `horse-hero/` (index.html, drop-in.html, assets/).

## As-built deviations

Where the shipped hero differs from this spec (the rest of the document is unchanged):

- Posters are WebP only (no AVIF); the poster is video frame t=0.
- The static hero fills the viewport (no compact static hero) — this removed the desktop CLS.
- Light shafts (CSS gradient) shipped instead of CSS pollen.
- Asset filenames: `poster-{desktop,mobile}.webp` and `ride-{desktop,mobile}.mp4`; desktop encode CRF 26.
- Soft snap excludes the first chapter (the start position); snap is also suppressed while a
  pointer or finger is held.
- Measured numbers and open launch items: README "Hero" section and `PRELAUNCH_CHECKLIST.md`.

## Decisions (from interview)

| Topic | Decision |
| --- | --- |
| Clip role | Final hero. Clip is AI-generated (Pixabay id 230717) → licence/AI-disclosure item added to `PRELAUNCH_CHECKLIST.md`. |
| Mobile | Scrub only on capable devices; otherwise poster + compact static hero. Video loads lazily only when scrubbing is enabled. |
| Copy | Keep all 3 acts. II/III are new copy → AR/FR added, logged in `src/i18n/REVIEW_NOTES.md`; unsupported claims (e.g. river crossings) checked against `src/data/trails.ts` and softened. |
| Direction | "Trail Chapters": vertical chapter rail on inline-start edge (01 Shouf · 02 River · 03 Ride). |
| Extras | Push-in + warm grade; scroll hand-off into trails section; sticky Book/WhatsApp pill after Act I; location readout from `siteSettings` coordinates; chapter deep-links + soft snap; Skip-intro link; ambient life; analytics events. |
| Video | Two all-intra encodes: 1280×720 desktop, ~9:16 portrait crop for phones (crop frame confirmed with user before encoding). 4K master stays out of `public/`. |
| Water FX | Phase 1: 2D canvas droplets/mist driven by scroll velocity + CSS pollen/light shafts. Phase 2 (optional): desktop-only lazy Three.js water layer, only after phase 1 passes budgets. |

## Architecture

- `src/components/ScrollHero.astro` replaces the hero `<section>` in `src/sections/HomeSection.astro` (trust bar stays). Reuses `Header.astro`; the prototype's own mini-header is dropped.
- `src/scripts/scroll-hero.ts` — dependency-free strict TS. One rAF loop writes `--p` (0–1) to the runway; CSS derives rail fill, push-in (1→1.08), grade, act opacity/translate (transform + opacity only). Video seek via `currentTime` with the prototype's 0.018s threshold; canvas cover-draw.
- `src/scripts/hero-fx.ts` — 2D particle layer (droplets/mist), spawn rate ∝ scroll velocity, capped particle count, paused when hero off-screen.
- Native `animation-timeline` is NOT used for scrubbing (cannot seek video; unsupported in Firefox). Single JS path keeps all browsers identical.
- Capability gate (`canScrub`): no `prefers-reduced-motion`, no `Save-Data`, `effectiveType` not 2g/3g, `deviceMemory` ≥ 4 when reported. Fails → static hero (no runway height, poster only, video never fetched).
- Runway height: 480vh desktop, shorter on mobile (tuned in testing). Sticky stage uses `100svh`/`100dvh`.

## i18n / RTL / facts

- All strings in `src/i18n/locales/{en,ar,fr}.json` under `hero.*`; `useTranslations()` only. Act I reuses existing keys (`brand.hero`, `home.eyebrow`, `home.heroSub`, `cta.*`, `label.*`).
- Brand rendered as "Cedars Trail Riding" (prototype's "Cedar Trail Riders" is wrong).
- Contact/rating/coordinates from `siteSettings`; no hardcoded facts, no prices.
- Logical properties throughout (`start`/`end`, `ps-*`, `text-start`); rail and act alignment mirror in `/ar/`; letter-spacing reset to 0 in Arabic; rail/act order verified at `dir="rtl"`.

## Accessibility

- Single `<h1>` (Act I); Acts II/III are `<h2>` and stay in the DOM and reading order (no `aria-hidden`).
- Canvas and FX are `aria-hidden`; rail is a `nav` with labelled links; "Skip intro" link jumps to `#trails`.
- Reduced motion: no runway, no video, no FX; static hero over poster.
- Focus never lands on a visually hidden act (acts not in view are `inert`).

## Performance budgets

- Poster: real `<img fetchpriority="high">`, AVIF + WebP; LCP < 2.5 s, CLS < 0.1 at 375px and 1440px (Lighthouse before delivery).
- Video not preloaded in `<head>`; requested after first paint only when `canScrub`.
- Desktop ≤ ~5 MB, mobile target ≤ ~2.5 MB.
- No new runtime dependency in phase 1.

## Analytics

Through existing env-gated GA4/Meta hooks in `BaseLayout.astro` (no tag when ID unset): `hero_chapter_reached`, `hero_cta_click`, `hero_skip`.

## Testing

Extend `tests/smoke.spec.ts` (no second suite): hero renders in en/ar/fr; `/ar/` rail is RTL; skip link reaches `#trails`; deep-link `#river` scrolls to the chapter; no pricing/Tennessee text; reduced-motion emulation shows static hero with no video request. Then `npm run check`, `npm run build`, Lighthouse.

## Assets / housekeeping

- Outputs: `public/images/hero/{poster.avif,poster.webp,ride-desktop.mp4,ride-mobile.mp4}`.
- Encode script committed at `scripts/encode-hero.sh` (ffmpeg, all-intra) for reproducibility.
- `PRELAUNCH_CHECKLIST.md`: add clip licence/AI-disclosure sign-off + native review of new AR/FR strings.
- `horse-hero/` left as untracked source; not shipped.

## Out of scope

Sound, replacing other homepage sections, real 3D in phase 1.

## Open assumptions to flag

- Portrait crop framing is unconfirmed until the frame preview.
- `deviceMemory`/`connection` APIs are Chromium-only; absence is treated as "capable".
- Pixabay licence terms for AI-generated content must be verified by the client at publish time.
