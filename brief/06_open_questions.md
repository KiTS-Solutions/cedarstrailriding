# 06 — Open Questions & Interview Checklist

Everything the public sources could NOT tell us. Get these answered by the client (or confirm
"leave blank") before finalizing pages, pricing, booking, and schema. Grouped by priority.

---

## A. Critical — blocks core pages (ask first)

### ✅ Resolved
- **Booking method** → app form + WhatsApp + click-to-call (you chose this).
- **Contact** → phones +961 70 211 041 / +961 76 004 686; WhatsApp = same numbers; email
  = info@cedarsxtreme.com.
- **Location** → Samqaniyeh, Beiteddine, Shouf District; operate all over Lebanon; Google pin
  MHPR+H3 (4.9★).
- **Languages** → EN + AR + FR.

### ❗ Still needed
1. **Pricing** → ✅ RESOLVED: do not publish prices; use "contact us for pricing" CTAs.
   (If the client later wants "from $X" indicators, we can add them under `offerings.pricing`.)
2. **Booking policy** — deposit/payment method? cancellation policy? (nice-to-have for FAQ)
3. **Real operating hours** → ✅ RESOLVED: year-round, daily; trails remain seasonal.
4. **Pickup** → ✅ RESOLVED: available on request only — mention in FAQ/contact, not as a
   headline service.

## B. Product detail — for the Trails / Experiences pages

6. Per trail: **duration in hours**, **distance/km**, **difficulty**, group size min/max, minimum
   age, weight limit, what's included (meals, snacks, coffee, photos, camping gear for Marj Bisri).
7. **Multi-day treks** (signature offering): where do guests sleep (camps/guesthouses)? meals?
   luggage transport? guide-to-guest ratio? what fitness level? typical season windows?
8. **Seasonality table** — which trails run in which months? Snow/heat closures?
9. **Add-ons** — Beirut transport, photography/video, coffee/meal after ride, combined visits
   (Beiteddine Palace, Moussa Castle, Deir el Qamar)?
10. **"Hiking with horses"** — what exactly is it (leading horses while hiking)? min group size for
    schools? 

## C. Brand & story — for About / Meet the Horses / credibility

11. **Founding story** — who founded Cedars Trail Riding, when, why? ⏳ PENDING from client
    (About page can ship with mission copy only, then add names/story later).
12. **Brand-family lineup (NEW — from marketing kit):** the launch copy references a multi-logo
    footer ("connecting CTR to the wider Cedars brand family"). We only have evidence of **2**
    brands (Cedars Trail Riding + Cedars Xtreme). Confirm: is it 2, or are there more sibling
    brands (names + links)? Footer will render 2 by default until confirmed.
12. **Cedars Xtreme relationship** — what is the parent brand, and how should the two sites link /
    cross-brand (logo lockups, "Managed by Cedars Xtreme")? Does Cedars Xtreme have its own website?
13. **Team** — names/roles (we saw guide "Robin" in a review — confirm who to feature).
14. **Horses** — names and personalities for the "Meet our Horses" section, plus count of horses.
15. **Eco credentials/partners** — Shouf Biosphere Reserve relationship, REAF accomplishment,
    community projects — anything else to cite? (Press links, awards.)
16. **Reviews** — permission to pull TripAdvisor reviews + any Google reviews to feature.
17. **Photos/video assets** — do you have high-res originals, drone footage, an existing media
    drive we can pull from? (Current site images live under /wp-content/uploads/.)

## D. Technical & scope

### ✅ Resolved (final build decisions)
- **Stack:** Astro (static) · **Hosting:** Vercel · **Form backend:** Web3Forms → info@cedarsxtreme.com
- **Analytics:** GA4 + Meta Pixel · **Translations:** AR/FR drafted (MT) in `12_translation_pack.md`,
  client reviews before launch; EN ships first if needed.
- **Brand family footer:** will include full brand list — CLIENT TO SUPPLY NAMES (pending).

### ❗ Still needed
18. **Vercel/DNS access** — who owns cedarstrailriding.com? Can you add/modify DNS records?
19. **Web3Forms key** — create a free account, get the access key, set as env var.
20. **GA4 + Meta Pixel IDs** — provide the two IDs (or accept env-var placeholders).

## D. Final scope decisions (✅ locked this round)
- Site scope: **all 9 pages** from the start.
- Logo: **temporary** — remote old-PNG + local fallback wordmark; real logo swaps in later.
- Deliverables: code + docs + vercel.json + sitemap.xml + robots.txt + .env.example + pre-launch
  SEO/QA checklist.
- Cadence: **BUILD NOW with placeholders**; client data (brand list, horse names, founder story,
  IDs, logo) added in later turns.

---

## A. Quick-fire answers format (to paste back to me)
> 1. Pricing: …
> 2. Booking: …
> 3. Phone/WhatsApp/Email: …
> 4. Location/pickup: …
> 5. Languages: …
> 6–10. Trails detail: …
> 11–17. Story/team/horses/assets: …
> 18–23. Tech & scope: …

Once you have answers, I'll fold them into `05_site_facts.json` and produce the updated, build-ready
spec (plus a homepage content skeleton) for Claude Code.
