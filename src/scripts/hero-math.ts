// Pure timing maths for the autoplaying hero (scroll-hero.ts). `p` is loop progress: the
// video's currentTime / duration, 0..1, wrapping back to 0 as the loop restarts.

export type ActName = "intro" | "ridge" | "ride";

/** An act's visible span in loop progress; fades are lengths in the same units. */
export interface ActWindow {
  start: number;
  end: number;
  fadeIn: number;
  fadeOut: number;
}

/**
 * Each hand-off overlap is centred on the shot crossfade it accompanies (0.32, 0.68). The
 * intro starts before 0 so it fades back in across the loop seam, where the clip crossfades
 * its last 0.4 s into frame 0 (scripts/encode-hero-v2.sh).
 */
export const ACTS: Record<ActName, ActWindow> = {
  intro: { start: -0.04, end: 0.35, fadeIn: 0.04, fadeOut: 0.06 },
  ridge: { start: 0.29, end: 0.71, fadeIn: 0.06, fadeOut: 0.06 },
  ride: { start: 0.65, end: 1, fadeIn: 0.06, fadeOut: 0.04 },
};

/**
 * Loop progress at which the v2 clip crossfades from one shot to the next.
 * scripts/encode-hero-v2.sh solves its segment lengths for exactly these values.
 */
export const HERO_SEGMENT_BOUNDARIES = [0.32, 0.68] as const;

export interface Chapter {
  id: "shouf" | "ridge" | "ride";
  act: ActName;
  /** Loop progress a rail click / deep link jumps to: the start of the act fully shown. */
  p: number;
}

export const CHAPTERS: readonly Chapter[] = [
  { id: "shouf", act: "intro", p: 0 },
  { id: "ridge", act: "ridge", p: 0.36 },
  { id: "ride", act: "ride", p: 0.72 },
];

const VIDEO_END_GUARD = 0.035;
const MID_ACT: readonly [number, number] = [0.3, 0.8];
const DUST_IDLE = 4;
const DUST_MID = 10;
const SPLASH_IDLE = 12;
const SPLASH_MID = 30;

export function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function windowOpacity(p: number, w: ActWindow): number {
  const up = w.fadeIn > 0 ? (p - w.start) / w.fadeIn : 1;
  const down = w.fadeOut > 0 ? (w.end - p) / w.fadeOut : 1;
  return clamp01(Math.min(up, down));
}

/** Opacity of an act at loop progress `p`, wrapping across the loop seam. */
export function actOpacity(p: number, w: ActWindow): number {
  return Math.max(
    windowOpacity(p, w),
    windowOpacity(p - 1, w),
    windowOpacity(p + 1, w),
  );
}

/** Chapter index for the rail: it flips with the shot changes. */
export function activeChapter(p: number): number {
  if (p < HERO_SEGMENT_BOUNDARIES[0]) return 0;
  if (p < HERO_SEGMENT_BOUNDARIES[1]) return 1;
  return 2;
}

export function loopProgress(time: number, duration: number): number {
  if (!(duration > 0) || !Number.isFinite(time)) return 0;
  return clamp01(time / duration);
}

/** Seek target for progress `p`, kept short of the last frame. */
export function videoTime(p: number, duration: number): number {
  const max = Math.max(0, duration - VIDEO_END_GUARD);
  return clamp01(p) * max;
}

export interface CapabilityEnv {
  reducedMotion: boolean;
  saveData: boolean;
  effectiveType?: string;
  deviceMemory?: number;
}

// "3g" is not excluded: Chrome reports it for any RTT over ~270 ms, which is ordinary
// broadband in Lebanon (measured 350 ms / 1.45 Mb/s) and kept the hero static for most of
// its audience. It gets the lighter clip instead (liteVideo).
export function canAutoplay(env: CapabilityEnv): boolean {
  if (env.reducedMotion || env.saveData) return false;
  if (env.effectiveType && /^(slow-2g|2g)$/.test(env.effectiveType))
    return false;
  if (typeof env.deviceMemory === "number" && env.deviceMemory < 4)
    return false;
  return true;
}

/** On a "3g" estimate the desktop panel takes the 540p clip (half the bytes of the 720p one). */
export function liteVideo(effectiveType: string | undefined): boolean {
  return effectiveType === "3g";
}

function inMidAct(p: number): boolean {
  return p >= MID_ACT[0] && p <= MID_ACT[1];
}

/** v1 water droplets per second at loop progress `p`: heaviest over the mid-act shot. */
export function splashRate(p: number): number {
  return inMidAct(p) ? SPLASH_MID : SPLASH_IDLE;
}

/** v2 dust motes per second: a faint golden-hour drift, a little thicker over the gallop. */
export function dustRate(p: number): number {
  return inMidAct(p) ? DUST_MID : DUST_IDLE;
}
