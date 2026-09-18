# Scroll-Scrub "Trail Chapters" Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage hero with a trilingual, RTL-safe, scroll-scrubbed horse-river video hero (chapter rail, push-in/grade, ambient FX, sticky booking dock) that degrades to a static poster hero on reduced-motion / Save-Data / weak devices.

**Architecture:** `ScrollHero.astro` renders semantic HTML in *static mode* by default (no-JS safe). `scroll-hero.ts` upgrades it to *scrub mode* only when `canScrub()` passes: one rAF loop (only while the hero is on screen) writes `--p` (0–1) plus per-act `--o` custom properties; CSS does all visual motion with `transform`/`opacity`. Pure math lives in `hero-math.ts` (unit-tested with `node:test`); particles live in `hero-fx.ts`.

**Tech Stack:** Astro 7 (static), Tailwind v4 tokens, strict TypeScript, Playwright (existing `tests/smoke.spec.ts`), `node:test` for pure-logic unit tests, ffmpeg for asset encodes. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-09-19-scroll-hero-design.md`

## Global Constraints

- TypeScript strict — no `any`, no implicit returns; every async/handler that can throw uses `try/catch` with a typed error.
- No English strings in components — everything via `useTranslations()` + `src/i18n/locales/{en,ar,fr}.json`.
- Brand is **"Cedars Trail Riding"** (never "Cedar Trail Riders"). Contact/coords/rating come from `src/data/siteSettings.ts`; never hardcode facts. **No prices anywhere.** Never the word "Tennessee".
- Logical CSS properties only (`inset-inline-*`, `padding-inline-*`, `text-align: start/end`); `letter-spacing: 0` in `html[dir="rtl"]`.
- Only `transform` and `opacity` are animated. Video is never preloaded from `<head>`; it is requested only after first paint and only when `canScrub()` is true.
- Budgets: LCP < 2.5 s, CLS < 0.1 at 375px and 1440px; desktop video ≤ ~5 MB, mobile ≤ ~2.5 MB.
- Acts II/III are never `aria-hidden`; single `<h1>` (Act I). Out-of-view act links get `tabindex="-1"`, not `inert`.
- Commit steps run only with the user's go-ahead (git tree already holds their uncommitted work — stage only the files named). Commit messages end with the two attribution lines from the session reminder.
- **Deviations from spec (flag to user in final report):** posters ship as WebP only (no AVIF encoder besides libaom; a missing `.avif` would 404 in AVIF-capable browsers). Poster is frame **t=0** (not t=1.0s as in the prototype) so the canvas cross-fade is seamless. Prototype bug fixed: its Act I opacity was 0 at scroll 0 (`visible()` ramps in from `start=0`), hiding the H1 on load.

## File Structure

| File | Responsibility |
| --- | --- |
| `scripts/encode-hero.sh` | Reproducible ffmpeg encodes + posters from the 4K master |
| `public/images/hero/{ride-desktop.mp4,ride-mobile.mp4,poster-desktop.webp,poster-mobile.webp}` | Shipped media |
| `src/scripts/hero-math.ts` | Pure functions: progress, act opacity, chapters, snap, capability gate, splash rate |
| `tests/unit/hero-math.test.ts` | `node:test` unit tests for the above |
| `src/scripts/scroll-hero.ts` | DOM controller: capability gate, video/canvas scrub, `--p`/`--o`, rail, deep-links, snap, dock, analytics |
| `src/scripts/hero-fx.ts` | 2D canvas droplet/mist layer (`createFx`) |
| `src/components/ScrollHero.astro` | Markup + scoped CSS + `<script>` bootstrap |
| `src/sections/HomeSection.astro` | Swap old hero `<section>` for `<ScrollHero>` |
| `src/i18n/locales/{en,ar,fr}.json`, `src/i18n/REVIEW_NOTES.md` | `hero.*` strings + review log |
| `scripts/static-server.mjs` | Add media MIME types + HTTP Range (needed to seek video in e2e) |
| `tests/smoke.spec.ts` | Extend with hero tests |
| `PRELAUNCH_CHECKLIST.md` | Licence/AI-disclosure + review items |
| `package.json` | `test:unit` script |

---

### Task 1: Media pipeline (with user checkpoint on the phone crop)

**Files:**
- Create: `scripts/encode-hero.sh`
- Create (outputs): `public/images/hero/ride-desktop.mp4`, `ride-mobile.mp4`, `poster-desktop.webp`, `poster-mobile.webp`
- Scratch (not committed): previews in the scratchpad directory

**Interfaces:**
- Produces: the four files above, at exactly those URLs (`/images/hero/...`). Mobile clip is portrait 540×960; desktop 1280×720; both all-intra (`-g 1`), no audio, 24 fps.

- [ ] **Step 1: Write the encode script**

```bash
#!/usr/bin/env bash
# Encode the scroll-scrub hero from the 4K master. All-intra (-g 1) so every frame is a
# keyframe: scroll-driven currentTime seeks stay instant.
# Usage: scripts/encode-hero.sh <master.mp4> [crop_x0=0.5] [crop_x1=0.5]
#   crop_x0/x1: 0..1 position of the portrait crop window at clip start / end
#   (0 = far left, 1 = far right). Different values pan the crop to follow the horse.
# Env: DESKTOP_CRF (default 24), MOBILE_CRF (default 26)
set -euo pipefail

SRC="${1:?usage: encode-hero.sh <master.mp4> [crop_x0] [crop_x1]}"
X0="${2:-0.5}"
X1="${3:-0.5}"
OUT="public/images/hero"
mkdir -p "$OUT"

DUR="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")"
COMMON=(-an -c:v libx264 -preset slow -g 1 -pix_fmt yuv420p -movflags +faststart -r 24)

# Desktop 16:9
ffmpeg -y -i "$SRC" "${COMMON[@]}" -crf "${DESKTOP_CRF:-24}" \
  -vf "scale=1280:720:flags=lanczos" "$OUT/ride-desktop.mp4"

# Mobile 9:16: crop a portrait window that pans from X0 to X1, then scale.
CROP="crop=w=ih*9/16:h=ih:x=(iw-ih*9/16)*(${X0}+(${X1}-${X0})*t/${DUR}):y=0"
ffmpeg -y -i "$SRC" "${COMMON[@]}" -crf "${MOBILE_CRF:-26}" \
  -vf "${CROP},scale=540:960:flags=lanczos" "$OUT/ride-mobile.mp4"

# Posters = frame t=0 so the canvas cross-fade is seamless.
ffmpeg -y -ss 0 -i "$OUT/ride-desktop.mp4" -frames:v 1 -vf "scale=1600:-2" -c:v libwebp -quality 78 "$OUT/poster-desktop.webp"
ffmpeg -y -ss 0 -i "$OUT/ride-mobile.mp4" -frames:v 1 -c:v libwebp -quality 78 "$OUT/poster-mobile.webp"

ls -l "$OUT"
```

- [ ] **Step 2: Preview the portrait crop at three moments (checkpoint for the user)**

Run (scratchpad dir = `$SCRATCH`, use the session scratchpad path):

```bash
chmod +x scripts/encode-hero.sh
for t in 0.3 2.8 5.3; do
  ffmpeg -y -ss $t -i horse-hero/assets/horse-river-original.mp4 -frames:v 1 \
    -vf "scale=1280:-2,drawbox=x=(iw-ih*9/16)/2:y=0:w=ih*9/16:h=ih:color=yellow@0.9:t=4" \
    "$SCRATCH/crop-preview-$t.png"
