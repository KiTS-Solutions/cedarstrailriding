import { dustRate, splashRate } from "./hero-math";

export interface Fx {
  update(dt: number, p: number): void;
  resize(): void;
}

/** "splash" = v1 river droplets; "dust" = v2 golden-hour dust motes. */
export type FxStyle = "splash" | "dust";

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

export function createFx(
  canvas: HTMLCanvasElement,
  style: FxStyle = "splash",
): Fx | null {
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

  const spawnSplash = (): void => {
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

  // Dust rises lazily from the lower half and drifts sideways; a few soft, larger motes
  // ("mist") read as out-of-focus specks catching the low sun.
  const spawnDust = (): void => {
    const mist = Math.random() < 0.15;
    pool.push({
      x: width * Math.random(),
      y: height * (0.45 + Math.random() * 0.55),
      vx: (Math.random() - 0.35) * 40 * dpr,
      vy: -(8 + Math.random() * 30) * dpr,
      life: 0,
      maxLife: 2.2 + Math.random() * 2.2,
      r: (mist ? 3 + Math.random() * 4 : 0.6 + Math.random() * 1.3) * dpr,
      mist,
    });
  };

  const drawSplash = (q: Particle, fade: number): void => {
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
  };

  const drawDust = (q: Particle, fade: number): void => {
    // Fade in over the first 20% of life too, so motes never pop into existence.
    const a = Math.min(fade, (q.life / q.maxLife) * 5) * (q.mist ? 0.16 : 0.55);
    ctx.fillStyle = `rgba(255,222,165,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2);
    ctx.fill();
  };

  const rate = style === "dust" ? dustRate : splashRate;
  const spawn = style === "dust" ? spawnDust : spawnSplash;
  const draw = style === "dust" ? drawDust : drawSplash;

  const update = (dt: number, p: number): void => {
    carry += rate(p) * dt;
    while (carry >= 1) {
      if (pool.length < MAX_PARTICLES) spawn();
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
      if (style === "splash" && !q.mist) q.vy += GRAVITY * dpr * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      draw(q, 1 - q.life / q.maxLife);
    }
  };

  resize();
  return { update, resize };
}
