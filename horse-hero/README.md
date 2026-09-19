# Cedar Trail Riders · scroll-scrub horse hero

A ready-to-run prototype and a drop-in Tailwind section for the Cedar Trail Riders site. Scrolling through the hero seeks through a short horse-in-river clip rather than playing the video on a timer.

## Files

| Path | Purpose |
| --- | --- |
| `index.html` | Standalone, no-build demo. It uses inline styles and local assets, so it also previews cleanly in an offline iframe. |
| `drop-in.html` | Copy/paste integration snippet that keeps the supplied Tailwind design tokens and original site content. |
| `assets/horse-river-hero.mp4` | 1280 × 720 / 24 fps, all-intra H.264 hero media (about 4.7 MB). Every frame is a keyframe so seeks feel responsive when driven by scrolling. |
| `assets/poster.webp` | 1600 px wide first-paint / fallback poster, taken at 1.0 seconds. |
| `assets/horse-river-original.mp4` | 4K source master retained for future encodes (not intended to ship). |

## Run the standalone demo

```bash
cd /home/user/horse-hero
python3 -m http.server 8000 --bind 0.0.0.0
```

Then open `http://localhost:8000` locally (or use the supplied live preview). Do **not** test the video by double-clicking `index.html`: a local HTTP server lets browsers fetch and seek the MP4 reliably.

## Integrating into the Tailwind site

1. Publish `assets/horse-river-hero.mp4` and `assets/poster.webp` from the site's public directory. The snippet expects them at `/assets/...`; change the two URLs if your asset convention differs.
2. Copy the section and script from `drop-in.html` into the home page.
3. Copy the small `prefers-reduced-motion` fallback shown at the end of that file into the global stylesheet. The standalone demo already includes a full version.
4. The snippet intentionally references your existing tokens/classes:
   - `bg-cedar-deep`, `text-warm-white`, `text-gold`, `bg-gold`
   - `font-display`
   - `btn-primary`, `btn-secondary`, `chip`
5. The site badge is kept as the exact existing path: `/images/brand/ctr-badge-square.webp`.

### Behaviour and accessibility

- The 320vh wrapper creates a scroll timeline while the viewport stage remains sticky.
- Scroll progress is clamped to `0…1` and mapped to the 5.68-second video. The canvas uses **cover** cropping at all viewport sizes.
- Copy is arranged in three short acts. The first act preserves the supplied heading, description, links and trust chips exactly; later beats are easy to edit or remove.
- The static poster appears immediately and remains the no-JavaScript / video-error fallback.
- With `prefers-reduced-motion: reduce`, JavaScript leaves the video alone and all copy becomes a conventional static hero over the poster.
- The canvas is decorative. The semantic text and working links remain ordinary HTML.

## Tuning

The most useful controls are in the script:

- `height:480vh` on the runway controls how slowly the clip is scrubbed. Try `320vh` for a faster interaction, or `560vh` for an even slower one.
- `visible(p, start, end)` controls when each text act is visible.
- `p * (duration - .035)` maps scroll position to clip time; no changes are needed unless using a different clip.

The current media is all-intra on purpose. Long-GOP video produces a smaller file but forces the browser to decode from an earlier keyframe on each seek, which makes a scroll-scrub hero feel sluggish.

## Source and usage note

The supplied clip is **“Powerful Brown Horse Galloping Through a Sunlit River in a Forest”** by AMRULQAYS on Pixabay (video id 230717):

<https://pixabay.com/videos/ai-generated-horse-river-galloping-230717/>

It is marked AI-generated on its Pixabay page. Retain the source record and verify the Pixabay Content License / any attribution or brand-use requirements applicable at the time of publishing.
