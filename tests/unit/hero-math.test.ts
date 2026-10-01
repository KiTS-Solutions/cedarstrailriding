import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ACTS,
  CHAPTERS,
  actOpacity,
  activeChapter,
  canAutoplay,
  liteVideo,
  clamp01,
  dustRate,
  HERO_SEGMENT_BOUNDARIES,
  loopProgress,
  splashRate,
  videoTime,
} from "../../src/scripts/hero-math.ts";

const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-9;

test("clamp01 bounds values", () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(0.4), 0.4);
  assert.equal(clamp01(3), 1);
});

test("intro act is fully visible at p=0 (the static, no-JS frame)", () => {
  assert.equal(actOpacity(0, ACTS.intro), 1);
  assert.equal(actOpacity(0, ACTS.ridge), 0);
  assert.equal(actOpacity(0, ACTS.ride), 0);
});

test("intro fades out, ridge fades in across the first overlap", () => {
  assert.equal(actOpacity(0.28, ACTS.intro), 1);
  assert.equal(actOpacity(0.35, ACTS.intro), 0);
  assert.equal(actOpacity(0.29, ACTS.ridge), 0);
  assert.equal(actOpacity(0.36, ACTS.ridge), 1);
  // Mid-overlap the two cross at half opacity.
  assert.ok(near(actOpacity(0.32, ACTS.intro), 0.5));
  assert.ok(near(actOpacity(0.32, ACTS.ridge), 0.5));
});

test("ride hands back to the intro across the loop seam", () => {
  assert.equal(actOpacity(0.9, ACTS.ride), 1);
  assert.equal(actOpacity(0.65, ACTS.ride), 0);
  assert.equal(actOpacity(1, ACTS.ride), 0);
  assert.ok(near(actOpacity(0.98, ACTS.ride), 0.5));
  assert.ok(near(actOpacity(0.98, ACTS.intro), 0.5));
  assert.equal(actOpacity(0.9, ACTS.intro), 0);
});

test("only one act is fully shown at a time, and some act always shows", () => {
  for (let i = 0; i <= 1000; i++) {
    const p = i / 1000;
    const o = [ACTS.intro, ACTS.ridge, ACTS.ride].map((w) => actOpacity(p, w));
    assert.ok(o.filter((x) => x === 1).length <= 1, `p=${p}`);
    assert.ok(o.reduce((a, b) => a + b, 0) >= 0.999, `p=${p}`);
  }
});

test("activeChapter flips with the shot changes", () => {
  assert.equal(activeChapter(0), 0);
  assert.equal(activeChapter(0.3199), 0);
  assert.equal(activeChapter(0.32), 1);
  assert.equal(activeChapter(0.6799), 1);
  assert.equal(activeChapter(0.68), 2);
  assert.equal(activeChapter(1), 2);
});

test("v2 shot crossfades sit at the midpoint of each act hand-off", () => {
  const order = [ACTS.intro, ACTS.ridge, ACTS.ride];
  HERO_SEGMENT_BOUNDARIES.forEach((b, i) => {
    const out = order[i]!;
    const into = order[i + 1]!;
    assert.ok(into.start < out.end);
    assert.ok(near(b, (into.start + out.end) / 2));
    assert.equal(activeChapter(into.start), i);
    assert.equal(activeChapter(out.end), i + 1);
  });
});

test("chapters are shouf, ridge, ride, each jumping to its act fully shown", () => {
  assert.deepEqual(
    CHAPTERS.map((c) => c.id),
    ["shouf", "ridge", "ride"],
  );
  for (const c of CHAPTERS) {
    assert.equal(actOpacity(c.p, ACTS[c.act]), 1, c.id);
    assert.equal(CHAPTERS[activeChapter(c.p)]!.id, c.id);
  }
});

test("loopProgress maps playback time to 0..1 and survives bad durations", () => {
  assert.equal(loopProgress(0, 13), 0);
  assert.equal(loopProgress(6.5, 13), 0.5);
  assert.equal(loopProgress(14, 13), 1);
  assert.equal(loopProgress(3, 0), 0);
  assert.equal(loopProgress(3, Number.NaN), 0);
  assert.equal(loopProgress(Number.NaN, 13), 0);
});

test("videoTime maps progress onto the clip, clamped short of the last frame", () => {
  assert.equal(videoTime(0, 13), 0);
  assert.ok(near(videoTime(1, 13), 13 - 0.035));
  assert.equal(videoTime(2, 13), videoTime(1, 13));
  assert.equal(videoTime(0.5, 0), 0);
});

test("liteVideo picks the lighter clip only on a 3g estimate", () => {
  assert.equal(liteVideo("3g"), true);
  assert.equal(liteVideo("4g"), false);
  assert.equal(liteVideo(undefined), false);
});

test("canAutoplay gates on motion, data saver, connection and memory", () => {
  const ok = { reducedMotion: false, saveData: false };
  assert.equal(canAutoplay(ok), true);
  assert.equal(canAutoplay({ ...ok, reducedMotion: true }), false);
  assert.equal(canAutoplay({ ...ok, saveData: true }), false);
  // Chrome reports "3g" for any RTT over ~270 ms, i.e. ordinary broadband in Lebanon.
  assert.equal(canAutoplay({ ...ok, effectiveType: "3g" }), true);
  assert.equal(canAutoplay({ ...ok, effectiveType: "4g" }), true);
  assert.equal(canAutoplay({ ...ok, effectiveType: "2g" }), false);
  assert.equal(canAutoplay({ ...ok, effectiveType: "slow-2g" }), false);
  assert.equal(canAutoplay({ ...ok, deviceMemory: 2 }), false);
  assert.equal(canAutoplay({ ...ok, deviceMemory: 8 }), true);
});

test("particle rates: a constant drift, thicker over the mid act", () => {
  assert.ok(dustRate(0.1) > 0);
  assert.ok(dustRate(0.5) > dustRate(0.1));
  assert.ok(splashRate(0.1) > 0);
  assert.ok(splashRate(0.5) > splashRate(0.1));
});
