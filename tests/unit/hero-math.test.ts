import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACTS,
  CHAPTERS,
  actOpacity,
  activeChapter,
  canScrub,
  clamp01,
  dustRate,
  HERO_SEGMENT_BOUNDARIES,
  nearestSnap,
  progressToScrollY,
  scrollProgress,
  smoothVelocity,
  snapCandidate,
  SNAP_MAX_VELOCITY,
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

test("intro fades out, ridge fades in across the overlap", () => {
  assert.equal(actOpacity(0.26, ACTS.intro), 1);
  assert.equal(actOpacity(0.34, ACTS.intro), 0);
  assert.equal(actOpacity(0.3, ACTS.ridge), 0);
  assert.equal(actOpacity(0.38, ACTS.ridge), 1);
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
    assert.ok(
      Math.abs(scrollProgress(runwayTopInViewport, h, stage, top) - p) < 1e-9,
    );
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
  assert.equal(
    canScrub({ reducedMotion: false, saveData: false, effectiveType: "3g" }),
    false,
  );
  assert.equal(
    canScrub({ reducedMotion: false, saveData: false, effectiveType: "4g" }),
    true,
  );
  assert.equal(
    canScrub({ reducedMotion: false, saveData: false, deviceMemory: 2 }),
    false,
  );
  assert.equal(
    canScrub({ reducedMotion: false, saveData: false, deviceMemory: 8 }),
    true,
  );
});

test("splashRate scales with velocity and peaks in the mid-act window", () => {
  assert.equal(splashRate(0, 0.5), 0);
  assert.ok(splashRate(0.5, 0.5) > splashRate(0.5, 0.05));
  assert.ok(splashRate(0.5, 0.5) > splashRate(0.1, 0.5));
  assert.ok(splashRate(99, 0.5) <= 90);
});

test("activeChapter boundaries", () => {
  assert.equal(activeChapter(0.33), 0);
  assert.equal(activeChapter(0.34), 1);
  assert.equal(activeChapter(0.67), 1);
  assert.equal(activeChapter(0.68), 2);
});

test("nearestSnap targets ridge and ride, never the first chapter", () => {
  assert.equal(nearestSnap(0.45, 0), 0.5);
  assert.equal(nearestSnap(0.55, 0), 0.5);
  assert.equal(nearestSnap(0.82, 0), 0.86);
  assert.equal(nearestSnap(0.9, 0), 0.86);
  // shouf (p=0.12) is the start position: nudging the page must not yank the user back
  assert.equal(nearestSnap(0.1, 0), null);
  assert.equal(nearestSnap(0.14, 0), null);
  assert.equal(nearestSnap(0.12, 0), null);
});

test("nearestSnap radius and dead-zone boundaries", () => {
  assert.equal(nearestSnap(0.5 + 0.059, 0), 0.5);
  assert.equal(nearestSnap(0.5 - 0.059, 0), 0.5);
  assert.equal(nearestSnap(0.5 + 0.061, 0), null);
  assert.equal(nearestSnap(0.5 - 0.061, 0), null);
  assert.equal(nearestSnap(0.5 + 0.003, 0), null);
  assert.equal(nearestSnap(0.5 + 0.005, 0), 0.5);
});

test("nearestSnap velocity gate; snapCandidate ignores velocity", () => {
  assert.equal(nearestSnap(0.52, SNAP_MAX_VELOCITY), 0.5);
  assert.equal(nearestSnap(0.52, SNAP_MAX_VELOCITY + 0.001), null);
  assert.equal(snapCandidate(0.52), 0.5);
  assert.equal(snapCandidate(0.3), null);
});

test("smoothVelocity is frame-rate independent and never negative", () => {
  // Same wall-clock time, different frame rates -> same result.
  let a = 0.4;
  for (let i = 0; i < 60; i++) a = smoothVelocity(a, 0, 1 / 60);
  let b = 0.4;
  for (let i = 0; i < 30; i++) b = smoothVelocity(b, 0, 1 / 30);
  assert.ok(Math.abs(a - b) < 1e-9);
  // ~0.34 progress/s from one wheel tick falls under the snap gate within ~0.25 s
  let v = 0.34;
  for (let i = 0; i < 15; i++) v = smoothVelocity(v, 0, 1 / 60);
  assert.ok(v < SNAP_MAX_VELOCITY);
  assert.ok(smoothVelocity(0, 0, 0.016) >= 0);
  assert.ok(smoothVelocity(0.1, -5, 0.5) >= 0);
});

test("v2 shot crossfades sit at the midpoint of each act hand-off", () => {
  const order = [ACTS.intro, ACTS.ridge, ACTS.ride];
  HERO_SEGMENT_BOUNDARIES.forEach((b, i) => {
    const out = order[i]!;
    const into = order[i + 1]!;
    // the overlap where one act fades out while the next fades in
    assert.ok(into.start < out.end);
    assert.ok(Math.abs(b - (into.start + out.end) / 2) < 1e-9);
    // and the chapter rail flips within that same overlap
    assert.equal(activeChapter(into.start), i);
    assert.equal(activeChapter(out.end), i + 1);
  });
});

test("chapters are shouf, ridge, ride in order", () => {
  assert.deepEqual(
    CHAPTERS.map((c) => c.id),
    ["shouf", "ridge", "ride"],
  );
});

test("dustRate drifts at rest and thickens with speed in the mid act", () => {
  assert.ok(dustRate(0, 0.1) > 0);
  assert.equal(dustRate(0, 0.1), dustRate(0, 0.5));
  assert.ok(dustRate(0.5, 0.5) > dustRate(0.5, 0.1));
  assert.ok(dustRate(0.5, 0.5) > dustRate(0, 0.5));
  assert.ok(dustRate(99, 0.5) <= dustRate(0.5, 0.5));
});
