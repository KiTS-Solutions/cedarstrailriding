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
type NavigatorWithHints = Navigator & {
  connection?: NetworkInfo;
  deviceMemory?: number;
};

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

function track(
  name: string,
  params: Record<string, string | number> = {},
): void {
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
    a.addEventListener("click", () =>
      track("hero_cta_click", { cta: a.dataset.heroCta ?? "unknown" }),
    );
  });
}

function setFocusable(act: HTMLElement, focusable: boolean): void {
  act.querySelectorAll<HTMLElement>("a, button").forEach((el) => {
    if (focusable) el.removeAttribute("tabindex");
    else el.setAttribute("tabindex", "-1");
  });
}

// A faded-out act must be inert: later acts stack above earlier ones and would swallow taps.
function setActActive(act: HTMLElement, active: boolean): void {
  setFocusable(act, active);
  act.style.pointerEvents = active ? "" : "none";
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
    ACT_NAMES.map((name) => [
      name,
      must<HTMLElement>(root, `[data-act="${name}"]`),
    ]),
  ) as Record<ActName, HTMLElement>;
  const railLinks = new Map<string, HTMLAnchorElement>(
    CHAPTERS.map((c) => [
      c.id,
      must<HTMLAnchorElement>(root, `a[data-chapter="${c.id}"]`),
    ]),
  );

  const header = document.querySelector<HTMLElement>("body > header, header");
  const syncHeaderOffset = (): void => {
    if (header)
      root.style.setProperty("--hero-top", `${header.offsetHeight}px`);
  };
  syncHeaderOffset();

  const dock = root.querySelector<HTMLElement>("[data-hero-dock]");
  if (dock) setFocusable(dock, false); // dock starts off; keep it out of the tab order

  root.dataset.mode = "scrub";

  // ---- Video: lazily fetched after first paint, source chosen by viewport ----
  const portrait = matchMedia(
    "(max-width: 767px) and (orientation: portrait)",
  ).matches;
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
    // The user may already be past frame 0 (deep link, restored scroll) with no scroll
    // event to trigger a seek, so resync now. `seeked` repaints the canvas.
    lastTime = -1;
    if (p >= 0) {
      lastTime = videoTime(p, duration);
      try {
        video.currentTime = lastTime;
      } catch (err) {
        if (!(err instanceof DOMException)) throw err;
        draw();
      }
    } else {
      draw();
    }
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
  // Safari lacks requestIdleCallback; `in` would narrow the else branch to never.
  if (typeof window.requestIdleCallback === "function")
    window.requestIdleCallback(startVideo, { timeout: 1500 });
  else window.setTimeout(startVideo, 300);

  // ---- Frame loop (runs only while the hero is on screen) ----
  let p = -1;
  let raf = 0;
  let visible = true;
  let lastFrameAt = performance.now();
  let velocity = 0;
  let snapTimer = 0;
  let pointerHeld = false; // mouse / pen button
  let touchHeld = false; // one or more fingers down
  const reached = new Set<string>();
  const lastOpacity: Record<ActName, number> = {
    intro: -1,
    river: -1,
    ride: -1,
  };

  const frame = (now: number): void => {
    raf = 0;
    const dt = Math.max(0.001, (now - lastFrameAt) / 1000);
    lastFrameAt = now;

    const rect = root.getBoundingClientRect();
    const stickyTop = parseFloat(getComputedStyle(stage).top) || 0;
    const next = scrollProgress(
      rect.top,
      root.offsetHeight,
      stage.offsetHeight,
      stickyTop,
    );
    const instant = Math.abs(next - (p < 0 ? next : p)) / dt;
    velocity = velocity * 0.8 + instant * 0.2;

    if (next !== p) {
      p = next;
      root.style.setProperty("--p", p.toFixed(4));

      for (const name of ACT_NAMES) {
        const o = actOpacity(p, ACTS[name]);
        if (
          Math.abs(o - lastOpacity[name]) > OPACITY_EPSILON ||
          o === 0 ||
          o === 1
        ) {
          lastOpacity[name] = o;
          acts[name].style.setProperty("--o", o.toFixed(3));
          setActActive(acts[name], o > FOCUS_THRESHOLD);
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

      const dockState = p > 0.34 ? "on" : "off";
      if (root.dataset.dock !== dockState) {
        root.dataset.dock = dockState;
        if (dock) setFocusable(dock, dockState === "on");
      }

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
      top: progressToScrollY(
        target,
        docTop,
        root.offsetHeight,
        stage.offsetHeight,
        stickyTop,
      ),
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
  if (hashChapter)
    requestAnimationFrame(() => scrollToProgress(hashChapter.p, "instant"));

  const isHeld = (): boolean => touchHeld || pointerHeld;
  const runSnap = (): void => {
    if (!visible || isHeld()) return;
    const target = nearestSnap(p, velocity);
    if (target !== null) scrollToProgress(target, "smooth");
  };
  const armSnap = (): void => {
    window.clearTimeout(snapTimer);
    snapTimer = window.setTimeout(runSnap, SNAP_IDLE_MS);
  };
  // Wheel/keys cancel a pending snap; the next scroll event re-arms it.
  ["wheel", "keydown"].forEach((type) =>
    window.addEventListener(type, () => window.clearTimeout(snapTimer), { passive: true }),
  );

  // A held finger/button must never be snapped under; re-arm once nothing is held.
  // Touch state comes from touch events only: browsers fire `pointercancel` on touch
  // pointers when they take over a drag as a native pan, while the finger is still down.
  const releaseIfIdle = (): void => {
    if (!isHeld()) armSnap();
  };
  const syncTouches = (event: TouchEvent): void => {
    touchHeld = event.touches.length > 0;
    if (touchHeld) window.clearTimeout(snapTimer);
    else releaseIfIdle();
  };
  ["touchstart", "touchmove", "touchend", "touchcancel"].forEach((type) =>
    window.addEventListener(type, (e) => syncTouches(e as TouchEvent), { passive: true }),
  );
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "touch") return;
      pointerHeld = true;
      window.clearTimeout(snapTimer);
    },
    { passive: true },
  );
  ["pointerup", "pointercancel"].forEach((type) =>
    window.addEventListener(
      type,
      (e) => {
        if ((e as PointerEvent).pointerType === "touch") return;
        pointerHeld = false;
        releaseIfIdle();
      },
      { passive: true },
    ),
  );
  // Safety net against a stuck flag (release happened outside the page / tab was hidden).
  const resetHeld = (): void => {
    pointerHeld = false;
    touchHeld = false;
  };
  window.addEventListener("blur", () => {
    resetHeld();
    armSnap();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) resetHeld();
  });

  const onScroll = (): void => {
    schedule();
    armSnap();
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    resize();
    schedule();
  });

  resize();
  schedule();
}
