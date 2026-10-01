# 10 — Homepage Sitemap & Navigation

Complete route/navigation plan for the trilingual static build.

## Route map
| # | Route (en) | Route (ar) | Route (fr) | Nav label |
|---|-----------|-----------|-----------|-----------|
| 1 | `/` | `/ar/` | `/fr/` | Home |
| 2 | `/trails/` | `/ar/trails/` | `/fr/trails/` | Trails |
| 3 | `/treks/` | `/ar/treks/` | `/fr/treks/` | Multi-day Treks |
| 4 | `/groups/` | `/ar/groups/` | `/fr/groups/` | Groups & Events |
| 5 | `/horses/` | `/ar/horses/` | `/fr/horses/` | Meet the Horses |
| 6 | `/about/` | `/ar/about/` | `/fr/about/` | About |
| 7 | `/gallery/` | `/ar/gallery/` | `/fr/gallery/` | Gallery |
| 8 | `/faq/` | `/ar/faq/` | `/fr/faq/` | FAQ |
| 9 | `/contact/` | `/ar/contact/` | `/fr/contact/` | Book / Contact |

## Header (sticky, all pages)
- Logo (left / right for RTL)
- Nav: Trails · Multi-day Treks · Groups & Events · About · Gallery · FAQ
- Primary pill CTA: **Book Today** → `/contact/`
- Secondary: language switch (EN | ع | FR) — keeps current route, swaps locale

## Footer (all pages)
- Brand + tagline + "Managed by Cedars Xtreme"
- Columns: Explore / Company / Contact / Follow
- Contact: +961 70 211 041 · +961 76 004 686 · info@cedarstrailriding.com · WhatsApp
- Follow: @cedarstrailriding · @cedarsxtreme · Facebook
- **Lebanon map (REQUIRED — featured in marketing case study):** inline SVG outline of Lebanon with
  a single pin at base coords (33.6864028, 35.5902012) + label "We operate all over Lebanon."
  This is the client's "national reach" story told visually.
- **Brand-family strip (REQUIRED):** logos/wordmarks linking Cedars Trail Riding → Cedars Xtreme
  (+ any confirmed sibling brands). Render the 2 confirmed brands until the client confirms more.
- Legal: © 2026 Cedars Trail Riding — Samqaniyeh, Beiteddine, Lebanon

## Redirect/cleanup (migrating from old WordPress)
| Old URL | Action |
|---------|--------|
| `/trails/` | → new `/trails/` (keep same path!) |
| `/sample-page/` | → 301 to `/` |
| `/hello-world/` | → 301 to `/` |
| `/category/uncategorized/` | → 301 to `/` (or 410) |
| `/contact/` | → new `/contact/` (was 404) |
| `/` | → new home |

Keep `/trails/` at the same path — it's the most content-rich page and may already have
links/signals.

## On-page anchor targets (home)
`#trails`, `#treks`, `#groups`, `#horses`, `#about`, `#faq`, `#contact`