done
```

Read the three PNGs. **Show them to the user** and ask where the horse sits at each moment. If the horse stays centred use `0.5 0.5`; if it moves, choose `x0`/`x1` (e.g. `0.3 0.7`). Do not encode until the user confirms the pair.

- [ ] **Step 3: Encode with the confirmed crop**

Run: `scripts/encode-hero.sh horse-hero/assets/horse-river-original.mp4 <x0> <x1>`
Expected: 4 files in `public/images/hero/`; `ride-desktop.mp4` ≤ ~5 MB and `ride-mobile.mp4` ≤ ~2.5 MB. If over budget, re-run with a higher `DESKTOP_CRF`/`MOBILE_CRF` (e.g. `MOBILE_CRF=29`).

- [ ] **Step 4: Verify the media**

Run:
```bash
for f in ride-desktop ride-mobile; do ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate -show_entries format=duration -of csv=p=0 public/images/hero/$f.mp4; done
# every frame a keyframe:
ffprobe -v error -select_streams v:0 -skip_frame nokey -count_frames -show_entries stream=nb_read_frames -of csv=p=0 public/images/hero/ride-mobile.mp4
ffprobe -v error -select_streams v:0 -count_frames -show_entries stream=nb_read_frames -of csv=p=0 public/images/hero/ride-mobile.mp4
```
Expected: 1280,720 and 540,960 at 24/1; the two frame counts are equal (all-intra). Read one poster PNG/WebP to eyeball it.

- [ ] **Step 5: Commit**

```bash
git add scripts/encode-hero.sh public/images/hero
git commit -m "feat(hero): add all-intra desktop/mobile hero encodes and posters"
```

---

### Task 2: Pure hero logic (TDD)

**Files:**
- Create: `src/scripts/hero-math.ts`
- Create: `tests/unit/hero-math.test.ts`
- Modify: `package.json` (scripts)

**Interfaces:**
- Produces (all exported from `src/scripts/hero-math.ts`, no imports):
  - `type ActName = "intro" | "river" | "ride"`
  - `interface ActWindow { start: number; end: number; fade: number; fadeIn: boolean; fadeOut: boolean }`
  - `const ACTS: Record<ActName, ActWindow>`
  - `interface Chapter { id: "shouf" | "river" | "ride"; act: ActName; p: number }` and `const CHAPTERS: readonly Chapter[]`
  - `clamp01(n: number): number`
  - `actOpacity(p: number, w: ActWindow): number`
  - `activeChapter(p: number): number` (index into `CHAPTERS`)
  - `videoTime(p: number, duration: number): number`
  - `scrollProgress(runwayTop: number, runwayHeight: number, stageHeight: number, stickyTop: number): number`
  - `progressToScrollY(p: number, runwayDocTop: number, runwayHeight: number, stageHeight: number, stickyTop: number): number`
  - `nearestSnap(p: number, velocity: number): number | null`
  - `interface CapabilityEnv { reducedMotion: boolean; saveData: boolean; effectiveType?: string; deviceMemory?: number }` and `canScrub(env: CapabilityEnv): boolean`
  - `splashRate(velocity: number, p: number): number` (droplets/second)

- [ ] **Step 1: Add the unit-test script**

In `package.json` `scripts`, add after `"check"`:
```json
"test:unit": "node --experimental-strip-types --test tests/unit/*.test.ts",
```

- [ ] **Step 2: Write the failing tests** — `tests/unit/hero-math.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACTS,
  CHAPTERS,
  actOpacity,
  activeChapter,
  canScrub,
  clamp01,
  nearestSnap,
  progressToScrollY,
  scrollProgress,
  splashRate,
  videoTime,
} from "../../src/scripts/hero-math.ts";

test("clamp01 bounds values", () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(0.4), 0.4);
  assert.equal(clamp01(3), 1);
});

test("intro act is fully visible at p=0 (prototype bug: it was 0)", () => {
  assert.equal(actOpacity(0, ACTS.intro), 1);
});

test("intro fades out, river fades in across the overlap", () => {
  assert.equal(actOpacity(0.26, ACTS.intro), 1);
  assert.equal(actOpacity(0.34, ACTS.intro), 0);
  assert.equal(actOpacity(0.3, ACTS.river), 0);
  assert.equal(actOpacity(0.38, ACTS.river), 1);
});

test("ride act stays fully visible through p=1", () => {
  assert.equal(actOpacity(1, ACTS.ride), 1);
  assert.equal(actOpacity(0.66, ACTS.ride), 0);
});

test("activeChapter picks the chapter for a progress value", () => {
  assert.equal(activeChapter(0), 0);
  assert.equal(activeChapter(0.5), 1);
  assert.equal(activeChapter(0.95), 2);
  assert.equal(CHAPTERS.length, 3);
});

test("videoTime maps progress onto the clip, clamped short of the last frame", () => {
  assert.equal(videoTime(0, 5.75), 0);
  assert.ok(Math.abs(videoTime(1, 5.75) - (5.75 - 0.035)) < 1e-9);
  assert.equal(videoTime(2, 5.75), videoTime(1, 5.75));
  assert.equal(videoTime(0.5, 0), 0);
});

test("scrollProgress and progressToScrollY are inverses", () => {
  // runway 4800px tall, stage 700px, sticky offset 72px, runway document top at 1000px.
  const runwayDocTop = 1000;
  const h = 4800;
  const stage = 700;
  const top = 72;
  for (const p of [0, 0.25, 0.5, 1]) {
    const y = progressToScrollY(p, runwayDocTop, h, stage, top);
    const runwayTopInViewport = runwayDocTop - y;
    assert.ok(Math.abs(scrollProgress(runwayTopInViewport, h, stage, top) - p) < 1e-9);
  }
});

test("scrollProgress is 0 before and 1 after the runway", () => {
  assert.equal(scrollProgress(500, 4800, 700, 72), 0);
  assert.equal(scrollProgress(-9000, 4800, 700, 72), 1);
});

test("nearestSnap only snaps when nearly still and close to a chapter", () => {
  assert.equal(nearestSnap(0.52, 0), 0.5);
  assert.equal(nearestSnap(0.52, 0.5), null);
  assert.equal(nearestSnap(0.4, 0), null);
  assert.equal(nearestSnap(0.5, 0), null); // already on it
  assert.equal(nearestSnap(0.01, 0), null); // never trap the user at the very start
  assert.equal(nearestSnap(0.99, 0), null); // ...or the very end
});

test("canScrub gates on motion, data saver, connection and memory", () => {
  assert.equal(canScrub({ reducedMotion: false, saveData: false }), true);
  assert.equal(canScrub({ reducedMotion: true, saveData: false }), false);
  assert.equal(canScrub({ reducedMotion: false, saveData: true }), false);
  assert.equal(canScrub({ reducedMotion: false, saveData: false, effectiveType: "3g" }), false);
  assert.equal(canScrub({ reducedMotion: false, saveData: false, effectiveType: "4g" }), true);
  assert.equal(canScrub({ reducedMotion: false, saveData: false, deviceMemory: 2 }), false);
  assert.equal(canScrub({ reducedMotion: false, saveData: false, deviceMemory: 8 }), true);
});

