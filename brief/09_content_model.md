# 09 — Content Model (data structure for the build)

Machine-oriented description of every content type the site needs. Claude Code can derive its
TypeScript types / collection schemas directly from this. English values only; AR/FR live as
translations keyed by the same IDs (i18n dictionaries).

---

## Locale model
- `langs: ["en", "ar", "fr"]`
- `ar` uses `dir="rtl"`. Route strategy (pick one — recommended: subpath):
  - `/` = en (default), `/ar/...`, `/fr/...` — OR — separate domains later.
- Every string has a stable key, e.g. `hero.title`. Translations stored per-locale.

---

## Entity types

### 1. Trail
```ts
type Trail = {
  id: string;                 // slug, e.g. "pine-trail"
  name: string;               // "Pine Trail"
  difficulty: "Beginner" | "Scenic" | "Adventure";
  duration?: string;          // e.g. "1 to 3 days" — optional
  feature?: boolean;          // flagship trail (Barouk, Marj Bisri)
  summary: string;            // one-liner
  description?: string;       // longer copy (client-supplied)
  image?: string;             // asset path
  price?: null;               // DO NOT render prices
}
```
Seeded values → from `05_site_facts.json` offerings.trail_rides.

### 2. Experience (group/event)
```ts
type Experience = {
  id: string;
  name: string;               // "Hiking with horses"
  audience: string;           // "large groups or schools"
  icon?: string;
}
```

### 3. Horse
```ts
type Horse = {
  id: string;
  name: string;               // [CONFIRM from client]
  personality?: string;
  image?: string;
}
```

### 4. Testimonial
```ts
type Testimonial = {
  id: string;
  quote: string;              // paraphrased until client approves verbatim
  attribution: string;
  rating?: 5 | 4;
  source?: "tripadvisor" | "google" | "wikiloc";
}
```

### 5. FaqItem
```ts
type FaqItem = { id: string; q: string; a: string; }
// JSON-LD FAQPage generated from this list.
```

### 6. SiteSettings (singleton)
- contact (phones, whatsapp, email, address, plus_code, coords, maps_url)
- brand (name, tagline, mission, parent, socials)
- build (languages, showPricing=false, bookingChannels=["form","whatsapp","tel"])
- hours/seasonality text.
- footer_map: inline SVG Lebanon outline + pin (coords 33.6864028, 35.5902012) — REQUIRED.
- brand_family: array of {name, url/instagram} for footer strip — default the 2 confirmed brands.

---

## Page ↔ entity map

| Route | Content |
|-------|---------|
| `/` | hero → 3 offer cards → about → trails grid (all `Trail`) → treks block → groups (`Experience`) → horses (`Horse`, optional until data) → testimonials (`Testimonial`) → FAQ preview (top 4 `FaqItem`) → contact → footer |
| `/trails` | all `Trail` cards, grouped by difficulty; custom-trek CTA |
| `/treks` (multi-day) | Marj Bisri + 8-day feature; inclusion list; [CONFIRM itinerary] |
| `/groups` | 3 `Experience` cards + custom request CTA |
| `/horses` | `Horse` grid |
| `/about` | mission, eco-tourism values, parent brand, REAF credential, [CONFIRM story] |
| `/gallery` | image grid (from `assets/` + client assets) |
| `/faq` | full `FaqItem` list |
| `/contact` (booking) | phones/WhatsApp/email, form, map embed, hours |

---

## Images required (per asset map)
| Slot | Spec | Status |
|------|------|--------|
| hero bg | 1920×1080 (or mp4 loop) | ⏳ client |
| 6 trail cards | 800×600 | ⏳ client |
| trek banner | 1600×900 | ⏳ client |
| 3 group/event cards | 800×600 | ⏳ client |
| horse portraits | 800×1000 | ⏳ client |
| 3 testimonial avatars (optional) | 160×160 | optional |
| og-image | 1200×630 | derive from hero |
| gallery (12–24) | mixed | ⏳ client + `assets/tripadvisor_*.jpg` |

---

## Structured data (JSON-LD) plan
- `TouristTrip`/`LocalBusiness` on home + contact: name, address (Samqaniyeh, Beiteddine), geo
  (33.6864028, 35.5902012), phones, aggregateRating (4.9 Google / 5.0 TripAdvisor), sameAs
  (Instagram ×2, Facebook), openingHours (year-round daily).
- `FAQPage` on /faq.
- `BreadcrumbList` sitewide.
- `ImageObject` + OG/Twitter meta.
