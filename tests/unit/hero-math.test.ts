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

test("splashRate scales with velocity and peaks in the river window", () => {
  assert.equal(splashRate(0, 0.5), 0);
  assert.ok(splashRate(0.5, 0.5) > splashRate(0.5, 0.05));
  assert.ok(splashRate(0.5, 0.5) > splashRate(0.1, 0.5));
  assert.ok(splashRate(99, 0.5) <= 90);
});