test("splashRate scales with velocity and peaks in the river window", () => {
  assert.equal(splashRate(0, 0.5), 0);
  assert.ok(splashRate(0.5, 0.5) > splashRate(0.5, 0.05));
  assert.ok(splashRate(0.5, 0.5) > splashRate(0.1, 0.5));
  assert.ok(splashRate(99, 0.5) <= 90);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:unit`
Expected: FAIL — cannot find module `hero-math.ts`.

- [ ] **Step 4: Implement** — `src/scripts/hero-math.ts`

```ts
export type ActName = "intro" | "river" | "ride";

export interface ActWindow {
  start: number;
  end: number;
  fade: number;
  fadeIn: boolean;
  fadeOut: boolean;
}

export const ACTS: Record<ActName, ActWindow> = {
  intro: { start: 0, end: 0.34, fade: 0.08, fadeIn: false, fadeOut: true },
  river: { start: 0.3, end: 0.7, fade: 0.08, fadeIn: true, fadeOut: true },
  ride: { start: 0.66, end: 1, fade: 0.08, fadeIn: true, fadeOut: false },
};

export interface Chapter {
  id: "shouf" | "river" | "ride";
  act: ActName;
  /** Scroll progress the chapter link scrolls to / the snap target. */
  p: number;
}

export const CHAPTERS: readonly Chapter[] = [
  { id: "shouf", act: "intro", p: 0.12 },
  { id: "river", act: "river", p: 0.5 },
  { id: "ride", act: "ride", p: 0.86 },
];

const VIDEO_END_GUARD = 0.035;
const SNAP_RADIUS = 0.06;
const SNAP_DEAD_ZONE = 0.004;
const SNAP_MAX_VELOCITY = 0.02;
const SPLASH_WINDOW: readonly [number, number] = [0.3, 0.8];

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

export function actOpacity(p: number, w: ActWindow): number {
  const up = w.fadeIn ? (p - w.start) / w.fade : 1;
  const down = w.fadeOut ? (w.end - p) / w.fade : 1;
  return clamp01(Math.min(up, down));
}

export function activeChapter(p: number): number {
  if (p < 0.34) return 0;
  if (p < 0.68) return 1;
  return 2;
}

export function videoTime(p: number, duration: number): number {
  const max = Math.max(0, duration - VIDEO_END_GUARD);
  return clamp01(p) * max;
}

/** `runwayTop` is the runway's viewport-relative top (getBoundingClientRect().top). */
export function scrollProgress(
  runwayTop: number,
  runwayHeight: number,
  stageHeight: number,
  stickyTop: number,
): number {
  const range = Math.max(1, runwayHeight - stageHeight);
  return clamp01((stickyTop - runwayTop) / range);
}

/** Document scrollY that puts the runway at progress `p`. */
export function progressToScrollY(
  p: number,
  runwayDocTop: number,
  runwayHeight: number,
  stageHeight: number,
  stickyTop: number,
): number {
  const range = Math.max(1, runwayHeight - stageHeight);
  return runwayDocTop - stickyTop + clamp01(p) * range;
}

/** Progress of the chapter to settle on, or null when no snap should happen. */
export function nearestSnap(p: number, velocity: number): number | null {
  if (velocity > SNAP_MAX_VELOCITY) return null;
  if (p < 0.02 || p > 0.98) return null;
  for (const c of CHAPTERS) {
    const d = Math.abs(p - c.p);
    if (d <= SNAP_RADIUS && d > SNAP_DEAD_ZONE) return c.p;
  }
  return null;
}

export interface CapabilityEnv {
  reducedMotion: boolean;
  saveData: boolean;
  effectiveType?: string;
  deviceMemory?: number;
}

export function canScrub(env: CapabilityEnv): boolean {
  if (env.reducedMotion || env.saveData) return false;
  if (env.effectiveType && /^(slow-2g|2g|3g)$/.test(env.effectiveType)) return false;
  if (typeof env.deviceMemory === "number" && env.deviceMemory < 4) return false;
  return true;
}

/** Droplets per second for a scroll velocity (progress/second) at progress `p`. */
export function splashRate(velocity: number, p: number): number {
  const v = clamp01(velocity / 0.5);
  const inRiver = p >= SPLASH_WINDOW[0] && p <= SPLASH_WINDOW[1];
  return (inRiver ? 90 : 12) * v;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm run test:unit`
Expected: all PASS. If `astro check` later complains about the `.ts` import extension in the test, add `"allowImportingTsExtensions": true` under `compilerOptions` in `tsconfig.json`.

- [ ] **Step 6: Commit**

```bash
git add src/scripts/hero-math.ts tests/unit/hero-math.test.ts package.json
git commit -m "feat(hero): add tested scroll-hero math (acts, chapters, snap, capability gate)"
```

---

### Task 3: i18n strings, review notes, checklist

**Files:**
- Modify: `src/i18n/locales/en.json`, `ar.json`, `fr.json` (append `hero.*` keys next to `home.*`)
- Modify: `src/i18n/REVIEW_NOTES.md`, `PRELAUNCH_CHECKLIST.md`

**Interfaces:**
- Produces keys (all three locales): `hero.aria`, `hero.skip`, `hero.railLabel`, `hero.chapter1`, `hero.chapter2`, `hero.chapter3`, `hero.act2.eyebrow`, `hero.act2.title`, `hero.act2.body`, `hero.act3.eyebrow`, `hero.act3.title`, `hero.act3.body`, `hero.location`, `hero.scrollCue`. Existing keys reused: `brand.hero`, `home.eyebrow`, `home.heroSub`, `cta.book`, `cta.explore`, `cta.plan`, `cta.whatsapp`, `label.ratedGoogle`, `label.languages`, `label.operateAllLebanon`.
- Content check: Act II body only claims things the trails data supports (cedar — Barouk Cedars Trail; riverside — Marj Bisri Trail; mountain trails). No "river crossings".

- [ ] **Step 1: Add EN keys** (in `en.json`, after the `home.*` block)

```json
  "hero.aria": "Cedars Trail Riding introduction",
  "hero.skip": "Skip intro",
  "hero.railLabel": "Trail chapters",
  "hero.chapter1": "Shouf",
  "hero.chapter2": "River",
  "hero.chapter3": "Ride",
  "hero.act2.eyebrow": "Move with the land",
  "hero.act2.title": "Follow the rhythm of Lebanon",
  "hero.act2.body": "Cedar forests, riverside paths and mountain trails across the Shouf, seen at a horse's pace.",
  "hero.act3.eyebrow": "Your next story",
  "hero.act3.title": "The trail is waiting.",
  "hero.act3.body": "Choose your pace. We'll take care of the rest.",
  "hero.location": "Samqaniyeh · Shouf",
  "hero.scrollCue": "Scroll to ride",
```

- [ ] **Step 2: Add AR keys** (`ar.json`) — RTL draft translations

```json
  "hero.aria": "مقدمة عن سيدارز تريل رايدينغ",
  "hero.skip": "تخطَّ المقدمة",
  "hero.railLabel": "فصول الرحلة",
  "hero.chapter1": "الشوف",
  "hero.chapter2": "النهر",
  "hero.chapter3": "الرحلة",
  "hero.act2.eyebrow": "تحرّك مع الأرض",
  "hero.act2.title": "اتبع إيقاع لبنان",
  "hero.act2.body": "غابات الأرز ومسارات ضفاف الأنهار ودروب الجبال في الشوف، على إيقاع الخيل.",
  "hero.act3.eyebrow": "قصتك القادمة",
  "hero.act3.title": "الدرب بانتظارك.",
  "hero.act3.body": "اختر إيقاعك، ونحن نتكفّل بالباقي.",
  "hero.location": "سمقانية · الشوف",
  "hero.scrollCue": "مرّر لتنطلق",
```

- [ ] **Step 3: Add FR keys** (`fr.json`) — uses the site's existing "Chouf" spelling

```json
  "hero.aria": "Présentation de Cedars Trail Riding",
  "hero.skip": "Passer l'intro",
  "hero.railLabel": "Chapitres de la piste",
  "hero.chapter1": "Chouf",
  "hero.chapter2": "Rivière",
  "hero.chapter3": "Chevauchée",
  "hero.act2.eyebrow": "Avancez avec la terre",
  "hero.act2.title": "Suivez le rythme du Liban",
  "hero.act2.body": "Forêts de cèdres, sentiers au bord de l'eau et pistes de montagne dans le Chouf, au rythme du cheval.",
  "hero.act3.eyebrow": "Votre prochaine histoire",
  "hero.act3.title": "La piste vous attend.",
  "hero.act3.body": "Choisissez votre rythme. Nous nous occupons du reste.",
  "hero.location": "Samqaniyeh · Chouf",
  "hero.scrollCue": "Défilez pour chevaucher",
```

- [ ] **Step 4: Validate JSON and key parity**

Run:
```bash
node -e '
const l=["en","ar","fr"].map(x=>JSON.parse(require("fs").readFileSync(`src/i18n/locales/${x}.json`,"utf8")));
const keys=Object.keys(l[0]).filter(k=>k.startsWith("hero."));
for (const [i,d] of l.entries()) for (const k of keys) if(!d[k]) {console.error("missing",["en","ar","fr"][i],k); process.exit(1)}
console.log("ok",keys.length,"hero keys in all locales")'
```
Expected: `ok 14 hero keys in all locales`.

- [ ] **Step 5: Log for review + checklist**

Append to `src/i18n/REVIEW_NOTES.md`:
```md
- `hero.*` (AR/FR, all 14 keys) — scroll-hero chapter labels, Act II/III story copy, skip link,
  location caption and scroll cue. Not in the translation pack; fresh draft translations.
  EN Act II/III copy is also new (not in the brief) and needs client sign-off.
```
Append to `PRELAUNCH_CHECKLIST.md` under a "Hero" heading:
```md
## Hero video
- [ ] Client sign-off on the hero clip: it is AI-generated ("Powerful Brown Horse Galloping
      Through a Sunlit River in a Forest" by AMRULQAYS, Pixabay id 230717). Re-verify the Pixabay
      Content License / attribution requirements at publish time and decide whether to disclose
      "AI-generated" on the site. Replace with real CTR footage when available
      (`scripts/encode-hero.sh` regenerates all hero assets from a new master).
- [ ] Native review of new hero copy (EN Act II/III + AR/FR `hero.*`), see `src/i18n/REVIEW_NOTES.md`.
- [ ] Run Lighthouse on `/`, `/ar/`, `/fr/` at 375px and 1440px (LCP < 2.5s, CLS < 0.1).
```

- [ ] **Step 6: Commit**

```bash
git add src/i18n/locales src/i18n/REVIEW_NOTES.md PRELAUNCH_CHECKLIST.md
git commit -m "feat(hero): add hero i18n strings and review/checklist entries"
```

---

### Task 4: ScrollHero markup + CSS (static mode complete), wired into the homepage

**Files:**
- Create: `src/components/ScrollHero.astro`
- Modify: `src/sections/HomeSection.astro` (replace lines from the old hero `<section class="relative overflow-hidden bg-cedar-deep …">` through its closing `</section>`; keep the trust-bar `<p>` above it; add import)
- Test: `tests/smoke.spec.ts` (append)

**Interfaces:**
- Consumes: `useTranslations`, `path`, `Locale` (`src/i18n`), `contact` (`src/data/siteSettings`), `WhatsAppButton` (`label`, `message?`, `class?`), hero keys from Task 3.
- Produces the DOM contract that `scroll-hero.ts` (Task 5) relies on:
  - root `section[data-hero]` with `data-mode="static"` (JS sets `"scrub"`), `data-video-desktop`, `data-video-mobile`, and `data-dock="off"`
  - `[data-hero-stage]`, `[data-hero-canvas]`, `[data-hero-fx]`, `[data-hero-bar]`, `[data-hero-dock]`
  - acts `[data-act="intro"|"river"|"ride"]` (each with CSS var `--o`)
  - rail links `a[data-chapter="shouf"|"river"|"ride"]`
  - `a[data-hero-skip]` → `#trails`
  - CTA links carry `data-hero-cta` (analytics)
- CSS contract: `--p` set on the root; `--o` set on each act; `--hero-top` (default `4.5rem` = sticky site header height) on the root.

- [ ] **Step 1: Write the failing e2e test** (append to `tests/smoke.spec.ts`)

```ts
test.describe("Scroll hero", () => {
  test("Act I H1 is visible at load and the skip link targets #trails", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-hero-skip]")).toHaveAttribute("href", "#trails");
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("stays in static mode and never requests the video", async ({ page }) => {
      const media: string[] = [];
      page.on("request", (r) => {
        if (/\.mp4(\?|$)/.test(r.url())) media.push(r.url());
      });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("[data-hero]")).toHaveAttribute("data-mode", "static");
      expect(media).toEqual([]);
      await expect(page.getByRole("link", { name: "Book Today" }).first()).toBeVisible();
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx playwright test -g "Scroll hero" --reporter=line`
Expected: FAIL (`[data-hero-skip]` not found).

- [ ] **Step 3: Create `src/components/ScrollHero.astro`**

```astro
---
import { useTranslations, path, type Locale } from "../i18n";
import { contact } from "../data/siteSettings";
import WhatsAppButton from "./WhatsAppButton.astro";

interface Props {
  locale: Locale;
}

const { locale } = Astro.props;
const t = useTranslations(locale);

const { lat, lng } = contact.coordinates;
const coords = `${lat.toFixed(2)}°N ${lng.toFixed(2)}°E`;
const media = "/images/hero";

const chapters = [
  { id: "shouf", n: "01", label: t("hero.chapter1") },
  { id: "river", n: "02", label: t("hero.chapter2") },
  { id: "ride", n: "03", label: t("hero.chapter3") },
] as const;
---

<section
  class="ctr-hero"
  data-hero
  data-mode="static"
  data-dock="off"
  data-video-desktop={`${media}/ride-desktop.mp4`}
  data-video-mobile={`${media}/ride-mobile.mp4`}
  aria-label={t("hero.aria")}
>
  <a href="#trails" class="ctr-hero__skip" data-hero-skip>{t("hero.skip")}</a>

  <div class="ctr-hero__stage" data-hero-stage>
    <div class="ctr-hero__plate" aria-hidden="true">
      <picture>
        <source
          media="(max-width: 767px) and (orientation: portrait)"
          srcset={`${media}/poster-mobile.webp`}
          type="image/webp"
        />
        <img
          src={`${media}/poster-desktop.webp`}
          alt=""
          width="1600"
          height="900"
          fetchpriority="high"
          decoding="async"
          class="ctr-hero__poster"
        />
      </picture>
      <canvas class="ctr-hero__canvas" data-hero-canvas></canvas>
    </div>

    <div class="ctr-hero__grade" aria-hidden="true"></div>
    <div class="ctr-hero__shafts" aria-hidden="true"></div>
    <canvas class="ctr-hero__fx" data-hero-fx aria-hidden="true"></canvas>
    <div class="ctr-hero__scrim" aria-hidden="true"></div>
    <div class="ctr-hero__bar" data-hero-bar aria-hidden="true"></div>

    <nav class="ctr-hero__rail" aria-label={t("hero.railLabel")}>
      <ol>
        {
          chapters.map((c) => (
            <li>
              <a href={`#${c.id}`} data-chapter={c.id}>
                <span class="ctr-hero__rail-n">{c.n}</span>
                <span class="ctr-hero__rail-l">{c.label}</span>
              </a>
            </li>
          ))
        }
      </ol>
    </nav>

    <div class="ctr-hero__acts">
      <div class="ctr-hero__act ctr-hero__act--intro" data-act="intro">
        <p class="ctr-hero__eyebrow">{t("home.eyebrow")}</p>
        <h1 class="ctr-hero__h1">{t("brand.hero")}</h1>
        <p class="ctr-hero__lead">{t("home.heroSub")}</p>
        <div class="ctr-hero__ctas">
          <a href={path("/contact/", locale)} class="btn-primary" data-hero-cta="book">{t("cta.book")}</a>
          <a
            href="#trails"
            class="btn-secondary !border-warm-white !text-warm-white hover:!bg-warm-white hover:!text-cedar-deep"
            data-hero-cta="explore"
          >
            {t("cta.explore")}
          </a>
        </div>
        <div class="ctr-hero__chips">
          <span class="chip bg-warm-white/10">{t("label.ratedGoogle")}</span>
          <span class="chip bg-warm-white/10">{t("label.languages")}</span>
          <span class="chip bg-warm-white/10">{t("label.operateAllLebanon")}</span>
        </div>
      </div>

      <div class="ctr-hero__act ctr-hero__act--river" data-act="river">
        <p class="ctr-hero__eyebrow">{t("hero.act2.eyebrow")}</p>
        <h2 class="ctr-hero__h2">{t("hero.act2.title")}</h2>
        <p class="ctr-hero__lead">{t("hero.act2.body")}</p>
      </div>

      <div class="ctr-hero__act ctr-hero__act--ride" data-act="ride">
        <p class="ctr-hero__eyebrow">{t("hero.act3.eyebrow")}</p>
        <h2 class="ctr-hero__h2">{t("hero.act3.title")}</h2>
        <p class="ctr-hero__lead">{t("hero.act3.body")}</p>
        <div class="ctr-hero__ctas">
          <a href={path("/contact/", locale)} class="btn-primary" data-hero-cta="plan">{t("cta.plan")}</a>
        </div>
      </div>
    </div>

    <p class="ctr-hero__coords" aria-hidden="true">{t("hero.location")} · {coords}</p>
    <p class="ctr-hero__cue" aria-hidden="true"><i></i>{t("hero.scrollCue")}</p>

    <div class="ctr-hero__dock" data-hero-dock>
      <a href={path("/contact/", locale)} class="btn-primary" data-hero-cta="dock-book">{t("cta.book")}</a>
      <WhatsAppButton label={t("cta.whatsapp")} class="!bg-warm-white !text-cedar-deep" />
    </div>

    <div class="ctr-hero__handoff" aria-hidden="true"></div>
  </div>
</section>

<style>
  .ctr-hero {
    --hero-top: 4.5rem;
    --p: 0;
    position: relative;
    background: var(--color-cedar-deep);
    color: var(--color-warm-white);
  }
  .ctr-hero__stage {
    position: relative;
    isolation: isolate;
    overflow: clip;
    min-height: min(46rem, calc(100svh - var(--hero-top)));
    display: flex;
    align-items: center;
  }

  /* ---- Layers ---- */
  .ctr-hero__plate {
    position: absolute;
    inset: 0;
    z-index: -3;
    transform: scale(calc(1 + var(--p) * 0.08));
    transform-origin: 50% 60%;
  }
  .ctr-hero__poster,
  .ctr-hero__canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .ctr-hero__canvas {
    opacity: 0;
    transition: opacity 0.4s ease;
  }
  .ctr-hero[data-ready] .ctr-hero__canvas {
    opacity: 1;
  }
  .ctr-hero__grade {
    position: absolute;
    inset: 0;
    z-index: -2;
    background:
      radial-gradient(ellipse at 50% 45%, transparent 45%, rgb(22 17 12 / 0.55) 100%),
      linear-gradient(0deg, rgb(201 162 39 / 0.14), rgb(201 162 39 / 0.04));
    mix-blend-mode: multiply;
  }
  .ctr-hero__scrim {
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background:
      linear-gradient(90deg, rgb(22 17 12 / 0.74) 0%, rgb(22 17 12 / 0.38) 40%, rgb(22 17 12 / 0.06) 72%, rgb(22 17 12 / 0.3) 100%),
      linear-gradient(0deg, rgb(22 17 12 / 0.7) 0%, transparent 42%, rgb(22 17 12 / 0.24) 100%);
  }
  :global(html[dir="rtl"]) .ctr-hero__scrim {
    transform: scaleX(-1);
  }
  .ctr-hero__shafts,
  .ctr-hero__fx,
  .ctr-hero__bar,
  .ctr-hero__rail,
  .ctr-hero__dock,
  .ctr-hero__cue,
  .ctr-hero__coords,
  .ctr-hero__handoff {
    display: none;
  }

  /* ---- Copy (static mode: normal flow, Act I only) ---- */
  .ctr-hero__acts {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 80rem;
    margin-inline: auto;
    padding: 4rem 1.25rem;
  }
  .ctr-hero__act--river,
  .ctr-hero__act--ride {
    display: none;
  }
  .ctr-hero__eyebrow {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-gold);
  }
  .ctr-hero__eyebrow::before {
    content: "";
    display: block;
    width: 2.25rem;
    height: 1px;
    background: currentColor;
  }
  .ctr-hero__h1,
  .ctr-hero__h2 {
    font-family: var(--font-display);
    font-weight: 600;
    line-height: 0.96;
    letter-spacing: -0.045em;
    text-wrap: balance;
    max-width: 14ch;
  }
  .ctr-hero__h1 {
    font-size: clamp(3rem, 7.2vw, 7rem);
  }
  .ctr-hero__h2 {
    font-size: clamp(2.6rem, 6vw, 5.75rem);
  }
  .ctr-hero__lead {
    margin-top: 1.5rem;
    max-width: 36rem;
    font-size: 1.05rem;
    line-height: 1.6;
    color: rgb(251 247 238 / 0.88);
  }
  .ctr-hero__ctas {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 2rem;
  }
  .ctr-hero__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1.25rem;
    font-size: 0.875rem;
    color: rgb(251 247 238 / 0.8);
  }
  :global(html[dir="rtl"]) .ctr-hero__h1,
  :global(html[dir="rtl"]) .ctr-hero__h2,
  :global(html[dir="rtl"]) .ctr-hero__eyebrow {
    letter-spacing: 0;
    text-transform: none;
  }

  .ctr-hero__skip {
    position: absolute;
    inset-inline-start: 1rem;
    top: 0.75rem;
    z-index: 30;
    padding: 0.5rem 1rem;
    border-radius: 999px;
    background: var(--color-warm-white);
    color: var(--color-cedar-deep);
    font-weight: 600;
    transform: translateY(-200%);
  }
  .ctr-hero__skip:focus-visible {
    transform: none;
  }

  /* ---- Scrub mode (JS-enabled, capable devices only) ---- */
  .ctr-hero[data-mode="scrub"] {
    height: 480vh;
  }
  @media (max-width: 767px) {
    .ctr-hero[data-mode="scrub"] {
      height: 360vh;
    }
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__stage {
    position: sticky;
    top: var(--hero-top);
    height: calc(100svh - var(--hero-top));
    height: calc(100dvh - var(--hero-top));
    min-height: 0;
    display: block;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__acts {
    position: absolute;
    inset: 0;
    max-width: none;
    padding: 0;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__act {
    position: absolute;
    top: 50%;
    display: block;
    width: min(46rem, calc(100% - 2.5rem));
    opacity: var(--o, 0);
    transform: translateY(-50%);
    translate: 0 calc((1 - var(--o, 0)) * 18px);
    will-change: opacity, translate;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__act--intro {
    --o: 1;
    inset-inline-start: 1.25rem;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__act--river {
    inset-inline: 1.25rem;
    margin-inline: auto;
    text-align: center;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__act--river .ctr-hero__eyebrow {
    justify-content: center;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__act--river .ctr-hero__h2,
  .ctr-hero[data-mode="scrub"] .ctr-hero__act--river .ctr-hero__lead {
    margin-inline: auto;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__act--ride {
    inset-inline-end: 1.25rem;
    text-align: end;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__act--ride .ctr-hero__eyebrow {
    justify-content: flex-end;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__act--ride .ctr-hero__h2 {
    margin-inline-start: auto;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__act--ride .ctr-hero__lead {
    margin-inline-start: auto;
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__act--ride .ctr-hero__ctas {
    justify-content: flex-end;
  }
  @media (min-width: 768px) {
    .ctr-hero[data-mode="scrub"] .ctr-hero__act--intro {
      inset-inline-start: 7.5rem;
    }
    .ctr-hero[data-mode="scrub"] .ctr-hero__act--ride {
      inset-inline-end: 8vw;
    }
  }

  .ctr-hero[data-mode="scrub"] .ctr-hero__bar {
    display: block;
    position: absolute;
    inset-inline: 0;
    top: 0;
    z-index: 20;
    height: 3px;
    background: var(--color-gold);
    box-shadow: 0 0 16px rgb(201 162 39 / 0.7);
    transform-origin: 0 50%;
    transform: scaleX(var(--p));
  }
  :global(html[dir="rtl"]) .ctr-hero[data-mode="scrub"] .ctr-hero__bar {
    transform-origin: 100% 50%;
  }

  /* Chapter rail */
  .ctr-hero[data-mode="scrub"] .ctr-hero__rail {
    display: block;
    position: absolute;
    inset-inline-start: 1.25rem;
    top: 50%;
    z-index: 20;
    transform: translateY(-50%);
  }
  .ctr-hero__rail ol {
    position: relative;
    display: grid;
    gap: 1.75rem;
    padding-inline-start: 1rem;
    list-style: none;
    margin: 0;
  }
  .ctr-hero__rail ol::before,
  .ctr-hero__rail ol::after {
    content: "";
    position: absolute;
    inset-inline-start: 0;
    top: 0;
    bottom: 0;
    width: 1px;
    background: rgb(251 247 238 / 0.3);
  }
  .ctr-hero__rail ol::after {
    background: var(--color-gold);
    transform-origin: 50% 0;
    transform: scaleY(var(--p));
  }
  .ctr-hero__rail a {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgb(251 247 238 / 0.55);
    transition: color 0.25s ease;
  }
  .ctr-hero__rail a[aria-current="true"] {
    color: var(--color-warm-white);
  }
  .ctr-hero__rail a[aria-current="true"] .ctr-hero__rail-n {
    color: var(--color-gold);
  }
  .ctr-hero__rail-l {
    display: none;
  }
  @media (min-width: 768px) {
    .ctr-hero__rail-l {
      display: inline;
    }
  }
  :global(html[dir="rtl"]) .ctr-hero__rail a {
    letter-spacing: 0;
    text-transform: none;
  }

  .ctr-hero[data-mode="scrub"] .ctr-hero__coords {
    display: block;
    position: absolute;
    inset-inline-start: 1.25rem;
    bottom: 1.1rem;
    z-index: 20;
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: rgb(251 247 238 / 0.7);
    opacity: calc(1 - var(--p) * 3);
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__cue {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: absolute;
    inset-inline: 0;
    bottom: 1.1rem;
    justify-content: center;
    z-index: 20;
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgb(251 247 238 / 0.75);
    opacity: calc(1 - var(--p) * 8);
    pointer-events: none;
  }
  .ctr-hero__cue i {
    display: block;
    width: 1px;
    height: 1.75rem;
    background: var(--color-gold);
  }
  :global(html[dir="rtl"]) .ctr-hero__cue,
  :global(html[dir="rtl"]) .ctr-hero__coords {
    letter-spacing: 0;
    text-transform: none;
  }

  /* Sticky booking dock */
  .ctr-hero[data-mode="scrub"] .ctr-hero__dock {
    display: flex;
    gap: 0.5rem;
    position: absolute;
    inset-inline-end: 1.25rem;
    bottom: 1rem;
    z-index: 25;
    padding: 0.4rem;
    border-radius: 999px;
    background: rgb(22 17 12 / 0.55);
    backdrop-filter: blur(8px);
    opacity: 0;
    translate: 0 12px;
    pointer-events: none;
    transition:
      opacity 0.3s ease,
      translate 0.3s ease;
  }
  .ctr-hero[data-mode="scrub"][data-dock="on"] .ctr-hero__dock {
    opacity: 1;
    translate: 0 0;
    pointer-events: auto;
  }
  .ctr-hero__dock :global(a) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }

  /* Scroll hand-off into the next (light) section */
  .ctr-hero[data-mode="scrub"] .ctr-hero__handoff {
    display: block;
    position: absolute;
    inset-inline: 0;
    bottom: 0;
    z-index: 10;
    height: 38%;
    pointer-events: none;
    background: linear-gradient(0deg, var(--color-warm-white), transparent);
    opacity: clamp(0, calc((var(--p) - 0.92) * 12.5), 1);
  }

  /* Ambient light shafts + FX canvas */
  .ctr-hero[data-mode="scrub"] .ctr-hero__shafts {
    display: block;
    position: absolute;
    inset: -20% -10%;
    z-index: -1;
    pointer-events: none;
    background: repeating-linear-gradient(
      105deg,
      transparent 0 9%,
      rgb(255 236 190 / 0.1) 9% 11%,
      transparent 11% 20%
    );
    mix-blend-mode: screen;
    opacity: calc(0.35 + var(--p) * 0.3);
    animation: ctr-shafts 14s ease-in-out infinite alternate;
  }
  @keyframes ctr-shafts {
    from {
      transform: translateX(-2%);
    }
    to {
      transform: translateX(3%);
    }
  }
  .ctr-hero[data-mode="scrub"] .ctr-hero__fx {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 5;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>

<script>
  import { initScrollHero } from "../scripts/scroll-hero";

  const root = document.querySelector<HTMLElement>("[data-hero]");
  if (root) initScrollHero(root);
</script>
```

- [ ] **Step 4: Create a temporary `src/scripts/scroll-hero.ts` stub so the build resolves**

```ts
export function initScrollHero(_root: HTMLElement): void {
  // Replaced in Task 5.
}
```

- [ ] **Step 5: Wire into `HomeSection.astro`**

Add to the imports: `import ScrollHero from "../components/ScrollHero.astro";`
Replace the old `<section class="relative overflow-hidden bg-cedar-deep …"> … </section>` hero block (badge `<img>` through chips) with:
```astro
<ScrollHero locale={locale} />
```
Leave the `<p class="bg-cedar-deep …">{t("home.trustBar")}</p>` above it untouched. (`WhatsAppButton` is already imported in this file; leave it.)

- [ ] **Step 6: Build, check, run the tests**

Run: `npm run check && npx playwright test -g "Scroll hero|Home page" --reporter=line`
Expected: check clean; Scroll hero tests PASS (reduced-motion test passes because the stub never leaves static mode); existing "renders the hero and primary nav" test still PASS (H1 text has no `<br>`, so `toHaveText("Explore Lebanon on Horseback")` matches).

- [ ] **Step 7: Eyeball static mode**

Use Playwright MCP: navigate to the dev/preview URL at 375px and 1440px, and `/ar/` — screenshot. Confirm poster visible, Act I legible, RTL text aligned to the right, no overflow.

- [ ] **Step 8: Commit**

```bash
git add src/components/ScrollHero.astro src/scripts/scroll-hero.ts src/sections/HomeSection.astro tests/smoke.spec.ts
git commit -m "feat(hero): add ScrollHero static-mode markup/CSS and wire into home"
```

---

### Task 5: Scrub controller (video/canvas, `--p`, rail, deep-links, snap, dock, analytics)

**Files:**
- Modify: `src/scripts/scroll-hero.ts` (replace stub)
- Modify: `scripts/static-server.mjs` (media MIME + Range)
- Test: `tests/smoke.spec.ts` (append)

**Interfaces:**
- Consumes: everything exported from `hero-math.ts` (Task 2); DOM contract from Task 4; `createFx` from Task 6 is **not** used yet (Task 6 adds it — leave a marked hook).
- Produces: `export function initScrollHero(root: HTMLElement): void`.

- [ ] **Step 1: Teach the static server media types and Range** (Chromium seeks MP4 via Range requests)

In `scripts/static-server.mjs` add to `CONTENT_TYPES`: `".mp4": "video/mp4", ".webp": "image/webp"`. Replace the handler body's `readFile`/`writeHead(200…)`/`end` with Range-aware logic:

```js
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const filePath = await resolveFile(pathname);
    const data = await readFile(filePath);
    const type = CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range) {
      const start = range[1] === "" ? 0 : Number(range[1]);
      const end = range[2] === "" ? data.length - 1 : Math.min(Number(range[2]), data.length - 1);
      res.writeHead(206, {
        "Content-Type": type,
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes ${start}-${end}/${data.length}`,
        "Content-Length": end - start + 1,
      });
      res.end(data.subarray(start, end + 1));
      return;
    }
    res.writeHead(200, { "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": data.length });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not found");
  }
});
```

- [ ] **Step 2: Write the failing e2e tests** (append inside `test.describe("Scroll hero", …)`)

```ts
  test("upgrades to scrub mode on capable desktop and requests the desktop video", async ({ page }) => {
    const media: string[] = [];
    page.on("request", (r) => {
      if (/\.mp4(\?|$)/.test(r.url())) media.push(r.url());
    });
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-mode", "scrub");
    await expect.poll(() => media.some((u) => u.includes("ride-desktop.mp4"))).toBe(true);
    expect(media.some((u) => u.includes("ride-mobile.mp4"))).toBe(false);
  });

  test("scrolling reveals the river act and advances the rail", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-mode", "scrub");
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>("[data-hero]")!;
      const stage = el.querySelector<HTMLElement>("[data-hero-stage]")!;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const sticky = parseFloat(getComputedStyle(stage).top);
      window.scrollTo({ top: top - sticky + 0.5 * (el.offsetHeight - stage.offsetHeight), behavior: "instant" });
    });
    await expect(page.locator('[data-act="river"]')).toHaveCSS("opacity", "1");
    await expect(page.locator('[data-act="intro"]')).toHaveCSS("opacity", "0");
    await expect(page.locator('a[data-chapter="river"]')).toHaveAttribute("aria-current", "true");
  });

  test("#river deep link opens at the river chapter", async ({ page }) => {
    await page.goto("/#river");
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-mode", "scrub");
    await expect(page.locator('[data-act="river"]')).toHaveCSS("opacity", "1");
  });

  test("skip link moves to the trails section", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-hero-skip]").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#trails")).toBeInViewport();
  });

  test("Arabic: rail sits on the right (inline-start in RTL)", async ({ page }) => {
    await page.goto("/ar/");
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-mode", "scrub");
    const box = await page.locator(".ctr-hero__rail").boundingBox();
    const vw = page.viewportSize()!.width;
    expect(box!.x).toBeGreaterThan(vw / 2);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText("Explore Lebanon on Horseback");
  });
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx playwright test -g "Scroll hero" --reporter=line`
Expected: new tests FAIL (mode stays `static`).

- [ ] **Step 4: Implement `src/scripts/scroll-hero.ts`**

```ts
import {
  ACTS,
  CHAPTERS,
  actOpacity,
  activeChapter,
  canScrub,
  nearestSnap,
  progressToScrollY,
  scrollProgress,
  videoTime,
  type ActName,
} from "./hero-math";

type AnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
};

interface NetworkInfo {
  effectiveType?: string;
  saveData?: boolean;
}
type NavigatorWithHints = Navigator & { connection?: NetworkInfo; deviceMemory?: number };

const ACT_NAMES = Object.keys(ACTS) as ActName[];
const SEEK_EPSILON = 0.018;
const OPACITY_EPSILON = 0.005;
const FOCUS_THRESHOLD = 0.35;
const SNAP_IDLE_MS = 160;

class HeroError extends Error {
  constructor(message: string) {
    super(`[scroll-hero] ${message}`);
    this.name = "HeroError";
  }
}

function must<T extends Element>(root: ParentNode, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new HeroError(`missing element ${selector}`);
  return el;
}

function track(name: string, params: Record<string, string | number> = {}): void {
  try {
    const w = window as AnalyticsWindow;
    w.gtag?.("event", name, params);
    w.fbq?.("trackCustom", name, params);
  } catch (err) {
    if (!(err instanceof Error)) throw err; // analytics must never break the hero
  }
}

function wireSkip(root: HTMLElement): void {
  const skip = root.querySelector<HTMLAnchorElement>("[data-hero-skip]");
  skip?.addEventListener("click", () => track("hero_skip"));
  root.querySelectorAll<HTMLAnchorElement>("[data-hero-cta]").forEach((a) => {
    a.addEventListener("click", () => track("hero_cta_click", { cta: a.dataset.heroCta ?? "unknown" }));
  });
}

function setActFocusable(act: HTMLElement, focusable: boolean): void {
  act.querySelectorAll<HTMLElement>("a, button").forEach((el) => {
    if (focusable) el.removeAttribute("tabindex");
    else el.setAttribute("tabindex", "-1");
  });
}

export function initScrollHero(root: HTMLElement): void {
  try {
    wireSkip(root);

    const hints = navigator as NavigatorWithHints;
    const enabled = canScrub({
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      saveData: hints.connection?.saveData === true,
      effectiveType: hints.connection?.effectiveType,
      deviceMemory: hints.deviceMemory,
    });
    if (!enabled) return;

    upgrade(root);
  } catch (err) {
    // Any failure leaves the hero in static mode — the safe default.
    root.dataset.mode = "static";
    console.warn(err instanceof Error ? err.message : err);
  }
}

function upgrade(root: HTMLElement): void {
  const stage = must<HTMLElement>(root, "[data-hero-stage]");
  const canvas = must<HTMLCanvasElement>(root, "[data-hero-canvas]");
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new HeroError("2d canvas unavailable");

  const acts = Object.fromEntries(
    ACT_NAMES.map((name) => [name, must<HTMLElement>(root, `[data-act="${name}"]`)]),
  ) as Record<ActName, HTMLElement>;
  const railLinks = new Map<string, HTMLAnchorElement>(
    CHAPTERS.map((c) => [c.id, must<HTMLAnchorElement>(root, `a[data-chapter="${c.id}"]`)]),
  );

  const header = document.querySelector<HTMLElement>("body > header, header");
  const syncHeaderOffset = (): void => {
    if (header) root.style.setProperty("--hero-top", `${header.offsetHeight}px`);
  };
  syncHeaderOffset();

  root.dataset.mode = "scrub";

  // ---- Video: lazily fetched after first paint, source chosen by viewport ----
  const portrait = matchMedia("(max-width: 767px) and (orientation: portrait)").matches;
  const src = portrait ? root.dataset.videoMobile : root.dataset.videoDesktop;
  if (!src) throw new HeroError("missing data-video-* source");

  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");

  let duration = 5.7;
  let lastTime = -1;
  let ready = false;

  const draw = (): void => {
    const sw = video.videoWidth;
    const sh = video.videoHeight;
    if (!sw || !sh) return;
    const cw = canvas.width;
    const ch = canvas.height;
    const scale = Math.max(cw / sw, ch / sh);
    const w = sw * scale;
    const h = sh * scale;
    ctx.drawImage(video, (cw - w) / 2, (ch - h) / 2, w, h);
  };

  const resize = (): void => {
    syncHeaderOffset();
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, portrait ? 1.5 : 2);
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    if (ready) draw();
  };

  video.addEventListener("loadedmetadata", () => {
    duration = video.duration || duration;
  });
  video.addEventListener("loadeddata", () => {
    ready = true;
    draw();
    root.dataset.ready = "true";
  });
  video.addEventListener("seeked", draw);
  video.addEventListener("error", () => {
    // Keep the poster; scrolling still drives copy and rail.
    ready = false;
    delete root.dataset.ready;
  });

  const startVideo = (): void => {
    video.src = src;
    video.load();
  };
  if ("requestIdleCallback" in window) window.requestIdleCallback(startVideo, { timeout: 1500 });
  else window.setTimeout(startVideo, 300);

  // ---- Frame loop (runs only while the hero is on screen) ----
  let p = -1;
  let raf = 0;
  let visible = true;
  let lastFrameAt = performance.now();
  let velocity = 0;
  let snapTimer = 0;
  let userIsScrolling = false;
  const reached = new Set<string>();
  const lastOpacity: Record<ActName, number> = { intro: -1, river: -1, ride: -1 };

  const frame = (now: number): void => {
    raf = 0;
    const dt = Math.max(0.001, (now - lastFrameAt) / 1000);
    lastFrameAt = now;

    const rect = root.getBoundingClientRect();
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const next = scrollProgress(rect.top, root.offsetHeight, stage.offsetHeight, stickyTop);
    const instant = Math.abs(next - (p < 0 ? next : p)) / dt;
    velocity = velocity * 0.8 + instant * 0.2;

    if (next !== p) {
      p = next;
      root.style.setProperty("--p", p.toFixed(4));

      for (const name of ACT_NAMES) {
        const o = actOpacity(p, ACTS[name]);
        if (Math.abs(o - lastOpacity[name]) > OPACITY_EPSILON || o === 0 || o === 1) {
          lastOpacity[name] = o;
          acts[name].style.setProperty("--o", o.toFixed(3));
          setActFocusable(acts[name], o > FOCUS_THRESHOLD);
        }
      }

      const idx = activeChapter(p);
      CHAPTERS.forEach((c, i) => {
        const link = railLinks.get(c.id);
        if (!link) return;
        if (i === idx) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
      const chapter = CHAPTERS[idx];
      if (chapter && !reached.has(chapter.id)) {
        reached.add(chapter.id);
        track("hero_chapter_reached", { chapter: chapter.id });
      }

      root.dataset.dock = p > 0.34 ? "on" : "off";

      if (ready) {
        const t = videoTime(p, duration);
        if (Math.abs(t - lastTime) > SEEK_EPSILON) {
          lastTime = t;
          try {
            video.currentTime = t;
          } catch (err) {
            if (!(err instanceof DOMException)) throw err;
          }
        }
      }
    }

    // Hook for Task 6: fx.update(dt, velocity, p)

    if (visible) schedule();
  };

  const schedule = (): void => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) {
        lastFrameAt = performance.now();
        schedule();
      }
    },
    { rootMargin: "100px 0px" },
  ).observe(root);

  // ---- Chapters: click, deep-link, soft snap ----
  const scrollToProgress = (target: number, behavior: ScrollBehavior): void => {
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const docTop = root.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: progressToScrollY(target, docTop, root.offsetHeight, stage.offsetHeight, stickyTop),
      behavior,
    });
  };

  CHAPTERS.forEach((c) => {
    railLinks.get(c.id)?.addEventListener("click", (event) => {
      event.preventDefault();
      history.replaceState(null, "", `#${c.id}`);
      scrollToProgress(c.p, "smooth");
    });
  });

  const hashChapter = CHAPTERS.find((c) => `#${c.id}` === location.hash);
  if (hashChapter) requestAnimationFrame(() => scrollToProgress(hashChapter.p, "instant"));

  const cancelSnap = (): void => {
    userIsScrolling = true;
    window.clearTimeout(snapTimer);
  };
  ["wheel", "touchstart", "keydown", "pointerdown"].forEach((type) =>
    window.addEventListener(type, cancelSnap, { passive: true }),
  );

  const onScroll = (): void => {
    schedule();
    window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(() => {
      userIsScrolling = false;
      if (!visible) return;
      const target = nearestSnap(p, velocity);
      if (target !== null && !userIsScrolling) scrollToProgress(target, "smooth");
    }, SNAP_IDLE_MS);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    resize();
    schedule();
  });

  resize();
  schedule();
}
```

Note on snap: the `touchstart`/`pointerdown` cancel flag only matters while a gesture is in progress; `userIsScrolling` is reset by the idle timer, which is what permits the snap after the user has stopped.

- [ ] **Step 5: Run the tests**

Run: `npm run check && npx playwright test -g "Scroll hero" --reporter=line`
Expected: all Scroll hero tests PASS. If `deviceMemory` in the headless browser is < 4 and the scrub tests fail with `static`, investigate with `page.evaluate(() => navigator.deviceMemory)` before changing the gate — do not loosen the gate silently; ask the user.

- [ ] **Step 6: Visual check (Playwright MCP)**

At 1440×900 and 375×812, scroll to p = 0, 0.5, 0.9 and screenshot each; on `/ar/` screenshot p=0.5. Confirm: video frame changes with scroll; rail fills; Act II centred; Act III on the inline-end side; dock appears after Act I; hand-off gradient near the end; no text overlap during act cross-fades. Fix any CSS issues found in `ScrollHero.astro`.

- [ ] **Step 7: Commit**

```bash
git add src/scripts/scroll-hero.ts scripts/static-server.mjs tests/smoke.spec.ts
git commit -m "feat(hero): scroll-scrub controller with rail, deep-links, snap, dock and analytics"
```

---

### Task 6: Ambient FX — 2D water droplets and mist

**Files:**
- Create: `src/scripts/hero-fx.ts`
- Modify: `src/scripts/scroll-hero.ts` (hook marked in Task 5)

**Interfaces:**
- Consumes: `splashRate` from `hero-math.ts`.
- Produces: `export interface Fx { update(dt: number, velocity: number, p: number): void; resize(): void }` and `export function createFx(canvas: HTMLCanvasElement): Fx | null` (null if 2D context unavailable).

- [ ] **Step 1: Implement `src/scripts/hero-fx.ts`**

```ts
import { splashRate } from "./hero-math";

export interface Fx {
  update(dt: number, velocity: number, p: number): void;
  resize(): void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  r: number;
  mist: boolean;
}

const MAX_PARTICLES = 140;
const GRAVITY = 900;

export function createFx(canvas: HTMLCanvasElement): Fx | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const pool: Particle[] = [];
  let dpr = 1;
  let width = 0;
  let height = 0;
  let carry = 0;

  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, Math.round(rect.width * dpr));
    height = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = width;
    canvas.height = height;
  };

  const spawn = (): void => {
    if (pool.length >= MAX_PARTICLES) return;
    const mist = Math.random() < 0.18;
    pool.push({
      x: width * (0.15 + Math.random() * 0.75),
      y: height * (0.7 + Math.random() * 0.22),
      vx: (Math.random() - 0.5) * 120 * dpr,
      vy: mist ? -30 * dpr : -(140 + Math.random() * 260) * dpr,
      life: 0,
      maxLife: mist ? 1.4 + Math.random() * 0.6 : 0.6 + Math.random() * 0.5,
      r: (mist ? 22 + Math.random() * 28 : 1.4 + Math.random() * 2.4) * dpr,
      mist,
    });
  };

  const update = (dt: number, velocity: number, p: number): void => {
    carry += splashRate(velocity, p) * dt;
    while (carry >= 1) {
      spawn();
      carry -= 1;
    }

    ctx.clearRect(0, 0, width, height);
    for (let i = pool.length - 1; i >= 0; i--) {
      const q = pool[i];
      if (!q) continue;
      q.life += dt;
      if (q.life >= q.maxLife) {
        pool.splice(i, 1);
        continue;
      }
      if (!q.mist) q.vy += GRAVITY * dpr * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      const fade = 1 - q.life / q.maxLife;

      if (q.mist) {
        ctx.fillStyle = `rgba(255,255,255,${(0.07 * fade).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r * (1 + q.life * 0.6), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = `rgba(255,255,255,${(0.75 * fade).toFixed(3)})`;
        ctx.lineWidth = q.r;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(q.x - q.vx * 0.02, q.y - q.vy * 0.02);
        ctx.stroke();
      }
    }
  };

  resize();
  return { update, resize };
}
```

- [ ] **Step 2: Wire into `scroll-hero.ts`**

Add `import { createFx } from "./hero-fx";` at the top. Inside `upgrade()`, after the `canvas`/`ctx` setup:
```ts
const fxCanvas = must<HTMLCanvasElement>(root, "[data-hero-fx]");
const fx = createFx(fxCanvas);
```
Replace the `// Hook for Task 6` line in `frame` with:
```ts
    fx?.update(dt, velocity, p);
```
and in the resize listener add `fx?.resize();`.

- [ ] **Step 3: Verify**

Run: `npm run check && npx playwright test -g "Scroll hero" --reporter=line`
Expected: PASS. Then Playwright MCP: scroll quickly through p ≈ 0.4–0.7 and screenshot mid-scroll — droplets/mist visible over the water area; standing still, they fade out within ~1.5 s. Tune `SPLASH_WINDOW` in `hero-math.ts` (and the unit test's expectations only if the window moves) by eye; tune spawn `y` range if droplets are not over the water.

- [ ] **Step 4: Commit**

```bash
git add src/scripts/hero-fx.ts src/scripts/scroll-hero.ts
git commit -m "feat(hero): add 2D droplet/mist ambient layer driven by scroll velocity"
```

---

### Task 7: Full verification, performance and handoff

**Files:**
- Modify: `README.md` (short "Hero" section), `CLAUDE.md` (one line under Locked build decisions), only if verification passes.

- [ ] **Step 1: Run the whole suite**

Run: `npm run test:unit && npm run check && npm run build && npm run test:e2e`
Expected: unit PASS, check clean, build OK for all 3 locales, e2e PASS. Report any failure with output; do not claim success otherwise.

- [ ] **Step 2: Lighthouse** (build served via `node scripts/static-server.mjs`)

Run for `/`, `/ar/`, `/fr/` at mobile (375px, default Lighthouse mobile throttling) and desktop:
```bash
npx -y lighthouse http://localhost:4321/ --only-categories=performance,accessibility --preset=desktop --output=json --output-path=$SCRATCH/lh-desktop.json --quiet --chrome-flags="--headless"
npx -y lighthouse http://localhost:4321/ --only-categories=performance,accessibility --output=json --output-path=$SCRATCH/lh-mobile.json --quiet --chrome-flags="--headless"
```
Read LCP, CLS, TBT, accessibility score. Targets: LCP < 2.5 s, CLS < 0.1. If LCP fails, first check the LCP element (should be the H1 or the poster `<img>`); if the video request competes, delay `startVideo` (increase the idle timeout) before any other change. If CLS fails, check the static→scrub runway height switch (spec risk: it happens below the fold and should not register).

- [ ] **Step 3: RTL/375px/reduced-motion pass (Playwright MCP)**

`/ar/` at 375×812 and 1440×900: rail on the right, Act III on the left, gold bar grows from the right, no clipped text. Emulate `prefers-reduced-motion: reduce` and `Save-Data`: static hero, no `.mp4` in network log.

- [ ] **Step 4: Document**

Add to `README.md` a "Hero" subsection (assets in `public/images/hero`, regenerate with `scripts/encode-hero.sh <master> <x0> <x1>`, `npm run test:unit`, capability gate summary). Add one line to `CLAUDE.md` under "Locked build decisions": `**Hero:** src/components/ScrollHero.astro + src/scripts/{scroll-hero,hero-fx,hero-math}.ts — scroll-scrubbed video, static fallback; clip is AI-generated (see PRELAUNCH_CHECKLIST.md).`

- [ ] **Step 5: Final report to the user**

State plainly: what passed (with numbers), the three spec deviations (WebP-only posters, t=0 poster, prototype's invisible-H1 bug fixed), and open items (crop framing confirmed at Task 1, client licence sign-off, native AR/FR review, phase 2 3D water).

- [ ] **Step 6: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: document the scroll hero"
```

---

## Phase 2 (separate plan, not in this one)

Optional desktop-only lazy Three.js water layer. Start only after Task 7 budgets pass; gate on `canScrub()`, `(min-width: 1024px)`, `deviceMemory ≥ 8` when reported; load via dynamic `import()` after `visible` first becomes true; must not regress LCP/CLS/TBT. Needs its own spec addendum (shader approach, bundle budget) and plan.

## Self-review notes

- **Spec coverage:** clip role/checklist (T3), mobile gate (T2/T5), 3 acts + i18n + REVIEW_NOTES (T3), Trail Chapters rail (T4/T5), push-in/grade (T4 CSS), hand-off (T4 CSS), dock (T4/T5), location readout (T4), deep-links + snap (T5), skip (T4/T5), ambient FX (T4 CSS shafts + T6), analytics (T5), two encodes + crop (T1), tests (T2/T4/T5), Lighthouse (T7), checklist (T3). Phase 2 explicitly deferred.
- **Deviations from spec** are listed in Global Constraints and repeated in T7 step 5.
- **Type/name consistency:** `ACTS`, `CHAPTERS`, `actOpacity`, `activeChapter`, `videoTime`, `scrollProgress`, `progressToScrollY`, `nearestSnap`, `canScrub`, `splashRate`, `createFx`, `initScrollHero`, and the `data-*` selectors are identical across tasks.
