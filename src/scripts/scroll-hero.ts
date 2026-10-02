// Controller for ScrollHero.astro. Upgrades the static hero (poster + Act I) to "play" mode on
// capable devices: the clip autoplays on a seamless loop and the three acts, the chapter rail
// and the blurred backdrop all follow its playback position (timings in hero-math.ts).
import {
  ACTS,
  CHAPTERS,
  actOpacity,
  activeChapter,
  canAutoplay,
  liteVideo,
  loopProgress,
  videoTime,
  type ActName,
} from "./hero-math";
import { createFx, type Fx, type FxStyle } from "./hero-fx";

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
const OPACITY_EPSILON = 0.005;
const FOCUS_THRESHOLD = 0.35;
/** The backdrop is drawn at 1/3 of its CSS size: soft enough under a light blur, cheap per frame. */
const BACKDROP_DOWNSCALE = 3;

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
    // Analytics must never break the hero, whatever a third-party script throws.
    console.debug("[scroll-hero] analytics call failed:", err);
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

// A faded-out act must be inert: the acts share one grid cell and would swallow taps.
function setActActive(act: HTMLElement, active: boolean): void {
  setFocusable(act, active);
  act.style.pointerEvents = active ? "" : "none";
}

// Everything in flow above the hero (the trust bar; the header overlays it) counts, so the
// stage fills exactly the rest of the viewport.
function syncHeroTop(root: HTMLElement): void {
  const top = root.getBoundingClientRect().top + window.scrollY;
  root.style.setProperty("--hero-top", `${Math.round(top)}px`);
}

