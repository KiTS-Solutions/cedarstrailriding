# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

A runnable Astro project now lives at the repo root (scaffolded this session — see
`README.md` for setup/scripts and `PRELAUNCH_CHECKLIST.md` for what the client still owes).
Git is initialized.

Contents:
- `src/` — the Astro app (data layer, i18n, layouts, components, sections, pages). See
  README.md § Project structure for the shape.
- `brief/` — the original research/build brief (renamed from `cedars-trail-riding/`; numbered
  `.md`/`.json` files + `assets/` with 3 usable photos). Still the source of truth for content —
  read it, don't duplicate its facts elsewhere except through `src/data/siteSettings.ts` and
  `src/i18n/locales/*.json`, which are transcribed from it.
- `image-search/` — raw scraped competitor/reference photos (research artifacts, rights
  unconfirmed — do not ship these in the site; visual reference only).
- `ctr_home.html` — a captured Cloudflare "Just a moment..." challenge page from trying to
  scrape `cedarstrailriding.com`; not real site content. Safe to ignore/delete.

## What this project is

A trilingual (EN / AR-RTL / FR), 9-page static **Astro** site for Cedars Trail Riding (CTR), an
eco-equestrian tourism operator in Samqaniyeh, Beiteddine (Shouf, Lebanon). Tailwind CSS, no
backend, deployed to Vercel. Full context: `brief/README.md` and `brief/HANDOFF.md`.

## Where content/facts come from

