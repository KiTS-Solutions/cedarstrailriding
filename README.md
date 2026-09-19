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

The home page opens with a scroll-scrubbed video hero (`src/components/ScrollHero.astro`,
controller `src/scripts/scroll-hero.ts`, ambient droplets `src/scripts/hero-fx.ts`, pure maths
`src/scripts/hero-math.ts`).

- **Assets:** `public/images/hero/` — `poster-{mobile,desktop}.webp` and `ride-{mobile,desktop}.mp4`
  (WebP posters only, no AVIF).
- **Regenerate** from a new master: `scripts/encode-hero.sh <master.mp4> <x0> <x1>` (`x0`/`x1` are the
  phone-crop pan start/end). The shipped command is
  `DESKTOP_CRF=26 scripts/encode-hero.sh <master.mp4> 0.8 0.05`. The 4K master is **not** in this repo;
  it lives outside it as `horse-hero/assets/horse-river-original.mp4` in the client's working copy.
- **Tests:** `npm run test:unit` (hero maths), `npm run test:e2e` (hero smoke tests in `tests/smoke.spec.ts`).
  If port 4321 is busy (e.g. a running `astro dev`), use `PORT=4399 npm run test:e2e` — the
  Playwright config builds and serves `dist/` on that port instead.
- **Capability gate:** `prefers-reduced-motion`, Save-Data, 2g/3g effective connection, or
  `deviceMemory < 4` get the static hero (poster, no video request); everyone else gets scrub mode.
- **Licence:** the clip is AI-generated; see `PRELAUNCH_CHECKLIST.md` (Hero video) for the sign-off item.
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
