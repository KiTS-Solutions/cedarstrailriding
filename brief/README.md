# Cedars Trail Riding — Website Build Brief (Research Pack)

Prepared: 17 September 2026
For: `cedarstrailriding.com` (Cedars Trail Riding / CTR, Lebanon)
Purpose: Everything collected from the client's website, Instagram, Facebook, and third-party
listings — organized as deliverables you can feed into Claude Code to start building.

---

## What's in this folder

| File | What it is | Use it for |
|------|-----------|------------|
| `01_research_findings.md` | Full research dump — website content, social data, third-party listings, review themes, sources, confidence levels | Master source of truth |
| `02_experiences_catalog.md` | Structured offerings: trails, packages, audiences, difficulty, durations | Product/offering pages & cards |
| `03_messaging_and_copy.md` | Positioning, brand voice, ready-to-adapt copy blocks | On-brand page copy |
| `04_seo_and_audit.md` | Keyword map, search landscape, name-collision warning, technical audit | SEO strategy + fix vs rebuild |
| `05_site_facts.json` | ✅ Machine-readable canonical spec (brand, contact, offers, values, keywords, build decisions) | **The one file Claude Code reads first** |
| `06_open_questions.md` | Gaps + interview questions (resolved vs pending) | Client checklist |
| `07_image_assets.md` | Image map: downloaded vs blocked vs needed | Media status |
| `08_homepage_content.md` | Full EN homepage copy, section by section | Render-ready content |
| `09_content_model.md` | Data types + page↔entity map + JSON-LD plan | TS types / schemas |
| `10_sitemap_navigation.md` | Routes, nav, redirects from old WP site | Routing & IA |
| `11_booking_form_spec.md` | Form fields, channels, behavior | Contact/booking page |
| `12_translation_pack.md` | EN→AR→FR string tables | i18n locale files |
| `13_claude_code_instructions.md` | Copy-paste handoff prompt for Claude Code | Kickoff prompt |
| `14_design_direction.md` | Palette, typography, imagery, motion, RTL | Design system input |
| `15_media_asset_list.md` | Consolidated client media checklist | Asset collection |
| `16_marketing_launch_content.md` | Your case-study kit (IG, Reel, Thread, LinkedIn, FB, Pinterest, Blog, Email, Snapshot) — fact-checked & hold-for-launch | Publish after go-live |
| `17_marketing_fact_check.md` | QA of the launch kit: what passed, what needs fixing | Publish gate |
| `assets/` | 3 downloaded TripAdvisor photos (usable pending rights) | Drop into repo |

## How to feed this into Claude Code

1. Drop this whole folder into your project as `brief/`.
2. Open `13_claude_code_instructions.md` and copy the prompt block; paste it into Claude Code.
3. Claude reads `05_site_facts.json` first (canonical), then the `.md` files for context, copy,
   structure, and design.
4. After the first pass: fill the open items from `06_open_questions.md` + `15_media_asset_list.md`
   (logo, imagery, horse names, founder story, AR/FR translations), re-generate the affected files,
   and have Claude iterate.

## Locked decisions (from our Q&A)
- **Stack:** static rebuild (Astro or Next.js), no backend.
- **Languages:** English (default `/`), Arabic (RTL `/ar/`), French (`/fr/`).
- **Booking:** request form + WhatsApp (`wa.me/96170211041`) + click-to-call — **no prices shown**.
- **Hours:** year-round, daily operation; trails are seasonal.
- **Transport:** Beirut pickup on request (not a headline service).
- **Location:** Samqaniyeh, Beiteddine | Shouf District — "We operate all over Lebanon."

## Method & access notes (important)
- **Website** (`cedarstrailriding.com`): fully read — Home + Trails pages, sitemap. WordPress
  behind Cloudflare (raw HTML is challenge-gated; page content captured via rendering reader).
  *Re-verified both pages this session at the user's request — identical, fully captured.*
- **Instagram** (`cedarstrailriding`, `cedarsxtreme`): blocked (403). Stats/bio from search-index
  snapshots (approximate).
- **Facebook** (`cedarstrailriding`): blocked (403). Confirmed to exist (also linked from the
  Google Maps listing).
- **Google Maps:** verified — "Cedars Trail Riding – Horse Riding Trek, Samqaniyeh", 4.9★,
  coords 33.6864028, 35.5902012, plus-code `MHPXVG5V+FV`.
- **⚠️ Noise filter:** "Cedars of Lebanon" also = a US state park + stables in **Tennessee**.
  Those results were excluded; the collision is documented in `04_seo_and_audit.md`.
