// Lazy, visibility-gated playback for AmbientVideo.astro clips.

interface NetworkInfo {
  effectiveType?: string;
  saveData?: boolean;
}

const LOAD_MARGIN = "300px 0px";
const PLAY_THRESHOLD = 0.25;

function motionAllowed(): boolean {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  const c = (navigator as Navigator & { connection?: NetworkInfo }).connection;
  if (c?.saveData) return false;
  if (c?.effectiveType && /2g/.test(c.effectiveType)) return false;
  return true;
}

function attach(v: HTMLVideoElement): void {
  if (v.dataset.src && !v.getAttribute("src")) {
    v.src = v.dataset.src;
    v.preload = "auto";
  }
}

function play(v: HTMLVideoElement): void {
  // The play path attaches the source itself: it must not depend on the preloading
  // observer's callback having run first.
  attach(v);
  // Autoplay can still be refused (low-power mode, policy); the poster stays, which is fine.
  v.play().catch(() => undefined);
}

export function initAmbientVideos(videos: NodeListOf<HTMLVideoElement>): void {
  try {
    if (!videos.length || !motionAllowed()) return;

    const visible = new Set<HTMLVideoElement>();

    const loader = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const v = e.target as HTMLVideoElement;
          loader.unobserve(v);
          attach(v);
        }
      },
      { rootMargin: LOAD_MARGIN },
    );

    const player = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting) {
            visible.add(v);
            if (!document.hidden) play(v);
          } else {
            visible.delete(v);
            v.pause();
          }
        }
      },
      { threshold: PLAY_THRESHOLD },
    );

    videos.forEach((v) => {
      // The component script runs once per page however many clips it renders.
      if (v.dataset.ambientInit) return;
      v.dataset.ambientInit = "true";
      // Reveal over the poster only once real frames are showing.
      v.addEventListener("playing", () => (v.dataset.playing = "true"), { once: true });
      loader.observe(v);
      player.observe(v);
    });

    document.addEventListener("visibilitychange", () => {
      visible.forEach((v) => (document.hidden ? v.pause() : play(v)));
    });
  } catch (err) {
    console.warn("[ambient-video]", err instanceof Error ? err.message : err);
  }
}
