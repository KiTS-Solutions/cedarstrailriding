# Pre-launch checklist

Everything below is a deliberate placeholder or draft, shipped per the brief's own cadence
("build now with placeholders, swap client data in later turns" — see `brief/HANDOFF.md` §5
and `brief/06_open_questions.md`). None of it blocks development or a staging deploy; all of
it should be resolved before the site goes live publicly.

## Credentials (site won't fully function without these)
- [x] `PUBLIC_WEB3FORMS_ACCESS_KEY` — done 2026-10-02: Web3Forms form created under
      `info@cedarstrailriding.com`; key set as repo variable; test booking from the Pages demo
      arrived in the `admin@` inbox (not spam). Vercel copy of the key still pending — see Hosting.
      Original note: create a free Web3Forms account, get the key. Until set,
      the booking form shows a visible dev-mode notice instead of delivering submissions.
      Register it to `info@cedarstrailriding.com` (HostGator alias forwarding to
      `admin@cedarstrailriding.com` — the key and every booking land in the admin mailbox).
      GitHub Pages demo: set it as repo variable `PUBLIC_WEB3FORMS_ACCESS_KEY` (read by
      `.github/workflows/pages.yml`). Vercel: set it again there at cutover.
      After the first live test, check that mailbox's Spam folder and whitelist the Web3Forms
      sender in cPanel -> Spam Filters if needed.
- [ ] `PUBLIC_GA4_ID` — GA4 measurement ID.
- [ ] `PUBLIC_META_PIXEL_ID` — Meta Pixel ID.
- [ ] `PUBLIC_TURNSTILE_SITE_KEY` — Cloudflare Turnstile site key (booking form anti-spam;
      the honeypot field works without it, Turnstile is additional).
- [ ] Vercel/DNS access confirmed for `cedarstrailriding.com` (DNS + email are at HostGator).

## Content still owed by the client (brief/06_open_questions.md)
- [ ] Founder name, story, founding year — About page currently shows mission copy only.
- [ ] Horse names + personalities + portrait photos — Horses page renders "coming soon" cards.
- [ ] Per-trail duration/distance/group size/age & weight limits (all 6 trails).
- [ ] Multi-day trek logistics: sleeping arrangements, meals, luggage transport, guide ratio.
- [ ] Seasonality table (which trails run which months).
- [ ] Verbatim testimonial approval — current quotes are paraphrased from public reviews
      (`src/data/testimonials.ts`); get sign-off on exact wording and attribution before launch.
- [x] Brand-family footer logos — resolved this session: 4 logos received (Cedars Trail Riding,
      Cedars Xtreme, Cedars Cycling, Cedars Outdoors), now rendered in the footer strip
      (`src/components/Footer.astro`, sourced from `public/images/brand/`). **Still needed:**
      confirm this is the complete list, and get the URL/Instagram handle for Cedars Cycling and
      Cedars Outdoors (currently shown unlinked — see
      `brief/05_site_facts.json` → `build_decisions.brand_family_footer`).
- [ ] Team photos/names (guide "Robin" is the only confirmed name so far).
- [ ] Hero, per-trail, trek, and group/corporate photography — see `brief/07_image_assets.md`
      and `brief/15_media_asset_list.md` for the full shot list; `src/data/gallery.ts` has the
      placeholder slots to fill in.
- [x] Logo file — resolved this session: a genuine transparent logo (`public/images/brand/ctr-logo.webp`)
      is live in the header. **Still needed:** client confirmation that this is the final approved
      version before public launch.
- [x] Header logo treatment — approved 2026-10-01: the header renders the logo split into its mark
      and wordmark (`public/images/brand/ctr-mark.webp` / `ctr-wordmark.webp`, cropped from
      `logo/ctr-1-1-scaled.webp`) so the name stays legible at header size.

## Rights / legal
- [ ] Confirm usage rights for the 3 TripAdvisor photos currently live in the gallery/hero
      (`public/images/gallery/`, sourced from `brief/assets/`) — see `brief/07_image_assets.md`
      section A. Assumed to belong to the client but not yet confirmed in writing.
- [x] AR/FR translations approved 2026-10-01 (all strings in the locale files). Original note: MT-quality drafts from
      `brief/12_translation_pack.md`, plus a handful of build-added strings noted in
      `src/i18n/REVIEW_NOTES.md`. Any key not present in `src/i18n/locales/{ar,fr}.json`
      currently falls back to English by design — extend those files as translations are approved.

## Hero video
- [x] Real CTR footage — 2026-10-01: the v2 hero and ambient loops now use the
      client's own vertical footage (`horse-hero-v2/horse-lebflag.MOV`, encoded by
      `scripts/encode-hero-v2.sh`). The AI clip below is kept as the v1 fallback only
      (`HERO_VARIANT` in `src/data/heroMedia.ts`, git tag `hero-v1`).
- [ ] Written confirmation that every rider recognisable in the v2 footage (hero, flag close-up,
      Treks/Groups loops) consents to appearing on the site, and that CTR owns the footage rights.
