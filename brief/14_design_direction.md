# 14 — Website Design Direction

Visual direction for the builder. Grounded in the client's identity (cedars, mountains, horses,
eco-tourism) — no invented brand assets; the final logo comes from the client.

---

## Mood
Premium eco-tourism: **serene, earthy, trustworthy**. The calm of a cedar forest + the warmth of
Lebanese hospitality. "Quiet luxury adventure" — never theme-park loud.

## Palette (provisional)
| Role | Hex | Notes |
|------|-----|-------|
| Deep olive / cedar green | `#0E3B2E` | hero/dark sections, footer, primary buttons ("deep olive green" in marketing language) |
| Cedar green (soft) | `#2A5C4A` | secondary backgrounds, hover states |
| Cream / sand | `#F5EFE2` | light sections, card background |
| Warm white | `#FBF7EE` | body background |
| Gold accent | `#C9A227` | CTAs, dividers, ratings, highlights |
| Ink | `#1C241F` | body text |

Contrast check: gold on cedar-green ≈ 4.9:1 (AA for large text) — use for chips/ratings; body
text stays ink-on-cream.

## Typography
- **Display**: a high-contrast serif with warmth (e.g. *Fraunces*, *Playfair Display*) — headings,
  hero, trail names.
- **Body**: a clean humanist sans (e.g. *Inter*, *Source Sans 3*) — paragraphs, UI.
- **Arabic**: pair that renders Arabic+Latin harmoniously (e.g. *Noto Naskh Arabic* / *IBM Plex
  Sans Arabic*); ensure `unicode-range` subsetting so pages stay fast.
- Scale: hero 3–5rem clamp; sections 2–3rem; body 1–1.125rem.

## Imagery language
- Cedar forest light, misty ridgelines, horse close-ups (eye/ear/mane), riders at canter, riverside
  campfire, thistles/wildflowers underfoot, golden-hour panoramas.
- Treatment: warm-graded, slightly desaturated greens, film-like grain optional.
- Avoid: stocky American-ranch vibes, hard blue skies, clip-art icons.

## Components
- Rounded 12–16px cards with soft shadows on cream; deep-green full-bleed bands for story sections.
- Thin gold underlines/dividers (§ style).
- Difficulty chips: Beginner = soft green; Scenic = gold outline; Adventure = terracotta
  (e.g. `#B4552D`).
- Buttons: pill, gold fill for primary CTA ("Book Today"); ghost/cream for secondary.

## Motion
- Subtle parallax on hero; fade-up on scroll; 200–300ms hover.
- Respect `prefers-reduced-motion` (disable parallax).

## Inspirations (feel, not copy)
- Boutique eco-lodges & safari camps (Calabash/&Beyond simplicity), slow-travel backpacking
  brands, Lebanese summer-mountain aesthetic (Beiteddine stone, cedar tones).

## RTL notes
- Mirror layout; keep numerals Latin; Arabic headings get slightly looser line-height.
- Language switcher: EN | ع | FR pill in header (don't use flags).