export function initScrollHero(root: HTMLElement): void {
  try {
    wireSkip(root);
    syncHeroTop(root);
    window.addEventListener("resize", () => syncHeroTop(root));

    const hints = navigator as NavigatorWithHints;
    const enabled = canAutoplay({
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
  const video = must<HTMLVideoElement>(root, "[data-hero-video]");
  const toggle = must<HTMLButtonElement>(root, "[data-hero-toggle]");
  const actsBox = must<HTMLElement>(root, ".ctr-hero__acts");
  const fxCanvas = must<HTMLCanvasElement>(root, "[data-hero-fx]");
  const fxStyle: FxStyle = root.dataset.fx === "dust" ? "dust" : "splash";
  let fx: Fx | null = createFx(fxCanvas, fxStyle);
  // Panel layout: a reduced-resolution copy of the frame behind the panel (CSS softens it).
  const backdrop = root.querySelector<HTMLCanvasElement>(
    "[data-hero-backdrop]",
  );
  const backdropCtx = backdrop?.getContext("2d") ?? null;

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

  // ---- Source, chosen by viewport and connection ----
  const portrait = matchMedia(
    "(max-width: 767px) and (orientation: portrait)",
  ).matches;
  const smallLandscape = matchMedia(
    "(max-height: 500px) and (pointer: coarse)",
  ).matches;
  const lite = liteVideo(
    (navigator as NavigatorWithHints).connection?.effectiveType,
  );
  const src = portrait
    ? root.dataset.videoMobile
    : smallLandscape
      ? (root.dataset.videoCompact ?? root.dataset.videoDesktop)
      : lite
        ? root.dataset.videoMobile
        : root.dataset.videoDesktop;
  if (!src) throw new HeroError("missing data-video-* source");

  root.dataset.mode = "play";
  syncHeroTop(root);
  video.muted = true; // the attribute alone does not satisfy every autoplay policy

  // ---- State ----
  let p = -1;
  let raf = 0;
  let lastFrameAt = performance.now();
  let visible = true;
  let userPaused = false;
  let focusInside = false;
  let halted = false;
  let pendingSeek: number | null = null;
  const lastOpacity: Record<ActName, number> = {
    intro: -1,
    ridge: -1,
    ride: -1,
  };

  // ---- Rendering ----
  const drawBackdrop = (): void => {
    if (!backdrop || !backdropCtx || backdrop.width < 2) return;
    const sw = video.videoWidth;
    const sh = video.videoHeight;
    if (!sw || !sh) return;
    // object-fit: cover, in canvas terms.
    const scale = Math.max(backdrop.width / sw, backdrop.height / sh);
    const w = sw * scale;
    const h = sh * scale;
    try {
      backdropCtx.drawImage(
        video,
        (backdrop.width - w) / 2,
        (backdrop.height - h) / 2,
        w,
        h,
      );
    } catch (err) {
      if (!(err instanceof DOMException)) throw err;
    }
  };

  const renderAt = (next: number): void => {
    if (next === p) return;
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
  };

  const render = (): void => {
    renderAt(loopProgress(video.currentTime, video.duration));
    drawBackdrop();
  };

  const resizeBackdrop = (): void => {
    if (!backdrop) return;
    const b = backdrop.getBoundingClientRect();
    backdrop.width = Math.max(1, Math.round(b.width / BACKDROP_DOWNSCALE));
    backdrop.height = Math.max(1, Math.round(b.height / BACKDROP_DOWNSCALE));
    drawBackdrop();
  };

  // A throw anywhere in the loop must not leave a frozen half-upgraded hero.
  const fallBackToStatic = (err: unknown): void => {
    if (halted) return;
    halted = true;
    cancelAnimationFrame(raf);
    video.pause();
    video.removeAttribute("src");
    video.load();
    delete root.dataset.ready;
    delete root.dataset.paused;
    root.dataset.mode = "static";
    ACT_NAMES.forEach((name) => {
      acts[name].style.removeProperty("--o");
      setActActive(acts[name], true);
    });
    syncHeroTop(root);
    console.warn(
      "[scroll-hero] using the static hero:",
      err instanceof Error ? err.message : err,
    );
  };

  // ---- Frame loop: runs only while the clip is meant to be playing ----
  const shouldPlay = (): boolean =>
    !halted && visible && !userPaused && !focusInside && !document.hidden;

  const frame = (now: number): void => {
    raf = 0;
    if (!shouldPlay()) return;
    const dt = Math.max(0.001, (now - lastFrameAt) / 1000);
    lastFrameAt = now;
    try {
      render();
      // The FX layer is decorative: if it ever throws, drop it rather than stop the hero.
      try {
        fx?.update(dt, Math.max(0, p));
      } catch (err) {
        fx = null;
        fxCanvas
          .getContext("2d")
          ?.clearRect(0, 0, fxCanvas.width, fxCanvas.height);
        console.warn(
          "[hero] fx disabled:",
          err instanceof Error ? err.message : err,
        );
      }
    } catch (err) {
      fallBackToStatic(err);
      return;
    }
    raf = requestAnimationFrame(frame);
  };

  const sync = (): void => {
    if (halted) return;
    root.toggleAttribute("data-paused", !shouldPlay());
    if (!shouldPlay()) {
      video.pause();
      return;
    }
    if (!video.getAttribute("src")) {
      video.src = src;
      video.preload = "auto";
    }
    video.play().catch((err: unknown) => {
      // A pause() racing a pending play() rejects with AbortError: expected, harmless.
      if (err instanceof DOMException && err.name === "AbortError") return;
      // Autoplay refused (power saving, policy): keep the poster, offer the play button.
      setUserPaused(true);
    });
    if (!raf) {
      lastFrameAt = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  video.addEventListener("loadedmetadata", () => {
    if (pendingSeek === null) return;
    video.currentTime = videoTime(pendingSeek, video.duration);
    pendingSeek = null;
  });
  video.addEventListener("playing", () => {
    if (!root.dataset.ready) root.dataset.ready = "true";
  });
  // Paused seeks (rail clicks, deep links) still have to update the copy and the backdrop.
  video.addEventListener("seeked", render);
  video.addEventListener("error", () =>
    fallBackToStatic(
      new HeroError(`video failed to load (${video.error?.code ?? "?"})`),
    ),
  );

  // ---- Pause / play control ----
  const setUserPaused = (paused: boolean): void => {
    userPaused = paused;
    toggle.setAttribute("aria-pressed", String(paused));
    const label = paused ? toggle.dataset.labelPlay : toggle.dataset.labelPause;
    if (label) toggle.setAttribute("aria-label", label);
    sync();
  };
  toggle.addEventListener("click", () => {
    setUserPaused(!userPaused);
    track("hero_video_toggle", { state: userPaused ? "paused" : "playing" });
  });

  // Rotating copy must hold still while a keyboard user is inside it (WCAG 2.2.2).
  actsBox.addEventListener("focusin", () => {
    focusInside = true;
    sync();
  });
  actsBox.addEventListener("focusout", (e) => {
    if (e.relatedTarget instanceof Node && actsBox.contains(e.relatedTarget))
      return;
    focusInside = false;
    sync();
  });

  // ---- Chapters: rail clicks and deep links jump the loop ----
  const jumpTo = (target: number): void => {
    renderAt(target);
    if (
      video.readyState >= HTMLMediaElement.HAVE_METADATA &&
      video.duration > 0
    )
      video.currentTime = videoTime(target, video.duration);
    else pendingSeek = target;
  };
  CHAPTERS.forEach((c) => {
    railLinks.get(c.id)?.addEventListener("click", (event) => {
      event.preventDefault();
      history.replaceState(null, "", `#${c.id}`);
      jumpTo(c.p);
      track("hero_chapter_click", { chapter: c.id });
    });
  });

  // ---- Visibility: play only while on screen and in a visible tab ----
  new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? true;
      sync();
    },
    { threshold: 0.1 },
  ).observe(root);
  document.addEventListener("visibilitychange", sync);

  window.addEventListener("resize", () => {
    resizeBackdrop();
    fx?.resize();
  });

  // ---- Start ----
  const hashChapter = CHAPTERS.find((c) => `#${c.id}` === location.hash);
  jumpTo(hashChapter?.p ?? 0);
  resizeBackdrop();
  // The fx canvas is display:none until data-mode="play" is set, so size it only now.
  fx?.resize();
  sync();
}
