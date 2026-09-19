# Pre-launch checklist

Everything below is a deliberate placeholder or draft, shipped per the brief's own cadence
("build now with placeholders, swap client data in later turns" — see `brief/HANDOFF.md` §5
and `brief/06_open_questions.md`). None of it blocks development or a staging deploy; all of
it should be resolved before the site goes live publicly.

## Credentials (site won't fully function without these)
- [ ] `PUBLIC_WEB3FORMS_ACCESS_KEY` — create a free Web3Forms account, get the key. Until set,
      the booking form shows a visible dev-mode notice instead of delivering submissions.
- [ ] `PUBLIC_GA4_ID` — GA4 measurement ID.
- [ ] `PUBLIC_META_PIXEL_ID` — Meta Pixel ID.
- [ ] `PUBLIC_TURNSTILE_SITE_KEY` — Cloudflare Turnstile site key (booking form anti-spam;
      the honeypot field works without it, Turnstile is additional).
- [ ] Vercel/DNS access confirmed for `cedarstrailriding.com`.

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

## Rights / legal
- [ ] Confirm usage rights for the 3 TripAdvisor photos currently live in the gallery/hero
      (`public/images/gallery/`, sourced from `brief/assets/`) — see `brief/07_image_assets.md`
      section A. Assumed to belong to the client but not yet confirmed in writing.
- [ ] Native speaker review of all AR/FR copy — current translations are MT-quality drafts from
      `brief/12_translation_pack.md`, plus a handful of build-added strings noted in
      `src/i18n/REVIEW_NOTES.md`. Any key not present in `src/i18n/locales/{ar,fr}.json`
      currently falls back to English by design — extend those files as translations are approved.

## Hero video
- [ ] Client sign-off on the hero clip: it is AI-generated ("Powerful Brown Horse Galloping
      Through a Sunlit River in a Forest" by AMRULQAYS, Pixabay id 230717). Re-verify the Pixabay
      Content License / attribution requirements at publish time and decide whether to disclose
      "AI-generated" on the site. Replace with real CTR footage when available
      (`scripts/encode-hero.sh` regenerates all hero assets from a new master; shipped command:
      `DESKTOP_CRF=26 scripts/encode-hero.sh <master.mp4> 0.8 0.05`).
- [ ] Native review of new hero copy (EN Act II/III + AR/FR `hero.*`), see `src/i18n/REVIEW_NOTES.md`.
- [ ] Phone crop pans 0.8→0.05; at ~2.8 s the portrait crop cuts the horse's head — accepted, revisit with real footage.
- [ ] Lighthouse on `/`, `/ar/`, `/fr/` at 375px and 1440px (LCP < 2.5s, CLS < 0.1) — the
      authoritative item, with measured numbers; re-run it at launch on the real (not local) build.
      Measured 2026-09-19 (Lighthouse 13.5.0, local build): mobile simulated-throttling LCP ≈ 3.7 s
      on all three locales and also on `/faq/` (hero-free control 3.68 s), so a site-wide baseline,
      likely render-blocking CSS/fonts; DevTools-throttled LCP for `/` = 2.23 s; desktop LCP ≈ 0.76 s;
      mobile CLS 0.000. Desktop CLS was 0.087 on `/`, `/ar/`, `/fr/` (0.000 on `/faq/`), caused by the
      hero's static→scrub switch pushing the next section out of the first viewport; fixed by making
      the static stage fill the viewport, after which desktop Lighthouse CLS is 0.000 on `/` (3 runs),
      `/ar/` and `/fr/` (desktop LCP 0.76-0.77 s). Action: investigate site-wide critical CSS / font
      loading before launch.
- [ ] Real-device pass: iPhone Safari and a mid-range Android on real mobile data. Check the
      poster→canvas seam, whether the hero video actually decodes and scrubs (iOS may not decode
      an element that is never attached/played), and whether the 2.37 MB mobile fetch is acceptable.
      Also: landscape phones currently receive the 4.68 MB desktop encode — decide whether to key
      the source on the smaller viewport dimension / `(pointer: coarse)`.
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
- [ ] `npm run check` and `npm run test:e2e` both currently pass — re-run after any content
      swap above.
- [ ] Replace `public/og-image.jpg` (currently a TripAdvisor photo reused as a placeholder)
      with a purpose-made 1200×630 OG image once hero imagery is finalized.
- [ ] Swap the stylized Lebanon outline in `src/components/LebanonMap.astro` (hand-approximated,
      not survey-accurate) for a proper traced map if the client wants pixel-perfect geography.
