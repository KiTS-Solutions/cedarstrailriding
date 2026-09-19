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
export const SNAP_MAX_VELOCITY = 0.02;
/** Time constant (s) of the scroll-velocity low-pass filter. */
export const VELOCITY_TAU = 0.08;
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

/**
 * Frame-rate independent low-pass of scroll velocity (progress/second). `instant` is the
 * unsmoothed speed and is expected to be non-negative.
 */
export function smoothVelocity(
  velocity: number,
  instant: number,
  dt: number,
): number {
  const k = 1 - Math.exp(-Math.max(0, dt) / VELOCITY_TAU);
  return Math.max(0, velocity + (Math.max(0, instant) - velocity) * k);
}

/**
 * Chapter a position would settle on if the page were still, ignoring velocity.
 * The first chapter is never a target: it is the start position, so snapping there
 * would yank users who merely nudge the page off the top.
 */
export function snapCandidate(p: number): number | null {
  if (p < 0.02 || p > 0.98) return null;
  for (const c of CHAPTERS.slice(1)) {
    const d = Math.abs(p - c.p);
    if (d <= SNAP_RADIUS && d > SNAP_DEAD_ZONE) return c.p;
  }
  return null;
}

/** Progress of the chapter to settle on, or null when no snap should happen. */
export function nearestSnap(p: number, velocity: number): number | null {
  if (velocity > SNAP_MAX_VELOCITY) return null;
  return snapCandidate(p);
}

export interface CapabilityEnv {
  reducedMotion: boolean;
  saveData: boolean;
  effectiveType?: string;
  deviceMemory?: number;
}

export function canScrub(env: CapabilityEnv): boolean {
  if (env.reducedMotion || env.saveData) return false;
  if (env.effectiveType && /^(slow-2g|2g|3g)$/.test(env.effectiveType))
    return false;
  if (typeof env.deviceMemory === "number" && env.deviceMemory < 4)
    return false;
  return true;
}

/** Droplets per second for a scroll velocity (progress/second) at progress `p`. */
export function splashRate(velocity: number, p: number): number {
  const v = clamp01(velocity / 0.5);
  const inRiver = p >= SPLASH_WINDOW[0] && p <= SPLASH_WINDOW[1];
  return (inRiver ? 90 : 12) * v;
}
