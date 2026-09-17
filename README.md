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

## Deployment (Vercel)

1. Import this repo into Vercel — framework preset "Astro" is auto-detected.
2. Set the environment variables above in the Vercel project settings.
3. `vercel.json` carries the redirects for retired WordPress URLs
   (`/sample-page/`, `/hello-world/`, `/category/uncategorized/`).
4. `sitemap.xml`/`sitemap-index.xml` and `robots.txt` are generated automatically on build.

## Before this goes live

See [`PRELAUNCH_CHECKLIST.md`](./PRELAUNCH_CHECKLIST.md) — content, translations, and
credentials still owed by the client, per `brief/06_open_questions.md`.
