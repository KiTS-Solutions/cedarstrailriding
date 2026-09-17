# HANDOFF.md — Cedars Trail Riding website build

**One-page handoff.** Status: 🟢 **GO — build now.** Prepared 17 September 2026.

---

## 1 · What we're building

A **trilingual (EN · AR RTL · FR), 9-page, static Astro website** for **Cedars Trail Riding**
(CTR), Lebanon's first eco-equestrian tourism experience — guided trail rides from 1 hour to
8-day treks, based in Samqaniyeh, Beiteddine (Shouf District), operating all over Lebanon.

Pages: Home · Trails · Multi-day Treks · Groups & Events · Meet the Horses · About · Gallery ·
FAQ · Contact/Book.

---

## 2 · Locked decisions (all confirmed)

| Area | Decision |
|------|----------|
| Stack | **Astro** (static), minimal JS, no backend |
| Hosting | **Vercel** — domain `cedarstrailriding.com` |
| Languages | EN `/` · AR RTL `/ar/` · FR `/fr/` (AR/FR = client-review drafts) |
| Booking | **Web3Forms** form → `info@cedarsxtreme.com` + **WhatsApp** `wa.me/96170211041` + click-to-call |
| Phones | +961 70 211 041 · +961 76 004 686 (both WhatsApp, both shown) |
| Pricing | **No prices published** — "contact us for pricing" CTAs |
| Hours | Year-round, daily · trails seasonal · Beirut pickup on request |
| Analytics | GA4 + Meta Pixel (env-var driven) |
| Logo | Temporary: old-site PNG + local fallback wordmark; real logo swaps in later |
| Footer | **Lebanon map** (SVG + pin, "We operate all over Lebanon") + **brand-family strip** |
| Horses | Placeholder cards (names pending) |
| Testimonials | 3 paraphrased quotes (client to approve) |
| Design | Deep olive/cedar green `#0E3B2E` · cream `#F5EFE2` · gold `#C9A227` · serif display + sans body |
| Cadence | **BUILD NOW with placeholders**; client data swapped in later turns |

**Location facts:** Samqaniyeh, Beiteddine · Shouf District · coords **33.6864028, 35.5902012** ·
plus-code `MHPXVG5V+FV` · Google pin `maps.app.goo.gl/8TBFZgxcnUNDyY746`.

---

## 3 · How to start the build

1. Copy this entire folder into your project as **`brief/`**.
2. In Claude Code, paste:

```
You are building the new website for Cedars Trail Riding (CTR), Lebanon's first
eco-equestrian tourism experience. Before writing any code, read these files in order:

1. brief/05_site_facts.json        — canonical facts (brand, contact, offers, build decisions)
2. brief/09_content_model.md       — data structures & page map
3. brief/10_sitemap_navigation.md  — routes & nav
4. brief/08_homepage_content.md    — hero + section copy (EN master)
5. brief/03_messaging_and_copy.md  — voice & extra copy
6. brief/12_translation_pack.md    — EN/AR/FR strings
7. brief/07_image_assets.md        — which images exist vs are placeholders
8. brief/11_booking_form_spec.md   — form fields & channels

Then implement the requirements in brief/13_claude_code_instructions.md (read it fully —
it contains BUILD REQUIREMENTS, STYLE & TONE, and the DO-NOT list). Deliver the complete
runnable project.
```

*(The full prompt is in `brief/13_claude_code_instructions.md` — paste that block instead for
maximum fidelity.)*

---

## 4 · What Claude Code must deliver

Runnable Astro project · README + deploy notes · `vercel.json` · `sitemap.xml` · `robots.txt` ·
`.env.example` (Web3Forms key · GA4 id · Meta Pixel id) · pre-launch SEO/QA checklist.

**Non-negotiables:** no prices anywhere · no invented names/dates · Tennessee "Cedars of Lebanon"
never referenced · all copy via locale files (EN fallback) · WCAG AA · RTL-ready.

---

## 5 · Still owed by the client (placeholders until then)

| # | Item | Drop it in |
|---|------|-----------|
| 1 | Full brand-family list (names + URLs/IG) | footer strip |
| 2 | Horse names + personalities | `05` → "Meet our Horses" |
| 3 | Founder name + story + year | `05` → About |
| 4 | Logo file (transparent SVG/PNG) | header/footer |
| 5 | GA4 + Meta Pixel IDs | `.env` |
| 6 | Web3Forms access key | `.env` |
| 7 | Vercel/DNS access confirm | deploy |
| 8 | Hero + per-trail + trek + groups + team imagery | media |
| 9 | Verbatim testimonial sign-off | testimonials |
| 10 | Native AR/FR review | `12_translation_pack.md` → locale files |

None of these block the build — every slot has a tasteful placeholder or fallback.

---

## 6 · The folder (what's here)

`01` research → `02` offerings → `03` voice/copy → `04` SEO/audit → `05` **canonical spec JSON** →
`06` open questions → `07` image map → `08` homepage copy → `09` content model → `10` sitemap →
`11` booking form → `12` translations → `13` **build prompt** → `14` design → `15` media list →
`16` marketing kit → `17` marketing fact-check → `assets/` (3 photos).

**Start point:** `brief/05_site_facts.json` + `brief/13_claude_code_instructions.md`.
