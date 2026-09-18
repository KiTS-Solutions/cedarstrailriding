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
