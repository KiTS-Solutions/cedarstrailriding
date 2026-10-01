# Cedars Trail Riding — website

Trilingual (EN default · AR RTL at `/ar/` · FR at `/fr/`) static marketing site for Cedars
Trail Riding (CTR), an eco-equestrian tourism operator in Samqaniyeh, Beiteddine (Shouf,
Lebanon). Built with [Astro](https://astro.build) + Tailwind CSS, no backend, deployed as a
static site to Vercel.

The full research/content brief this site is built from lives in [`brief/`](./brief) — see
`brief/README.md` and `brief/HANDOFF.md` for the original spec, and
[`CLAUDE.md`](./CLAUDE.md) for repo-wide guidance if you're working on this with Claude Code.

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:4321.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server with hot reload |
| `npm run build` | Static build to `dist/` (all 3 locales, 27 pages) |
| `npm run preview` | Preview the production build (`astro preview` — see note below) |
| `npm run check` | TypeScript / Astro diagnostics (`astro check`) |
| `npm run test:unit` | Unit tests for the hero maths (`tests/unit/*.test.ts`, `node --test`) |
| `npm run test:e2e` | Playwright smoke tests against a freshly built site |

**Note on `astro preview`:** in this Astro version, `astro preview` (and `astro dev`) detach
into a managed background process rather than blocking in the foreground — check status with
`astro preview status` / stop with `astro preview stop`. Playwright's tests don't use this;
they serve `dist/` directly via `scripts/static-server.mjs` (a tiny foreground static server)
so the test run behaves predictably in CI.

## Environment variables

Copy `.env.example` to `.env` and fill in credentials as they become available. Every
integration below is optional at build time — the site works correctly with none of them set:

| Variable | Purpose | Where to get it |
|---|---|---|
| `PUBLIC_WEB3FORMS_ACCESS_KEY` | Booking form submission (`/contact/`) | https://web3forms.com |
| `PUBLIC_GA4_ID` | Google Analytics 4 | GA4 property settings |
| `PUBLIC_META_PIXEL_ID` | Meta Pixel | Meta Events Manager |
| `PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile bot protection on the booking form | Cloudflare dashboard |

Without `PUBLIC_WEB3FORMS_ACCESS_KEY`, the booking form renders a visible dev-mode notice
instead of silently failing to deliver submissions.

## Project structure

```
src/
  data/          Typed data modules (trails, experiences, horses, testimonials, FAQ, gallery,
                 JSON-LD builders) — sourced from brief/05_site_facts.json, the canonical spec.
  i18n/          Locale dictionaries (en/ar/fr) + the t() translation helper and route helpers.
  layouts/       BaseLayout.astro — head/meta/OG/JSON-LD, header, footer, lang+dir per locale.
  components/    Reusable UI: Header, Footer, cards, FAQ accordion, booking form, etc.
  sections/      Full page bodies (e.g. HomeSection.astro), shared across the en/ar/fr route
                 files so content logic lives in one place per page.
  pages/         Thin per-locale route files: src/pages/trails/index.astro (en),
                 src/pages/ar/trails/index.astro, src/pages/fr/trails/index.astro, etc.
```

## Hero

The home page opens with a one-screen autoplaying video hero (`src/components/ScrollHero.astro`,
controller `src/scripts/scroll-hero.ts`, ambient particles `src/scripts/hero-fx.ts`, pure timing
maths `src/scripts/hero-math.ts`; the file names predate the switch from scroll-scrubbing).

- **Playback:** the clip autoplays muted on a seamless 13 s loop. The three acts (intro → Ridge →
  Ride) cross-fade in time with its three shots, and the 01/02/03 rail follows along (vertical in
  the inline-start gutter on wide screens, a row along the bottom on phones). A rail click or a
  `#ridge` / `#ride` deep link jumps the loop to that act. The video pauses when off screen, in a
  hidden tab, while keyboard focus is inside the copy, or via the pause/play button (WCAG 2.2.2);
  if the browser refuses autoplay the poster stays and the button offers Play. A clip that fails
  to load drops the hero back to static.

- **Two footage variants**, switched by `HERO_VARIANT` in `src/data/heroMedia.ts`:
  - **v2 (live):** CTR's own vertical (9:16) footage shot for the site. Phones in portrait get it
    full-bleed; anything wider than 4:5 gets a full-height 3:4 panel (a 3:4 window on the 9:16
    footage) at the inline end over a lightly softened copy of the same frame, with all three acts
    on the inline-start side (mirrors in RTL). Each shot is a real-time ~4–5 s slice (no
    speed-up). 24 fps playback encodes: 2.5 MB desktop panel, 1.2 MB phone / 3g, 0.5 MB landscape phone.
    Chapters Shouf → Ridge → Ride, golden-hour dust particles. Assets in `public/images/hero/v2/`.
  - **v1 (fallback, tag `hero-v1`):** the AI-generated landscape river clip, full-bleed everywhere,
    chapter "River", water-splash particles. Assets in `public/images/hero/v1/`, unchanged.
- **The same v2 master also feeds** the first-visit welcome screen (`src/components/WelcomeLoader.astro`
  + `src/scripts/welcome-loader.ts`, home pages only, once per session; plays at least 5 s with scrolling
  held (Skip / Escape always work), leaves once the hero is ready (cap 8 s) with a staged 1.25 s
  dissolve; skipped for reduced motion / Save-Data / 2G / deep links; CSS fail-safe fade at 8.7 s), two ambient loops
  (`src/components/AmbientVideo.astro` + `src/scripts/ambient-video.ts`) in the Treks band and the
  Groups block, on the home page and on `/treks/` and `/groups/`, and the gallop loop (the
  flag-bearer sprinting at the camera) behind the home page's About band.
- **Regenerate v2** (hero loop, loader loop, ambient loops, posters) from the master:
  `scripts/encode-hero-v2.sh horse-hero-v2/horse-lebflag.MOV`. The script documents the shot map
  (4 takes cut at 33.3 / 60.6 / 67.8 s → 6 clips) and solves the hero loop's segment lengths so each shot
  crossfade lands on an act hand-off; the loop's tail crossfades into frame 0 so it has no seam (`HERO_SEGMENT_BOUNDARIES` in `hero-math.ts`, unit-tested).
  The 150 MB `.MOV` is git-ignored (over GitHub's 100 MB file limit) — keep it with the client's media.
- **Regenerate v1** from its 4K master: `DESKTOP_CRF=26 scripts/encode-hero.sh <master.mp4> 0.8 0.05`
  (writes to `public/images/hero/v1/`). That master lives outside the repo as
  `horse-hero/assets/horse-river-original.mp4` in the client's working copy.
- **Tests:** `npm run test:unit` (hero maths), `npm run test:e2e` (hero smoke tests in `tests/smoke.spec.ts`).
  The e2e suite builds and serves `dist/` on port 4399 (override with `PORT=…`), not Astro's
  4321, because Playwright reuses whatever already answers on its port — a running `astro dev`
  there would be tested instead of the production build.
- **Capability gate:** `prefers-reduced-motion`, Save-Data, a 2g effective connection, or
  `deviceMemory < 4` get the static hero (poster + Act I, no video request); everyone else gets
  play mode. A "3g" estimate is *not* excluded — Chrome reports it for any RTT over ~270 ms, which
  is ordinary broadband in Lebanon — it gets the 540p clip instead. Ambient clips further down the
  page wait for the `load` event (which waits for the hero's first frame), so the hero gets the
  bandwidth first.
- **Licence:** v2 is the client's own footage (rider consent still to confirm); v1 is AI-generated.
  See `PRELAUNCH_CHECKLIST.md` (Hero video) for both sign-off items.
- **Measured performance, v2 (2026-10-01, Lighthouse 13.5.0, local uncompressed static build):**
  mobile LCP 2.25–2.40 s on `/`, `/ar/`, `/fr/` with the welcome screen (2.18 s without it; `main`
  with v1 measured 1.88 s the same day), 1.65 s on `/treks/` and `/groups/`; desktop LCP 0.4–0.58 s;
  CLS 0.000 everywhere. Re-measure on the Vercel build (brotli shrinks the larger HTML/CSS delta).
- **Measured performance (2026-09-19, Lighthouse 13.5.0, local static build, headless Chromium, 3 locales):**
  mobile with default simulated throttling LCP ≈ 3.7 s (a hero-free page such as `/faq/` measures 3.68 s
  under the same settings, so this is a site-wide baseline); with DevTools throttling `/` mobile LCP is
  2.23 s; desktop LCP ≈ 0.77 s with CLS 0.000 on `/` (3 runs), `/ar/` and `/fr/` after the static stage was
  made to fill the viewport (it was 0.087 before; see `PRELAUNCH_CHECKLIST.md`). Budgets
  (LCP < 2.5 s) are **not** yet met under simulated mobile throttling.

## Deployment (Vercel)

1. Import this repo into Vercel — framework preset "Astro" is auto-detected.
2. Set the environment variables above in the Vercel project settings.
3. `vercel.json` carries the redirects for retired WordPress URLs
   (`/sample-page/`, `/hello-world/`, `/category/uncategorized/`).
4. `sitemap.xml`/`sitemap-index.xml` and `robots.txt` are generated automatically on build.

## Before this goes live

See [`PRELAUNCH_CHECKLIST.md`](./PRELAUNCH_CHECKLIST.md) — content, translations, and
credentials still owed by the client, per `brief/06_open_questions.md`.