- [ ] Confirm the v2 footage location is the Shouf (assumed from the client's answer; the
      Act II copy says "across the Shouf").
- [ ] Keep the 150 MB master `horse-hero-v2/horse-lebflag.MOV` somewhere durable — it is
      git-ignored (over GitHub's 100 MB limit) and is the only source for re-encoding v2.
- [ ] Real-device check of the v2 hero (iOS low-power mode refuses autoplay: the poster should show
      instead) and of the ambient loops' play/pause on scroll.
- [ ] v1 fallback only — client sign-off on the hero clip: it is AI-generated ("Powerful Brown Horse Galloping
      Through a Sunlit River in a Forest" by AMRULQAYS, Pixabay id 230717). Re-verify the Pixabay
      Content License / attribution requirements at publish time and decide whether to disclose
      "AI-generated" on the site. Replace with real CTR footage when available
      (`scripts/encode-hero.sh` regenerates all hero assets from a new master; shipped command:
      `DESKTOP_CRF=26 scripts/encode-hero.sh <master.mp4> 0.8 0.05`).
- [x] AR/FR hero translations (`hero.*`, `hero.v2.*`, `loader.*`) — approved 2026-10-01.
- [ ] Client sign-off on the new **EN** hero copy (Act II/III, v2 ridge chapter, loader) — not in
      the brief; see `src/i18n/REVIEW_NOTES.md`.
- [ ] v1 only: phone crop pans 0.8→0.05; at ~2.8 s the portrait crop cuts the horse's head (v2 is
      shot vertically, so no crop).
- [ ] Lighthouse on `/`, `/ar/`, `/fr/` at 375px and 1440px (LCP < 2.5s, CLS < 0.1) — the
      authoritative item, with measured numbers; re-run it at launch on the real (not local) build.
      v2 measured 2026-10-01 (local, uncompressed): mobile LCP 2.25–2.40 s on `/`, `/ar/`, `/fr/` with
      the welcome screen (2.18 s without; v1 on `main` 1.88 s the same day), desktop 0.5–0.58 s,
      CLS 0.000 on all. Passes the budget but with less headroom than v1: if the Vercel run lands
      above 2.5 s, the first levers are dropping the welcome screen on phones or trimming its CSS.
      Measured 2026-09-19 (Lighthouse 13.5.0, local build): mobile simulated-throttling LCP ≈ 3.7 s
      on all three locales and also on `/faq/` (hero-free control 3.68 s), so a site-wide baseline,
      likely render-blocking CSS/fonts; DevTools-throttled LCP for `/` = 2.23 s; desktop LCP ≈ 0.76 s;
      mobile CLS 0.000. Desktop CLS was 0.087 on `/`, `/ar/`, `/fr/` (0.000 on `/faq/`), caused by the
      hero's static→scrub switch pushing the next section out of the first viewport; fixed by making
      the static stage fill the viewport, after which desktop Lighthouse CLS is 0.000 on `/` (3 runs),
      `/ar/` and `/fr/` (desktop LCP 0.76-0.77 s). Action: investigate site-wide critical CSS / font
      loading before launch.
      **Measured 2026-10-01 after the header redesign, on the deployed GitHub Pages demo** (real CDN,
      compressed; Lighthouse 13.5.0, median of 3 runs, welcome screen included on home):
      mobile LCP 1.47 s `/`, 1.50 s `/ar/`, 1.45 s `/fr/`, 0.92 s `/trails/`; desktop LCP 0.30–0.41 s;
      CLS ≤ 0.011 everywhere (0.000 on mobile); TBT ≤ 9 ms. Performance score 94–100. Passes the
      budget with headroom. Still to do: the same run on the Vercel production domain at launch.
- [ ] Real-device pass: iPhone Safari and a mid-range Android on real mobile data. Check the
      poster→video fade, that the hero autoplays (iOS Low Power Mode refuses autoplay: the poster
      and a Play button should show), and whether the mobile fetch is acceptable (v2 autoplay loop:
      1.2 MB phone / 3g, 2.5 MB desktop panel, 0.5 MB landscape phone; v1 was 2.37 / 4.68 MB).
- [x] Site-wide LCP work — resolved 2026-09-20: cause was oversized eager brand logos (~545 KB -> ~50 KB after resize, lazy footer images, width/height). Local Lighthouse mobile LCP now 1.8 s `/`, 1.8 s `/ar/`, 2.0 s `/fr/`, 1.3 s `/faq/`; re-verify on the Vercel build. (Original note: render-blocking CSS/fonts and a preload of
      the LCP poster in the `BaseLayout` head. The hero is not the cause (hero-free `/faq/` control
      measures the same mobile LCP.)

## Technical QA before going live
- [ ] Re-run Lighthouse once real imagery replaces the placeholders — image weight will change
      the numbers. Targets and current measurements live in the "Hero video" Lighthouse item
      above (this is the launch-time re-run and is NOT done yet).
- [ ] Validate JSON-LD with Google's Rich Results Test (statically validated 2026-09-20; removed aggregateRating, fixed locale breadcrumb URLs; Google tool itself not yet run) (LocalBusiness/TouristTrip on
      home + contact, FAQPage on `/faq`, BreadcrumbList sitewide).
- [x] (audited 2026-09-20; fixed contact overflow at 375px and reversed English fallback text; `/ar/trails/` still mostly English, needs Arabic translation) Test every page at `dir="rtl"` (`/ar/...`) for layout mirroring issues.
- [x] Colour contrast — fixed 2026-10-01 (Lighthouse flagged brand-palette pairs site-wide). Added
      text-safe tokens in `global.css` (`gold-bright` on cedar 4.66:1, `gold-deep` on sand 4.73:1,
      `terracotta-deep` on terracotta tints ≥ 4.68:1); `.btn-primary` text is now ink on gold
      (6.57:1, was cedar 4.13:1); `.form-note` ink/70 (5.52:1). Base gold/terracotta unchanged for
      fills, borders and decoration.
- [x] Lighthouse minor items — fixed 2026-10-01: `/trails/` cards are `h2` under the page `h1`
      (`TrailCard headingLevel`); home treks band link now reads "Explore multi-day treks". SEO
      58–66 on the demo is only the deliberate `noindex` (`PUBLIC_NOINDEX` in `pages.yml`);
      production builds don't set it.
- [ ] `npm run check` and `npm run test:e2e` both currently pass — re-run after any content
      swap above.
- [ ] Replace `public/og-image.jpg` (currently a TripAdvisor photo reused as a placeholder)
      with a purpose-made 1200×630 OG image once hero imagery is finalized.
- [ ] Swap the stylized Lebanon outline in `src/components/LebanonMap.astro` (hand-approximated,
      not survey-accurate) for a proper traced map if the client wants pixel-perfect geography.

## Mobile UX (2026-09-20 pass)
- [x] Sticky bottom WhatsApp/Call bar (mobile), compact collapsible menu, 44px tap targets, booking-form input hints (autocomplete/inputmode/+961 placeholder), LTR phone numbers in AR, theme-color + viewport-fit.
- [x] `nav.menu` AR/FR label — approved 2026-10-01.
- [x] Landscape phones (`max-height:500px` + coarse pointer) now get a 1.5 MB 854x480 clip (`ride-compact.mp4`) instead of the 4.68 MB desktop one. Needs real-device check.
- [x] Favicon/apple-touch-icon/manifest icons generated from the CTR badge (replaced the default Astro favicon); hero small text raised to 13px.
- [ ] Still open: hero chips as a scrollable row, real-device test of the sticky bar below the one-screen hero. (2026-10-01: "3g" estimates now get the autoplay hero on the 540p clip; only 2g/Save-Data stay poster-only.)

## i18n completeness (2026-09-20)
- [x] All 142 EN keys now exist in AR and FR (46 + trail descriptors/durations added as drafts; no more silent English fallback on `/ar/` and `/fr/`).
- [x] AR/FR review of all newly added strings — approved 2026-10-01 (listed in `src/i18n/REVIEW_NOTES.md`).
- [ ] Testimonials (`src/data/testimonials.ts`) are English source reviews shown as-is on AR/FR pages — decide: keep original language with a label, or commission approved translations.

## Hosting (Vercel)
- [x] GitHub repo `KiTS-Solutions/cedarstrailriding` (private); Vercel project `cedarstrailriding` created (team "casio699's projects"), not yet linked to Git or deployed.
- [x] `vercel.json`: trailingSlash, immutable caching for `/_astro/*`, image/icon caching, baseline security headers. No CSP yet — add one once GA4/Meta Pixel/Turnstile/Web3Forms are finalized.
- [ ] Install/authorize the Vercel GitHub app for `KiTS-Solutions`, then Project Settings -> Git -> connect the repo (or run `vercel login` locally and `vercel deploy`).
- [ ] Set env vars in Vercel (Production + Preview): `PUBLIC_WEB3FORMS_ACCESS_KEY`, `PUBLIC_GA4_ID`, `PUBLIC_META_PIXEL_ID`, `PUBLIC_TURNSTILE_SITE_KEY`.
- [ ] Attach `cedarstrailriding.com` once DNS access is confirmed; the project has Vercel Auth (SSO) protection on by default, so disable it for public launch.
- [x] (confirmed 2026-10-02 via the Web3Forms test booking) `info@cedarstrailriding.com` exists in HostGator cPanel as a forwarder to
      `admin@cedarstrailriding.com`, and a test email from an outside address (e.g. Gmail) arrives.
- [ ] DNS stays at HostGator (site on Vercel, email on HostGator). In HostGator's zone editor change
      **only** the apex `A` record and the `www` `CNAME` to the values Vercel shows when the domain is
      attached. Do **not** touch MX / SPF / DKIM / DMARC records, and do **not** move nameservers to
      Vercel — either would break HostGator email. Screenshot the zone before editing.
