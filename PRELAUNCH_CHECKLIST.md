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

## Technical QA before going live
- [ ] Run Lighthouse (target LCP < 2.5s, CLS < 0.1 per KiTS standards) once real imagery
      replaces the placeholders — image weight will change the numbers.
- [ ] Validate JSON-LD with Google's Rich Results Test (LocalBusiness/TouristTrip on
      home + contact, FAQPage on `/faq`, BreadcrumbList sitewide).
- [ ] Test every page at `dir="rtl"` (`/ar/...`) for layout mirroring issues.
- [ ] `npm run check` and `npm run test:e2e` both currently pass — re-run after any content
      swap above.
- [ ] Replace `public/og-image.jpg` (currently a TripAdvisor photo reused as a placeholder)
      with a purpose-made 1200×630 OG image once hero imagery is finalized.
- [ ] Swap the stylized Lebanon outline in `src/components/LebanonMap.astro` (hand-approximated,
      not survey-accurate) for a proper traced map if the client wants pixel-perfect geography.
