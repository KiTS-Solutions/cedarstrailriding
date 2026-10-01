// Controller for src/components/WelcomeLoader.astro. The overlay is already on screen (CSS,
// keyed off html[data-welcome="on"] set in <head>); this decides when it leaves.
//
// - It always plays for at least MIN_MS (from navigation start). Until then scrolling is held
//   (wheel / touch / scroll keys are swallowed, so the hero underneath does not scrub away
//   unseen); only Skip or Escape end it early.
// - After MIN_MS it leaves as soon as the hero has a real frame to reveal, or when the
//   visitor scrolls / taps / presses a key, and at MAX_MS regardless.
// - The exit is staged in CSS ([data-state="out"]); the node is removed after EXIT_MS.

const MIN_MS = 3000;
const MAX_MS = 4500;
const EXIT_MS = 1250; // matches the CSS exit: 0.2 s delay + 1 s dissolve
const CLIP_GRACE_MS = 900;

/** Keys that only move focus must never count as "I want in" — Tab reaches the Skip button. */
const PASSIVE_KEYS = new Set(["Tab", "Shift", "Alt", "Control", "Meta"]);
/** Keys the browser would scroll the page with; held back while the loader is up. */
const SCROLL_KEYS = new Set([
  " ",
  "PageDown",
  "PageUp",
  "ArrowDown",
  "ArrowUp",
  "Home",
  "End",
]);

export function initWelcomeLoader(el: HTMLElement): void {
  const html = document.documentElement;
  if (html.dataset.welcome !== "on") {
    el.remove();
    return;
  }

  let done = false;
  let heroReady = false;
  const timers: number[] = [];
  const video = el.querySelector<HTMLVideoElement>("[data-loader-video]");
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  // Set by the MIN_MS timer itself. Re-reading performance.now() in its callback is not safe:
  // timers can fire a hair before the clock reads MIN_MS, which skipped the exit until MAX_MS.
  let minReached = false;
  const minElapsed = (): boolean => minReached;

  // Scroll intent: held back before the minimum, an exit cue after it.
  const onScrollIntent = (e: Event): void => {
    if (e.cancelable) e.preventDefault();
    if (minElapsed()) dismiss();
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === "Escape") return dismiss();
    if (PASSIVE_KEYS.has(e.key)) return;
    // Let keys reach a focused control (Enter/Space on Skip).
    const onControl =
      e.target instanceof Element && e.target.closest("button, a");
    if (SCROLL_KEYS.has(e.key) && !onControl) e.preventDefault();
    if (minElapsed()) dismiss();
  };
  const onPointer = (): void => {
    if (minElapsed()) dismiss();
  };
  const scrollEvents = ["wheel", "touchmove"] as const;

  function dismiss(): void {
    if (done) return;
    done = true;
    timers.forEach((id) => window.clearTimeout(id));
    scrollEvents.forEach((type) =>
      window.removeEventListener(type, onScrollIntent),
    );
    window.removeEventListener("keydown", onKey);
    el.dataset.state = "out";
    window.setTimeout(() => {
      try {
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load(); // releases the decoder and any in-flight download
        }
      } catch (err) {
        console.debug("[welcome-loader] video teardown failed:", err);
      }
      el.remove();
      html.dataset.welcome = "done";
    }, EXIT_MS);
  }

  // Start the loop only after the hero poster (LCP) has arrived, or after a short grace period.
  const startClip = (): void => {
    if (done || !video || video.getAttribute("src") || !video.dataset.src)
      return;
    video.addEventListener("playing", () => (video.dataset.playing = "true"), {
      once: true,
    });
    video.src = video.dataset.src;
    video.play().catch(() => undefined); // autoplay refused: the poster stays, which is fine
  };

  const maybeDismiss = (): void => {
    if (heroReady && minElapsed()) dismiss();
  };
  const markReady = (): void => {
    heroReady = true;
    maybeDismiss();
  };

  try {
    if (!hero || hero.dataset.ready) heroReady = true;
    else hero.addEventListener("ctr:hero-ready", markReady, { once: true });
    // A hero that stays static (reduced capability) never fires ctr:hero-ready; its poster
    // is all there is to wait for.
    window.addEventListener(
      "load",
      () => {
        if (!hero || hero.dataset.mode !== "scrub") markReady();
      },
      { once: true },
    );

    const lcpImage =
      document.querySelector<HTMLImageElement>(".ctr-hero__poster");
    if (!lcpImage || lcpImage.complete) startClip();
    else {
      lcpImage.addEventListener("load", startClip, { once: true });
      lcpImage.addEventListener("error", startClip, { once: true });
      timers.push(window.setTimeout(startClip, CLIP_GRACE_MS));
    }

    const now = performance.now();
    timers.push(
      window.setTimeout(() => {
        minReached = true;
        maybeDismiss();
      }, Math.max(0, MIN_MS - now)),
    );
    timers.push(window.setTimeout(dismiss, Math.max(0, MAX_MS - now)));

    el.querySelector("[data-loader-skip]")?.addEventListener("click", dismiss);
    el.addEventListener("pointerdown", onPointer);
    // Non-passive on purpose: these must be able to cancel the scroll while the loader is up.
    scrollEvents.forEach((type) =>
      window.addEventListener(type, onScrollIntent, { passive: false }),
    );
    window.addEventListener("keydown", onKey);
    maybeDismiss();
  } catch (err) {
    // Never let the welcome screen trap the page.
    console.warn("[welcome-loader]", err instanceof Error ? err.message : err);
    dismiss();
  }
}
