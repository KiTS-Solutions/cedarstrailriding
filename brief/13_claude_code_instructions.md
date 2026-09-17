# 13 — Claude Code Build Instructions (handoff prompt)

Copy-paste the block below into Claude Code after placing this folder in your repo as `brief/`.

---

## Prompt for Claude Code

```
You are building the new website for Cedars Trail Riding (CTR), Lebanon's first
eco-equestrian tourism experience. Before writing any code, read these files in order:

1. brief/05_site_facts.json   — canonical facts (brand, contact, offers, build decisions)
2. brief/09_content_model.md  — data structures & page map
3. brief/10_sitemap_navigation.md — routes & nav
4. brief/08_homepage_content.md   — hero + section copy (EN master)
5. brief/03_messaging_and_copy.md — voice & extra copy
6. brief/12_translation_pack.md   — EN/AR/FR strings
7. brief/07_image_assets.md       — which images exist vs are placeholders
8. brief/11_booking_form_spec.md  — form fields & channels

BUILD REQUIREMENTS
- Stack: Astro (static output), minimal client JS. No backend.
- Hosting target: Vercel. Domain: cedarstrailriding.com (DNS access to be confirmed).
- Languages: EN default at /, AR (RTL) at /ar/, FR at /fr/. Locale files from
  brief/12_translation_pack.md (AR/FR are client-review drafts; missing strings fall back to EN).
- Design system:
  - Palette: deep olive/cedar green #0E3B2E, warm cream/sand #F5EFE2, gold accent #C9A227.
  - Typography: serif display headings + clean sans body. RTL-safe. Reduced-motion aware.
  - Feel: premium eco-tourism, Lebanese mountains, calm adventure.
- Booking: NO PRICING shown anywhere. Contact page only, with
  (a) WhatsApp deep link wa.me/96170211041 (prefilled text),
  (b) tel: links +961 70 211 041 / +961 76 004 686,
  (c) request form per brief/11_booking_form_spec.md (Web3Forms backend → info@cedarsxtreme.com;
      use an env var WEB3FORMS_ACCESS_KEY placeholder until the key is provided).
- Analytics: GA4 + Meta Pixel (IDs via env vars; render only when set to avoid broken tags in dev).
- Contact facts to render exactly:
  - Phones: +961 70 211 041, +961 76 004 686 (WhatsApp same numbers)
  - Email: info@cedarsxtreme.com
  - Location: Samqaniyeh, Beiteddine | Shouf District, "We operate all over Lebanon."
  - Map embed: lat 33.6864028, lng 35.5902012; plus-code MHPXVG5V+FV
  - Hours: year-round daily; trails seasonal.
- Footer (REQUIRED, built from spec):
  - Inline SVG outline of Lebanon + single pin at base coords, label "We operate all over
    Lebanon." (This is the client's national-reach story told visually.)
  - Brand-family strip: link Cedars Trail Riding → Cedars Xtreme (+ any confirmed siblings);
    2 brands are currently confirmed.
- Content: 9 pages per brief/10. Trails seeded from 05_site_facts.json offerings.trail_rides.
  Horses & founder story: render "coming soon" states (data pending client).
- SEO: per-page title/meta/OG, JSON-LD (LocalBusiness + TouristTrip on home/contact with
  aggregateRating 4.9 Google / 5.0 TripAdvisor; FAQPage on /faq; BreadcrumbList). Beware the
  "Cedars of Lebanon = Tennessee" collision: always qualify with country keywords.
- Images: use files in brief/assets/ where suitable; everywhere else use tasteful CSS
  placeholders labeled with the required shot (per 07_image_assets.md).
- Logo: reference the remote old-site PNG with a LOCAL fallback (text wordmark "Cedars Trail
  Riding") so the header never renders broken — the Cloudflare-gated URL must not break the build.
- Mail/repos: scaffold .env.example with WEB3FORMS_ACCESS_KEY, GA4 ID, META_PIXEL ID (render
  analytics only when set).
- Deliverables: runnable project + README + vercel.json + sitemap.xml + robots.txt +
  .env.example + a pre-launch SEO/QA checklist.
- Accessibility: WCAG AA, full keyboard nav, lang + dir attributes set per locale.
- Output: the complete runnable project (source + configs) plus this README note:
  run `npm install && npm run dev`.

STYLE & TONE
Warm, nature-forward, confident-but-calm. Sensory detail. Never cowboy/ranch-American;
this is Lebanese mountain eco-tourism. Sentences short. English primary; Arabic & French
translations must preserve the same tone.

DO NOT
- Invent prices, names, team members, horse names, or founding dates.
- Use any Tennessee/US "Cedars of Lebanon" imagery or copy.
- Hardcode English inside templates — use the locale files.
```

---

## After the first build pass
1. Review with the client on staging.
2. Plug in: logo file, hero imagery, horse names, founder story, pricing policy decision,
   verbatim testimonial approvals, and the AR/FR translation pass.
3. Re-run JSON-LD validation (Google Rich Results) and Lighthouse.
