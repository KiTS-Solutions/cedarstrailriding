# 04 — SEO Strategy & Site Audit

## A. Search landscape

### Critical: name collision
"**Cedars of Lebanon**" is also:
- a **state park** in Lebanon, **Tennessee, USA**;
- several **horse-riding businesses** there ("The Stables at Cedars of Lebanon" → `ridecedars.com`,
  "Cedars of Lebanon Trail Rides", "Cedars of Lebanon Horseback Riding").
These **outrank** the client for English queries like "cedars lebanon horseback riding". The new
site must actively differentiate with geo + activity qualifiers.

### Competitive/differentiation strategy
- Own **"Lebanon" the country**, not the US state: `Lebanon horseback riding`, `horse riding
  Shouf`, `Shouf Biosphere horse trek`.
- Own **"equestrian tourism Lebanon"** and **"multi-day horse trek Lebanon"** (their unique 8-day
  trek has essentially no domestic competition).
- Latitude/longitude + LocalBusiness schema to fight US-state confusion in "near me" queries.

---

## B. Keyword map

### Primary (product intent)
| Intent | Keyword set |
|--------|-------------|
| Core service | horse riding Lebanon, horseback riding Lebanon, trail riding Lebanon |
| Geo | horse riding Shouf, horseback riding Chouf, horse trek Barouk, riding near Beiteddine |
| Unique flagship | multi-day horse trek Lebanon, 8-day horse trek Lebanon, equestrian tourism Lebanon |
| Eco angle | eco tourism Lebanon, eco-tourism Shouf, responsible tourism Lebanon |
| Experience | family horse riding Lebanon, horse riding beginners Lebanon, horseback riding kids Lebanon |
| Events | team building Lebanon, corporate retreat Lebanon, school outdoor activity Lebanon, horseback proposal Lebanon |

### Secondary (awareness/context)
- Shouf Biosphere Reserve, Barouk cedars, Beiteddine horse riding, things to do in Chouf,
  Lebanon outdoor activities, Lebanon nature experiences.

### Long-tail/FAQ (blog/FAQ fuel)
- "is horse riding in Lebanon safe for beginners"
- "what to wear horse riding Lebanon"
- "horse riding from Beirut day trip"
- "best time of year to ride in the Shouf"
- "do I need experience for trail riding"

---

## C. Technical audit of the CURRENT site

| # | Finding | Severity | Fix |
|---|---------|----------|-----|
| 1 | No dedicated **Contact page** — /contact/ 404s; "Contact Us" buttons loop to home/trails | High | Build contact + booking page |
| 2 | **No pricing** anywhere | High | Add packages/pricing or "from $X" |
| 3 | **No booking mechanism** (no form, no WhatsApp link, no calendar) | High | Add booking form + WhatsApp CTA + click-to-call |
| 4 | Default WordPress artifacts live (`sample-page`, `hello-world`, `category/uncategorized`) | Medium | Delete / redirect before or during rebuild |
| 5 | "Meet our Horses" section has **no horse content** | Medium | Add horse profiles (names, personalities) |
| 6 | **No reviews/testimonials** on site despite 5.0 TripAdvisor | Medium | Add credibility section |
| 7 | No gallery page (photos are inline only) | Low | Build gallery + lightbox, credit originals |
| 8 | No FAQ | Medium | Add FAQ (also great for SEO) |
| 9 | English only; no AR/FR version | Medium | Plan AR (RTL) at least |
| 10 | No visible SEO essentials captured (title/desc are WordPress-default-ish) | Medium | Add per-page titles, meta, OpenGraph, JSON-LD |
| 11 | Site behind Cloudflare challenge (may hide from some crawlers/OG scrapers) | Info | Keep but verify social preview / OG image rendering |
| 12 | No address/map/pin published | Medium | Add meeting-point + Google Maps embed + LocalBusiness schema |

---

## D. Recommended site map (rebuild)

1. **Home** — hero, quick "3 ways to ride" cards, about snippet, social proof, featured trails, CTA.
2. **Trail Rides / Our Trails** — each trail = card or sub-page (Pine, Beit Eddine, Panoramic,
   Rocky, Barouk Cedars, Marj Bisri, Custom).
3. **Multi-day Treks** — flagship 1–3 day and 8-day expeditions (separate page to own the niche).
4. **Groups & Events** — schools, corporate/team-building, birthdays/proposals.
5. **Meet the Horses** — horse profiles + team ("Robin the guide", the owner).
6. **About** — mission, eco-tourism, "managed by Cedars Xtreme", REAF top-3 credential, Shouf context.
7. **Gallery** — categorized photo grid.
8. **FAQ** — questions + structured data.
9. **Contact / Book** — phones, WhatsApp, booking form, map, hours/seasonality.

---

## E. Technical recommendations for the build
- **Static output** (Astro/Next/Hugo) or clean WordPress — content is mostly evergreen.
- **Locale**: EN primary, AR (RTL) second phase; keep LTR/RTL ready.
- **Schema.org**: `TouristTrip` / `LocalBusiness` / `FAQPage` / `Offer` (price ranges once known).
- **OG + social cards** — critical since their marketing is Instagram-first.
- **Images**: source the high-res originals from the client (the site uses `/wp-content/uploads/…`
  images — get the masters); optimize WebP/AVIF.
- **Analytics + conversion tracking**: clicks-to-call, WhatsApp, form submits.
- **Accessibility & performance**: Lighthouse green, mountain-scene alt text, reduced-motion safe.

## F. Data still needed for precise SEO
- Exact business name + parent relationship wording for schema/NAP.
- Phone/WhatsApp confirmation, email, business hours, meeting-point coords.
- Pricing (for Offer schema & rich results).
- Languages to ship at launch.
