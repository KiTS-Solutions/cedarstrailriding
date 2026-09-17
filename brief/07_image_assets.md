# 07 — Image & Media Assets (map + status)

Purpose: list every image asset we can obtain for the rebuild, where it lives, its status, and
what still needs to come from the client. Feed this to Claude Code so it knows which images are
already in the repo (`assets/`) versus which need to be supplied.

---

## A. Assets already downloaded into `assets/` (usable now)

| File | Source | Size | Notes |
|------|--------|------|-------|
| `tripadvisor_01_1440x960.jpg` | TripAdvisor "Lebanon Mountains Horseback Riding From Beirut" CDN | 1440×960 | Riders on trail — verify client owns rights |
| `tripadvisor_02_1440x960.jpg` | TripAdvisor CDN | 1440×960 | Riders on trail — verify rights |
| `tripadvisor_03_761x507.jpg` | TripAdvisor CDN | 761×507 | Smaller/hero candidate — verify rights |

⚠️ These are pulled from the TripAdvisor listing. Assume they belong to the client (the operator),
but **have the client confirm we may use them** before shipping.

## B. Website images — URLs captured, but downloads blocked

The WordPress site sits behind Cloudflare, so direct + proxy fetches return challenge pages. The
following are the **exact URLs** used by the current site. Give this list to the client (or open
in a browser) to save the originals; they will download fine manually.

| Used for | URL |
|----------|-----|
| Logo (hero) | https://cedarstrailriding.com/wp-content/uploads/2025/11/Cedars-Trail-Riding.png |
| Card — hiking with horses | https://cedarstrailriding.com/wp-content/uploads/2025/11/Cedars-Trail-Riding-1.jpg |
| Card — business/team-building | https://cedarstrailriding.com/wp-content/uploads/2025/11/Cedars-Trail-Riding-1-1.jpg |
| Card — custom experiences | https://cedarstrailriding.com/wp-content/uploads/2025/11/Cedars-Trail-Riding-3.jpg |
| About image A | https://cedarstrailriding.com/wp-content/uploads/2025/11/Cedars-Trail-Riding-7.jpg |
| About image B | https://cedarstrailriding.com/wp-content/uploads/2025/11/Cedars-Trail-Riding-8.jpg |
| Ride photo | https://cedarstrailriding.com/wp-content/uploads/2025/11/horse-riding-17.jpg |
| Footer photo | https://cedarstrailriding.com/wp-content/uploads/2026/01/ctr-1-scaled.jpg |
| About photo | https://cedarstrailriding.com/wp-content/uploads/2026/01/ctr-2-scaled.jpg |
| Trails hero | https://cedarstrailriding.com/wp-content/uploads/2026/01/ctr-3-scaled.jpg |

## C. Instagram content (can't be scraped — Meta blocks automated access)

`@cedarstrailriding` (~260 posts) and `@cedarsxtreme` are the **richest** visual sources. Options:
1. Ask the client to export their best images/videos (or grant collaborator access).
2. Embed the Instagram feeds via a client-side widget (note: the in-app preview sandbox blocks
   third-party scripts, but the deployed site will work).
3. Use a manual "curated gallery" — hand-pick ~20–30 top posts and hardcode them.

## D. What to ask the client for (media checklist)
- [ ] Logo file (SVG/PNG, transparent) — should come from Cedars Xtreme brand folder
- [ ] 3–5 hero images (landscape, ≥1920px wide): cedar forest ride, mountain panorama, canter shot
- [ ] 1 image per trail (Pine, Beit Eddine, Panoramic, Rocky, Barouk Cedars, Marj Bisri, Custom)
- [ ] "Meet the horses" — 1 portrait image per horse
- [ ] Team photos (guides incl. Robin, owner)
- [ ] Group/school/corporate shots for "More than just trail rides" cards
- [ ] Multi-day trek photos (camping, riverside, sunrise) — these are the unique selling point
- [ ] Any drone/video footage for a hero background video
- [ ] High-res versions of the current WP images (list in section B)
