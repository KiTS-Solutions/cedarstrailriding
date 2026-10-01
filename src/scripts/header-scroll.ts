// Scroll states for the sticky site header (src/components/Header.astro). Attributes only — all
// visuals live in the component's CSS:
//   data-scrolled  header is stuck (the top strip has scrolled away): shadow, compact on desktop
//   data-hidden    phones/tablets, scrolling down: slides away, returns on any scroll up
//   data-state     overlay pages only: "top" while the hero is behind the header, else "solid"

const HIDE_DELTA = 6; // px of travel before a direction change counts (ignores jitter)

export function initHeaderScroll(header: HTMLElement): void {
  try {
    const topbar = document.querySelector<HTMLElement>("[data-topbar]");
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let lastY = window.scrollY;
    let queued = false;

    // offsetHeight is 0 while the strip is display:none (the utility strip below lg).
    const stuckAt = (): number => topbar?.offsetHeight ?? 0;

    const canHide = (): boolean =>
      !desktop.matches &&
      !reducedMotion.matches &&
      !header.contains(document.activeElement) &&
      !document.querySelector("dialog[open]");

    const update = (): void => {
      queued = false;
      const y = Math.max(0, window.scrollY);
      header.toggleAttribute("data-scrolled", y > stuckAt() + 4);

      if (!canHide() || y <= stuckAt() + header.offsetHeight) {
        header.removeAttribute("data-hidden");
        lastY = y;
        return;
      }
      if (y > lastY + HIDE_DELTA) {
        header.setAttribute("data-hidden", "");
        lastY = y;
      } else if (y < lastY - HIDE_DELTA) {
        header.removeAttribute("data-hidden");
        lastY = y;
      }
    };

    window.addEventListener(
      "scroll",
      () => {
        if (queued) return;
        queued = true;
        requestAnimationFrame(update);
      },
      { passive: true },
    );
    // Tabbing into a hidden header brings it back.
    header.addEventListener("focusin", () =>
      header.removeAttribute("data-hidden"),
    );
    desktop.addEventListener("change", update);
    update();

    if (header.hasAttribute("data-overlay")) watchHero(header, desktop);
  } catch (error: unknown) {
    // Progressive enhancement: without these states the header is still a plain sticky bar.
    header.removeAttribute("data-state");
    console.error("[header] scroll states disabled", error);
  }
}

// Transparent while any of the hero is visible below the header's bottom edge.
function watchHero(header: HTMLElement, desktop: MediaQueryList): void {
  const hero = document.querySelector<HTMLElement>("[data-hero]");
  if (!hero || !("IntersectionObserver" in window)) {
    header.dataset.state = "solid";
    return;
  }

  let observer: IntersectionObserver | undefined;
  const observe = (): void => {
    observer?.disconnect();
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry)
          header.dataset.state = entry.isIntersecting ? "top" : "solid";
      },
      { rootMargin: `-${header.offsetHeight}px 0px 0px 0px` },
    );
    observer.observe(hero);
  };
  observe();
  // The header's height only changes at the desktop breakpoint (--site-header-h).
  desktop.addEventListener("change", observe);
}