`brief/05_site_facts.json` is still canonical — `src/data/siteSettings.ts` imports it directly
(don't hardcode brand/contact facts elsewhere). `null` fields there are genuinely unknown; render
"coming soon" states, never invented values. Other brief files worth knowing:

- `brief/09_content_model.md` — data types & page↔entity map (basis for the types in `src/data/*.ts`)
- `brief/10_sitemap_navigation.md` — routes & nav structure (implemented in `src/pages/`)
- `brief/08_homepage_content.md` / `brief/03_messaging_and_copy.md` — EN master copy
- `brief/12_translation_pack.md` — EN/AR/FR strings (transcribed into `src/i18n/locales/*.json`;
  see `src/i18n/REVIEW_NOTES.md` for which strings were added beyond the brief and still need
  native review)
- `brief/07_image_assets.md` / `brief/15_media_asset_list.md` — image status (see
  `src/data/gallery.ts` for the placeholder slots still open)
- `brief/06_open_questions.md` — everything still pending from the client (mirrored into
  `PRELAUNCH_CHECKLIST.md`)

## Locked build decisions (do not re-litigate without client input)

- **Stack:** Astro (static output), Tailwind CSS v4, minimal client JS, no backend.
- **Hosting:** Vercel, domain `cedarstrailriding.com`.
- **Languages:** EN default at `/`, AR (RTL) at `/ar/`, FR at `/fr/` via Astro's built-in i18n
  routing (`astro.config.mjs`, `prefixDefaultLocale: false`). All copy goes through
  `src/i18n/locales/{en,ar,fr}.json` + `useTranslations()` — never hardcode English in
  components. Missing AR/FR strings fall back to EN automatically (`src/i18n/index.ts`).
- **Booking:** `src/components/BookingForm.astro` — Web3Forms (`PUBLIC_WEB3FORMS_ACCESS_KEY`) +
  honeypot + optional Cloudflare Turnstile (`PUBLIC_TURNSTILE_SITE_KEY`, renders only when set)
  + WhatsApp deep link (`wa.me/96170211041`) + `tel:` click-to-call. **No prices anywhere** —
  always "contact us for pricing" CTAs.
- **Analytics:** GA4 + Meta Pixel wired in `src/layouts/BaseLayout.astro`, both env-var driven
  (`PUBLIC_GA4_ID`, `PUBLIC_META_PIXEL_ID`); render tags only when the ID is set.
- **Contact facts** (render exactly, don't paraphrase): phones `+961 70 211 041` /
  `+961 76 004 686` (both WhatsApp-enabled), email `info@cedarsxtreme.com`, location "Samqaniyeh,
  Beiteddine | Shouf District — We operate all over Lebanon," coords `33.6864028, 35.5902012`.
- **Footer** (`src/components/Footer.astro`): inline SVG outline of Lebanon
  (`src/components/LebanonMap.astro` — stylized/hand-approximated, not survey-accurate) with a
  pin at the base coords, plus a brand-family strip rendering real logos for 4 confirmed brands
  (`siteSettings.brandFamily` — Cedars Trail Riding, Cedars Xtreme, Cedars Cycling, Cedars
  Outdoors; the latter two have no confirmed URL yet, so they render unlinked).
- **Logo:** a real transparent logo is in use (`public/images/brand/ctr-logo.webp`, referenced via
  `siteSettings.logoSrc`) — received directly into the project rather than scraped, since the
  live site is Cloudflare-gated. All 4 brand-family logos live in `public/images/brand/` (served,
  renamed meaningfully); `logo/` at the repo root holds the original as-received files for
  provenance and is otherwise unused by the app.
- **SEO:** per-page title/meta/OG + JSON-LD via `src/data/jsonld.ts` (LocalBusiness + TouristTrip
  on home/contact, FAQPage on `/faq`, BreadcrumbList sitewide). `BaseLayout.astro` throws a build
  error if "Tennessee" ever appears in page title/description as a guard against the "Cedars of
  Lebanon" collision (`brief/04_seo_and_audit.md`).
- **Accessibility:** WCAG AA target, native `<details>` FAQ accordion (keyboard-accessible by
  default), skip-to-content link, `lang`/`dir` set per locale.
- **Hero:** src/components/ScrollHero.astro + src/scripts/{scroll-hero,hero-fx,hero-math}.ts — scroll-scrubbed video with static fallback. Footage variant is `HERO_VARIANT` in `src/data/heroMedia.ts`: **v2** (live) = CTR's own vertical footage, portrait-panel layout on wide screens; **v1** = the old AI-generated landscape clip, kept as a fallback (git tag `hero-v1`). The v2 master (`horse-hero-v2/*.MOV`, git-ignored, ~150 MB) also feeds `WelcomeLoader.astro` (home only) and `AmbientVideo.astro` loops — regenerate everything with `scripts/encode-hero-v2.sh`. See README.md § Hero.

## Non-negotiables

- Never invent prices, team member names, horse names, or founding dates — render "coming soon" /
  placeholder states instead (see `src/data/horses.ts`, `about.storyPending` key).
- Never reference or use imagery from the Tennessee "Cedars of Lebanon" state park/stables.
- Don't hardcode English strings inside components — route everything through
  `src/i18n/locales/*.json` + `useTranslations()`.
- `image-search/` is competitor/reference research only, not licensed site assets. Only
  `brief/assets/*.jpg` (TripAdvisor photos, copied into `public/images/gallery/`) are in use, and
  only "pending rights confirmation" — see `PRELAUNCH_CHECKLIST.md`.

## Commands

```bash
npm install
npm run dev          # local dev server (astro dev — see note below)
npm run build        # static build to dist/, all 3 locales
npm run check        # astro check (TS strict)
npm run test:unit    # node:test unit tests for hero-math (tests/unit/)
npm run test:e2e     # Playwright smoke tests (tests/smoke.spec.ts)
```

**`astro dev` / `astro preview` detach into a managed background process** in this Astro
version rather than blocking in the foreground — use `astro dev status` / `astro dev stop` (or
the `preview` equivalents) to manage them. Playwright's tests don't use `astro preview`; they
serve `dist/` via `scripts/static-server.mjs`, a small foreground static server, so `webServer`
behaves predictably. If you manually start `npm run dev` or `npm run preview` in a session,
remember to `astro dev stop` / `astro preview stop` when done — orphaned background instances
otherwise keep holding port 4321.

## Testing conventions

`tests/smoke.spec.ts` covers: home renders, primary nav resolves, no Tennessee/pricing text
leaks onto the page, `/ar/` is RTL with Arabic nav, `/fr/` renders French nav, the language
switcher preserves the current route across locales, and the booking form has its required
fields + honeypot. Extend this file rather than starting a second suite for new smoke checks.
