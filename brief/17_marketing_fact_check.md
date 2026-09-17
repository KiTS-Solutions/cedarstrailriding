# 17 — Marketing Fact-Check (QA of the launch kit)

Reviewed against: `01_research_findings.md`, `05_site_facts.json`, and the locked build decisions.
Verdict per asset, then required fixes.

---

## TL;DR
✅ **8 of 9 assets are usable as written** (minor placeholder + timing notes).
⚠️ **Fixes required before publishing:**
1. **Project Snapshot — "Platform: likely WordPress or Webflow" is WRONG.** The build is a custom
   **static site (Astro or Next.js)**. Same sentence also wrongly implies the footer structure was
   "inferred" from a template. Already corrected in `16_marketing_launch_content.md §9`.
2. **"Four Cedars brand logos" in the footer** — our research only confirmed **TWO** brands
   (Cedars Trail Riding + parent Cedars Xtreme). Confirm the full brand-family lineup before you
   publish that line (and before the footer is built).
3. **Timing** — everything says "We just finished the website." The site is **not live yet**. These
   are pre-written, publish only after go-live, with real screenshots.

---

## Per-asset verdict

| # | Asset | Usable? | Notes / fixes |
|---|-------|---------|---------------|
| 1 | IG Carousel | ✅ Yes | Fill `[COMMENT WORD]`, `[@client handle]` → `@cedarstrailriding`. Slide 4 "footer connecting… brand family" ok, but keep brand-count accurate (see #2). Publish post-launch with real screenshots. |
| 2 | IG Reel | ✅ Yes | Hook options are strong; reveal sequence (hero → horses → footer map) matches the design. Record screen **after** launch. |
| 3 | Thread | ✅ Yes | Fully accurate (palette, map, contact channels all match the plan). |
| 4 | LinkedIn | ✅ Yes | Attach real screenshots post-launch. |
| 5 | Facebook | ✅ Yes | Accurate. |
| 6 | Pinterest | ✅ Yes | Pin image = launch screenshot. Board names good. |
| 7 | Blog | ✅ Yes | Accurate throughout; no platform claim to fix. Screenshots post-launch. |
| 8 | Email | ✅ Yes | Fill `[first name]`, `[link]`, `[your name]`. **Correct the earlier "I just finished" to past/launch tense if sent pre-launch.** |
| 9 | Project Snapshot | ⚠️ Fix | Platform line corrected (see TL;DR #1). |

---

## Fact-checks that PASS (no change needed)
- "Based in Samqaniyeh, Beiteddine, Shouf District" ✅ (client-confirmed)
- "Operate all over Lebanon / national reach" ✅ (client: "We operate all over Lebanon")
- "Multiple phone numbers, email, Instagram handle" ✅ (two phones + info@cedarsxtreme.com + @cedarstrailriding)
- "Booking-friendly contact flow" ✅ (form + WhatsApp + click-to-call — locked)
- "Full multi-page site covering rides, horses, contact" ✅ (9-page map incl. /horses and /contact)
- "Deep olive green + warm cream" ✅ (design direction: #0E3B2E + #F5EFE2 — see harmonization below)
- "Real photography of horses + terrain" ✅ (client assets incoming; 3 rider shots already in `assets/`)
- "Previous online presence wasn't keeping up" ✅ (supported by `04_seo_and_audit.md`: no pricing, no
  contact page, no booking, no FAQ, no testimonials, default WP pages)

---

## Build features this kit commits us to (now IN the spec)
The copy promises two concrete features. They are now required deliverables so the marketing stays
true:

1. **Lebanon map in the footer** — inline SVG outline of Lebanon + a single pin (base coords
   33.6864028, 35.5902012), with a label like "We operate all over Lebanon."
   → Added to `05_site_facts.json` (build_decisions.footer_map), `10_sitemap_navigation.md`,
   `09_content_model.md`, `08_homepage_content.md`, `14_design_direction.md`.
2. **Brand-family footer strip** — logos/wordmarks linking Cedars Trail Riding → Cedars Xtreme
   (+ any confirmed siblings). Default: render the 2 known brands until names are confirmed.
   → Added to the same files (build_decisions.brand_family_footer).

## Terminology harmonization (public copy vs build)
- Marketing says **"deep olive green"**; build files said "cedar green." They describe the same hex
  `#0E3B2E`. Canonical term going forward: **deep olive/cedar green (#0E3B2E)** — updated in
  `05_site_facts.json` + `14_design_direction.md` so Claude Code builds the color the marketing
  describes.
- Public copy may keep "olive green" (friendlier); internal spec keeps both terms in one string.

## Open item → confirm with client (single question)
- **Brand-family lineup & count.** We only have evidence of 2 brands. The copy says four logos.
  Options: (a) it's really 4 → get names + links; (b) only 2 → soften copy to "part of the wider
  Cedars brand family" (no number); (c) keep it vague regardless.

## Publish checklist
- [ ] Site live at cedarstrailriding.com
- [ ] Real screenshots captured (hero, horses, contact, footer, map)
- [ ] `[COMMENT WORD]`, handles, links filled
- [ ] Brand-family footer final (names/count)
- [ ] Client approval to publish the case study (client is tagged by name)
