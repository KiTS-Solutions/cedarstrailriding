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

    const start = (): void => {
      videos.forEach((v) => {
        // The component script runs once per page however many clips it renders.
        if (v.dataset.ambientInit) return;
        v.dataset.ambientInit = "true";
        // Reveal over the poster only once real frames are showing.
        v.addEventListener("playing", () => (v.dataset.playing = "true"), {
          once: true,
        });
        loader.observe(v);
        player.observe(v);
      });
    };
    // The one-screen hero puts the About band's clip inside the load margin at page load.
    // `load` waits for the hero video's first frame, so on a slow link the hero clip gets
    // the bandwidth first.
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    document.addEventListener("visibilitychange", () => {
      visible.forEach((v) => (document.hidden ? v.pause() : play(v)));
    });
  } catch (err) {
    console.warn("[ambient-video]", err instanceof Error ? err.message : err);
  }
}

// ---- Backdrops (AmbientBackdrop.astro) ----

/** Drawn at 1/3 of CSS size like the hero backdrop: soft under the blur, cheap per frame. */
const BACKDROP_DOWNSCALE = 3;

type FrameVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (cb: () => void) => number;
};

function mirror(canvas: HTMLCanvasElement, video: FrameVideo): void {
  const maybeCtx = canvas.getContext("2d");
  if (!maybeCtx) return;
  const ctx: CanvasRenderingContext2D = maybeCtx;

  const resize = (): void => {
    const r = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(r.width / BACKDROP_DOWNSCALE));
    canvas.height = Math.max(1, Math.round(r.height / BACKDROP_DOWNSCALE));
    draw();
  };

  // object-fit: cover, in canvas terms.
  function draw(): void {
    const sw = video.videoWidth;
    const sh = video.videoHeight;
    if (!sw || !sh || canvas.width < 2) return;
    const scale = Math.max(canvas.width / sw, canvas.height / sh);
    const w = sw * scale;
    const h = sh * scale;
    try {
      ctx.drawImage(
        video,
        (canvas.width - w) / 2,
        (canvas.height - h) / 2,
        w,
        h,
      );
    } catch (err) {
      if (!(err instanceof DOMException)) throw err;
      return;
    }
    canvas.dataset.drawn = "true";
  }

  // One draw per decoded frame where supported; otherwise per animation frame. Both loops
  // stop on their own once the clip pauses (off-screen / hidden tab) and restart on "playing".
  let looping = false;
  const tick = (): void => {
    if (video.paused || video.ended) {
      looping = false;
      return;
    }
    draw();
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback(tick);
    else requestAnimationFrame(tick);
  };
  video.addEventListener("playing", () => {
    if (looping) return;
    looping = true;
    tick();
  });

  new ResizeObserver(resize).observe(canvas);
}

export function initAmbientBackdrops(
  canvases: NodeListOf<HTMLCanvasElement>,
): void {
  try {
    canvases.forEach((canvas) => {
      if (canvas.dataset.ambientInit) return;
      canvas.dataset.ambientInit = "true";
      const video = canvas
        .closest("[data-ambient-scope]")
        ?.querySelector<HTMLVideoElement>("[data-ambient-video]");
      // No paired clip: the blurred poster alone is the backdrop.
      if (video) mirror(canvas, video);
    });
  } catch (err) {
    console.warn(
      "[ambient-backdrop]",
      err instanceof Error ? err.message : err,
    );
  }
}
