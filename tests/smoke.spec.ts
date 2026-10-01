import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

test.describe("Home page", () => {
  test("renders the hero and primary nav", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Cedars Trail Riding/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Explore Lebanon on Horseback",
    );
    await expect(
      page.getByRole("link", { name: "Book Today" }).first(),
    ).toBeVisible();
  });

  test("primary nav links resolve to real pages", async ({ page, request }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Primary" });
    const hrefs = await nav
      .locator("a")
      .evaluateAll((links) => links.map((el) => el.getAttribute("href")));

    for (const href of hrefs) {
      if (!href) continue;
      const response = await request.get(href);
      expect(response.status(), `expected ${href} to resolve`).toBeLessThan(
        400,
      );
    }
  });

  test("never renders the Tennessee 'Cedars of Lebanon' collision", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("body")).not.toContainText(/tennessee/i);
  });

  test("never shows a price anywhere on the page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).not.toContainText(/\$\d/);
  });
});

test.describe("Arabic locale", () => {
  test("serves RTL layout with Arabic nav labels", async ({ page }) => {
    await page.goto("/ar/");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(
      page.getByRole("link", { name: "المسارات" }).first(),
    ).toBeVisible();
  });
});

test.describe("French locale", () => {
  test("serves LTR layout with French nav labels", async ({ page }) => {
    await page.goto("/fr/");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(
      page.getByRole("link", { name: "Sentiers" }).first(),
    ).toBeVisible();
  });
});

test.describe("Language switcher", () => {
  test("preserves the current route when switching locale", async ({
    page,
  }) => {
    await page.goto("/trails/");
    await page
      .getByRole("group", { name: "Language" })
      .getByRole("link", { name: "ع" })
      .click();
    await expect(page).toHaveURL(/\/ar\/trails\/?$/);
  });
});

test.describe("Booking form", () => {
  test("renders required fields and the spam honeypot", async ({ page }) => {
    await page.goto("/contact/");
    const form = page.locator("#booking-form");
    await expect(form.locator('input[name="name"]')).toHaveAttribute(
      "required",
      "",
    );
    await expect(form.locator('input[name="phone"]')).toHaveAttribute(
      "required",
      "",
    );
    await expect(form.locator('select[name="interest"]')).toHaveAttribute(
      "required",
      "",
    );
    await expect(form.locator('input[name="botcheck"]')).toBeHidden();
    await expect(form.locator('button[type="submit"]')).toBeVisible();
  });

  test("shows no price anywhere near booking", async ({ page }) => {
    await page.goto("/contact/");
    await expect(page.locator("body")).not.toContainText(/\$\d/);
  });
});

test.describe("Scroll hero", () => {
  // The welcome screen has its own suite; keep it out of the way of hero interactions.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("ctr-welcome", "1"));
  });

  test("Act I H1 is visible at load and the skip link targets #trails", async ({
    page,
  }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
    await expect(h1).toHaveCSS("opacity", "1");
    await expect(page.locator('[data-act="intro"]')).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-hero-skip]")).toHaveAttribute(
      "href",
      "#trails",
    );
    await expect(page.locator("h1")).toHaveCount(1);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("stays in static mode and never requests the video", async ({
      page,
    }) => {
      const media: string[] = [];
      page.on("request", (r) => {
        if (/\.mp4(\?|$)/.test(r.url())) media.push(r.url());
      });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(page.locator("[data-hero]")).toHaveAttribute(
        "data-mode",
        "static",
      );
      expect(media).toEqual([]);
      await expect(
        page.locator('[data-hero] [data-hero-cta="book"]'),
      ).toBeVisible();
    });
  });

  test("upgrades to scrub mode on capable desktop and requests the desktop video", async ({
    page,
  }) => {
    const media: string[] = [];
    page.on("request", (r) => {
      if (/\.mp4(\?|$)/.test(r.url())) media.push(r.url());
    });
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    await expect
      .poll(() => media.some((u) => u.includes("ride-hd.mp4")))
      .toBe(true);
    expect(media.some((u) => u.includes("ride-mobile.mp4"))).toBe(false);
  });

  test("scrolling reveals the ridge act and advances the rail", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>("[data-hero]")!;
      const stage = el.querySelector<HTMLElement>("[data-hero-stage]")!;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const sticky = parseFloat(getComputedStyle(stage).top);
      window.scrollTo({
        top: top - sticky + 0.5 * (el.offsetHeight - stage.offsetHeight),
        behavior: "instant",
      });
    });
    await expect(page.locator('[data-act="ridge"]')).toHaveCSS("opacity", "1");
    await expect(page.locator('[data-act="intro"]')).toHaveCSS("opacity", "0");
    await expect(page.locator('a[data-chapter="ridge"]')).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  for (const vp of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "phone", width: 375, height: 812 },
  ]) {
    test(`static to scrub upgrade causes no layout shift (${vp.name})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.addInitScript(() => {
        const w = window as unknown as { __cls: number };
        w.__cls = 0;
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            const ls = e as PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
            };
            if (!ls.hadRecentInput) w.__cls += ls.value;
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      await page.goto("/");
      await expect(page.locator("[data-hero]")).toHaveAttribute(
        "data-mode",
        "scrub",
      );
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(500);
      const cls = await page.evaluate(
        () => (window as unknown as { __cls: number }).__cls,
      );
      expect(cls).toBeLessThan(0.02);
    });
  }

  test("#ridge deep link opens at the ridge chapter", async ({ page }) => {
    await page.goto("/#ridge");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    await expect(page.locator('[data-act="ridge"]')).toHaveCSS("opacity", "1");
  });

  test("skip link moves to the trails section", async ({ page }) => {
    await page.goto("/");
    await page.locator("[data-hero-skip]").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#trails")).toBeInViewport();
  });

  test("Arabic: rail sits on the right (inline-start in RTL)", async ({
    page,
  }) => {
    await page.goto("/ar/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    const box = await page.locator(".ctr-hero__rail").boundingBox();
    const vw = page.viewportSize()!.width;
    expect(box!.x).toBeGreaterThan(vw / 2);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
      "Explore Lebanon on Horseback",
    );
  });

  const scrollToProgress = (page: Page, p: number) =>
    page.evaluate((target) => {
      const el = document.querySelector<HTMLElement>("[data-hero]")!;
      const stage = el.querySelector<HTMLElement>("[data-hero-stage]")!;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const sticky = parseFloat(getComputedStyle(stage).top);
      window.scrollTo({
        top: top - sticky + target * (el.offsetHeight - stage.offsetHeight),
        behavior: "instant",
      });
    }, p);

  for (const [label, viewport, path, contact] of [
    ["desktop", { width: 1440, height: 900 }, "/", "/contact/"],
    ["phone", { width: 375, height: 812 }, "/", "/contact/"],
    ["phone Arabic", { width: 375, height: 812 }, "/ar/", "/ar/contact/"],
  ] as const) {
    test(`p=0 Book CTA is really clickable (${label})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await expect(page.locator("[data-hero]")).toHaveAttribute(
        "data-mode",
        "scrub",
      );
      await page.locator('[data-hero] [data-hero-cta="book"]').click();
      await expect(page).toHaveURL(new RegExp(`${contact}$`));
    });
  }

  test("at p=0.5 the ridge act, not the intro, receives pointer events", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    await scrollToProgress(page, 0.5);
    await expect(page.locator('[data-act="ridge"]')).toHaveCSS("opacity", "1");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const r = document
            .querySelector('[data-act="ridge"]')!
            .getBoundingClientRect();
          const hit = document.elementFromPoint(
            r.left + r.width / 2,
            r.top + r.height / 2,
          );
          return hit?.closest("[data-act]")?.getAttribute("data-act") ?? null;
        }),
      )
      .toBe("ridge");
  });

  test("dock links are out of the tab order until the dock appears", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    const tabindexes = () =>
      page
        .locator("[data-hero-dock] a")
        .evaluateAll((els) => els.map((e) => e.getAttribute("tabindex")));
    expect(await tabindexes()).toEqual(["-1", "-1"]);
    await scrollToProgress(page, 0.5);
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-dock",
      "on",
    );
    expect(await tabindexes()).toEqual([null, null]);
  });

  test("deep link resyncs the video to the ridge frame once it is ready", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __seeks: number[] };
      w.__seeks = [];
      const desc = Object.getOwnPropertyDescriptor(
        HTMLMediaElement.prototype,
        "currentTime",
      )!;
      Object.defineProperty(HTMLMediaElement.prototype, "currentTime", {
        get() {
          return desc.get!.call(this);
        },
        set(v: number) {
          w.__seeks.push(v);
          desc.set!.call(this, v);
        },
      });
    });
    await page.goto("/#ridge");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-ready",
      "true",
    );
    // duration is read from the same element the controller seeks
    await expect
      .poll(() =>
        page.evaluate(() => {
          const seeks = (window as unknown as { __seeks: number[] }).__seeks;
          return seeks.length ? seeks[seeks.length - 1] : null;
        }),
      )
      .not.toBeNull();
    const last = await page.evaluate(() => {
      const seeks = (window as unknown as { __seeks: number[] }).__seeks;
      return seeks[seeks.length - 1]!;
    });
    // ridge chapter is p=0.5; the v2 clip is 13 s, so the target is ~6.5 s, never frame 0
    expect(last).toBeGreaterThan(5.5);
    expect(last).toBeLessThan(7.5);
  });

  test("dust motes drift over the hero, and keep drifting through a fast scrub, without errors", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-fx",
      "dust",
    );

    // Non-transparent pixels on the FX canvas.
    const painted = (): Promise<number> =>
      page.evaluate(() => {
        const c = document.querySelector<HTMLCanvasElement>("[data-hero-fx]")!;
        const data = c
          .getContext("2d")!
          .getImageData(0, 0, c.width, c.height).data;
        let n = 0;
        for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) n++;
        return n;
      });

    // The canvas must be sized to the stage, not left at the 1x1 it has while display:none.
    expect(
      await page.evaluate(
        () =>
          document.querySelector<HTMLCanvasElement>("[data-hero-fx]")!.width,
      ),
    ).toBeGreaterThan(300);

    // At rest: a faint constant drift (rate/spawn logic is unit-tested in hero-math).
    await expect
      .poll(painted, { timeout: 8000, intervals: [250] })
      .toBeGreaterThan(0);

    for (const target of [0.4, 0.5, 0.6, 0.7, 0.6, 0.5, 0.4]) {
      await scrollToProgress(page, target);
      await page.waitForTimeout(40);
    }
    expect(await painted()).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test("snap does not fire while a pointer is held down, and may after release", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    // Let the video/layout settle so 0.47 stays near the ridge chapter.
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await page.mouse.move(700, 450);
    await page.mouse.down();
    await scrollToProgress(page, 0.47);
    const held = await page.evaluate(() => window.scrollY);
    // Negative check: the idle timer is 160ms, so a wrongly-fired snap would have moved us well
    // within this window. The window is also long enough for the velocity estimate (which decays
    // per rendered frame, and frames are slow in headless Chromium) to settle, so that the
    // post-release snap below is not rejected as "still moving".
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.scrollY)).toBe(held);
    await page.mouse.up();
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(held);
  });

  test("a blur during a held mouse press releases the snap guard", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-ready",
      "true",
    );
    await page.mouse.move(700, 450);
    await page.mouse.down();
    await scrollToProgress(page, 0.47);
    const held = await page.evaluate(() => window.scrollY);
    // Bounded negative wait (see the pointer-held test): lets the velocity estimate settle too.
    await page.waitForTimeout(1500);
    expect(await page.evaluate(() => window.scrollY)).toBe(held);
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(held);
  });

  test.describe("touch", () => {
    test.use({ hasTouch: true });

    for (const withPointerCancel of [false, true]) {
      test(`snap does not fire under a held finger${withPointerCancel ? " even after a touch pointercancel" : ""}`, async ({
        page,
      }) => {
        await page.goto("/");
        await expect(page.locator("[data-hero]")).toHaveAttribute(
          "data-ready",
          "true",
        );
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchStart",
          touchPoints: [{ x: 700, y: 450 }],
        });
        await scrollToProgress(page, 0.47);
        const held = await page.evaluate(() => window.scrollY);
        // Bounded waits: the frame-based velocity estimate must settle first (slow headless frames),
        // otherwise a snap would be rejected as "still moving" and the test could not fail.
        await page.waitForTimeout(1200);
        if (withPointerCancel) {
          // What a browser does when it takes the drag over as a native pan.
          await page.evaluate(() =>
            window.dispatchEvent(
              new PointerEvent("pointercancel", { pointerType: "touch" }),
            ),
          );
        }
        // Negative check: a wrongly-fired snap (160 ms idle timer) would show well inside this window.
        await page.waitForTimeout(600);
        expect(await page.evaluate(() => window.scrollY)).toBe(held);
        await cdp.send("Input.dispatchTouchEvent", {
          type: "touchEnd",
          touchPoints: [],
        });
        await expect
          .poll(() => page.evaluate(() => window.scrollY))
          .not.toBe(held);
      });
    }
  });

  test.describe("canvas paint", () => {
    // Samples a grid of the main canvas: counts non-transparent pixels and
    // pixels brighter than near-black.
    const sampleCanvas = (page: Page) =>
      page.evaluate(() => {
        const c =
          document.querySelector<HTMLCanvasElement>("[data-hero-canvas]")!;
        const ctx = c.getContext("2d")!;
        let opaque = 0;
        let bright = 0;
        for (let i = 1; i <= 8; i++) {
          for (let j = 1; j <= 8; j++) {
            const x = Math.floor((c.width * i) / 9);
            const y = Math.floor((c.height * j) / 9);
            const d = ctx.getImageData(x, y, 1, 1).data;
            const r = d[0] ?? 0;
            const g = d[1] ?? 0;
            const b = d[2] ?? 0;
            const a = d[3] ?? 0;
            if (a > 0) opaque++;
            if (a > 0 && 0.2126 * r + 0.7152 * g + 0.0722 * b > 20) bright++;
          }
        }
        return { opaque, bright };
      });

    for (const url of ["/", "/#ridge"]) {
      test(`canvas holds a real frame once ready (${url})`, async ({
        page,
      }) => {
        await page.goto(url);
        const root = page.locator("[data-hero]");
        await expect(root).toHaveAttribute("data-mode", "scrub");
        await expect(root).toHaveAttribute("data-ready", "true");
        const { opaque, bright } = await sampleCanvas(page);
        expect(opaque).toBeGreaterThan(0);
        expect(bright).toBeGreaterThan(0);
      });
    }

    test("canvas stays transparent, and the poster visible, while not ready", async ({
      page,
    }) => {
      // Block the video so the hero can never become ready.
      await page.route(/\.mp4(\?|$)/, (route) => route.abort());
      await page.goto("/");
      const root = page.locator("[data-hero]");
      await expect(root).toHaveAttribute("data-mode", "scrub");
      await page.waitForTimeout(800);
      await expect(root).not.toHaveAttribute("data-ready", /.*/);
      await expect(page.locator("[data-hero-canvas]")).toHaveCSS(
        "opacity",
        "0",
      );
      await expect(page.locator(".ctr-hero__poster")).toBeVisible();
      // The hero keeps scrubbing copy without a video.
      await scrollToProgress(page, 0.5);
      await expect(page.locator('[data-act="ridge"]')).toHaveCSS(
        "opacity",
        "1",
      );
    });
  });

  test.describe("analytics", () => {
    type Call = unknown[];
    const stubGtag = (page: Page) =>
      page.addInitScript(() => {
        const w = window as unknown as {
          __calls: unknown[][];
          gtag: (...a: unknown[]) => void;
        };
        w.__calls = [];
        w.gtag = (...a: unknown[]) => {
          w.__calls.push(a);
        };
      });
    const calls = (page: Page) =>
      page.evaluate(() => (window as unknown as { __calls: Call[] }).__calls);
    const named = (all: Call[], name: string) =>
      all.filter((c) => c[0] === "event" && c[1] === name);

    test("no chapter is reported at load; ridge is reported once after scrolling", async ({
      page,
    }) => {
      await stubGtag(page);
      await page.goto("/");
      await expect(page.locator("[data-hero]")).toHaveAttribute(
        "data-mode",
        "scrub",
      );
      await page.waitForTimeout(700);
      expect(named(await calls(page), "hero_chapter_reached")).toEqual([]);
      await scrollToProgress(page, 0.5);
      await expect
        .poll(async () => named(await calls(page), "hero_chapter_reached"))
        .toEqual([["event", "hero_chapter_reached", { chapter: "ridge" }]]);
      await page.waitForTimeout(300);
      expect(named(await calls(page), "hero_chapter_reached")).toHaveLength(1);
    });

    test("dock WhatsApp click is tracked as dock-whatsapp", async ({
      page,
    }) => {
      await stubGtag(page);
      await page.context().route(/wa\.me/, (route) => route.abort());
      await page.goto("/");
      await expect(page.locator("[data-hero]")).toHaveAttribute(
        "data-mode",
        "scrub",
      );
      await scrollToProgress(page, 0.5);
      await expect(page.locator("[data-hero]")).toHaveAttribute(
        "data-dock",
        "on",
      );
      await page.locator('[data-hero-cta="dock-whatsapp"]').click();
      await expect
        .poll(async () => named(await calls(page), "hero_cta_click"))
        .toEqual([["event", "hero_cta_click", { cta: "dock-whatsapp" }]]);
    });
  });

  test.describe("static hero fills the fold", () => {
    test.use({ reducedMotion: "reduce" });
    for (const vp of [
      { width: 375, height: 812 },
      { width: 1440, height: 900 },
    ]) {
      test(`static hero bottom sits at the viewport bottom (${vp.width}x${vp.height})`, async ({
        page,
      }) => {
        await page.setViewportSize(vp);
        await page.goto("/");
        await expect(page.locator("[data-hero]")).toHaveAttribute(
          "data-mode",
          "static",
        );
        await page.waitForLoadState("networkidle");
        const bottom = await page.evaluate(
          () =>
            document.querySelector("[data-hero-stage]")!.getBoundingClientRect()
              .bottom,
        );
        // +8: at 375px the copy itself is ~5px taller than the min-height, so content wins.
        expect(bottom).toBeLessThanOrEqual(vp.height + 8);
        expect(bottom).toBeGreaterThanOrEqual(vp.height - 8);
      });
    }
  });

  test("a single wheel tick into the ridge snap radius settles on the ridge chapter", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-ready",
      "true",
    );
    // p=0.43 is just outside the ridge radius (0.06); one ~100px tick lands inside it.
    await scrollToProgress(page, 0.43);
    await page.waitForTimeout(600);
    const before = await page.evaluate(() => window.scrollY);
    const ridgeY = await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>("[data-hero]")!;
      const stage = el.querySelector<HTMLElement>("[data-hero-stage]")!;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const sticky = parseFloat(getComputedStyle(stage).top);
      return top - sticky + 0.5 * (el.offsetHeight - stage.offsetHeight);
    });
    await page.mouse.move(700, 450);
    await page.mouse.wheel(0, 100);
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 8000 })
      .toBeGreaterThan(before);
    await expect
      .poll(
        async () =>
          Math.abs((await page.evaluate(() => window.scrollY)) - ridgeY),
        {
          timeout: 8000,
        },
      )
      .toBeLessThanOrEqual(2);
  });

  test("a throwing analytics hook never freezes or errors the hero", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.addInitScript(() => {
      (window as unknown as { gtag: () => void }).gtag = () => {
        throw "analytics exploded"; // a non-Error throw
      };
    });
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    await scrollToProgress(page, 0.5);
    await expect(page.locator('[data-act="ridge"]')).toHaveCSS("opacity", "1");
    await expect(page.locator('[data-act="intro"]')).toHaveCSS("opacity", "0");
    await scrollToProgress(page, 0.9);
    await expect(page.locator('[data-act="ride"]')).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    expect(errors).toEqual([]);
  });

  test("French: scrub hero, LTR, FR headline, rail on the left", async ({
    page,
  }) => {
    const fr = JSON.parse(
      readFileSync(
        fileURLToPath(new URL("../src/i18n/locales/fr.json", import.meta.url)),
        "utf8",
      ),
    ) as Record<string, string>;
    await page.goto("/fr/");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      fr["brand.hero"]!,
    );
    const box = await page.locator(".ctr-hero__rail").boundingBox();
    const vw = page.viewportSize()!.width;
    expect(box!.x).toBeLessThan(vw / 2);
  });
});

test.describe("Mobile layout", () => {
  test.use({ viewport: { width: 375, height: 812 }, hasTouch: true });

  // Regression: an unpinned sr-only skip link and an unshrinkable form grid both widened the
  // page in RTL / at 320px, producing sideways scroll.
  for (const route of [
    "/",
    "/ar/",
    "/contact/",
    "/ar/contact/",
    "/fr/contact/",
  ]) {
    test(`no horizontal overflow at 320px (${route})`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 740 });
      await page.goto(route);
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(scrollWidth).toBe(clientWidth);
    });
  }

  test("menu drawer opens, lists the nav, and closes on Escape", async ({
    page,
  }) => {
    await page.goto("/trails/");
    const toggle = page.getByRole("button", { name: "Menu", exact: true });
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await toggle.click();
    const drawer = page.getByRole("dialog", { name: "Menu" });
    await expect(drawer).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(drawer.getByRole("link", { name: "Gallery" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("Arabic drawer slides in from the left edge (inline-end in RTL)", async ({
    page,
  }) => {
    await page.goto("/ar/trails/");
    await page.getByRole("button", { name: "القائمة" }).click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await expect.poll(async () => (await drawer.boundingBox())!.x).toBe(0);
  });

  test("drawer nav targets are at least 44px tall", async ({ page }) => {
    await page.goto("/trails/");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    for (const link of await page.getByRole("dialog").getByRole("link").all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("sticky Book/WhatsApp bar shows on content pages and yields to the booking form", async ({
    page,
  }) => {
    await page.goto("/trails/");
    const bar = page.locator("#sticky-cta");
    await expect(bar).toBeVisible();
    await expect(bar).not.toHaveAttribute("data-hidden", "true");
    await page.goto("/contact/");
    await expect(bar).toHaveAttribute("data-hidden", "true");
  });

  test("shows one compact horse placeholder on phones, not three", async ({
    page,
  }) => {
    await page.goto("/horses/");
    const placeholders = page.getByText("Coming soon", { exact: false });
    await expect(placeholders).toHaveCount(3);
    const visible = await placeholders.evaluateAll(
      (els) =>
        els.filter((el) => (el as HTMLElement).offsetParent !== null).length,
    );
    expect(visible).toBe(1);
  });

  test("form controls are 48px tall and paired fields sit side by side", async ({
    page,
  }) => {
    await page.goto("/contact/");
    const date = await page.locator('input[name="date"]').boundingBox();
    const riders = await page.locator('input[name="riders"]').boundingBox();
    expect(date!.height).toBeGreaterThanOrEqual(48);
    expect(Math.abs(date!.y - riders!.y)).toBeLessThan(2);
  });
});

test.describe("Mobile UX", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  // The bar deliberately yields to the hero (which has its own dock) and to the booking form,
  // so it is asserted on content pages rather than on "/" or "/contact/".
  for (const path of ["/trails/", "/ar/trails/", "/fr/trails/"]) {
    test(`sticky WhatsApp/Call bar and 44px targets (${path})`, async ({ page }) => {
      await page.goto(path);
      const bar = page.locator("[data-sticky-contact]");
      await expect(bar).toBeVisible();
      await expect(bar.locator('a[href^="https://wa.me/"]')).toBeVisible();
      await expect(bar.locator('a[href^="tel:"]')).toBeVisible();
      const heights = await bar
        .locator("a")
        .evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
      for (const h of heights) expect(h).toBeGreaterThanOrEqual(44);
    });
  }

  test("language switcher targets in the drawer are 44px", async ({ page }) => {
    await page.goto("/trails/");
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    const links = page.getByRole("dialog").getByRole("group", { name: "Language" }).getByRole("link");
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("booking form has mobile input hints", async ({ page }) => {
    await page.goto("/contact/");
    await expect(page.locator('input[name="phone"]')).toHaveAttribute("inputmode", "tel");
    await expect(page.locator('input[name="phone"]')).toHaveAttribute("autocomplete", "tel");
    await expect(page.locator('input[name="email"]')).toHaveAttribute("autocomplete", "email");
  });

  test("bar is hidden on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/trails/");
    await expect(page.locator("[data-sticky-contact]")).toBeHidden();
  });
});

test.describe("Welcome loader", () => {
  const loader = (page: Page) => page.locator("[data-loader]");

  const sinceNavigation = (page: Page) => page.evaluate(() => performance.now());

  test("plays for its minimum time, then leaves on its own within the cap", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-welcome", "on");
    await expect(loader(page)).toBeVisible();
    await expect(loader(page).getByRole("button")).toHaveText("Skip");
    // Still fully up just before the 3 s minimum, even though the hero is ready by then.
    await page.waitForTimeout(Math.max(0, 2700 - (await sinceNavigation(page))));
    await expect(loader(page)).not.toHaveAttribute("data-state", "out");
    // 4.5 s cap + 1.25 s staged exit, measured from navigation start.
    await expect(loader(page)).toHaveCount(0, { timeout: 7000 });
    await expect(page.locator("html")).toHaveAttribute("data-welcome", "done");
  });

  test("holds the page still before the minimum, then a scroll lets the visitor in", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(loader(page)).toBeVisible();
    await page.mouse.move(600, 400);
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(loader(page)).not.toHaveAttribute("data-state", "out");
    // Past the minimum the same gesture dismisses it.
    await page.waitForTimeout(Math.max(0, 3100 - (await sinceNavigation(page))));
    await page.mouse.wheel(0, 100);
    await expect(loader(page)).toHaveCount(0, { timeout: 2500 });
  });

  test("Skip dismisses it at any time", async ({ page }) => {
    await page.goto("/");
    await loader(page).getByRole("button").click();
    await expect(loader(page)).toHaveAttribute("data-state", "out");
    await expect(loader(page)).toHaveCount(0, { timeout: 2000 });
  });

  test("is shown once per session", async ({ page }) => {
    await page.goto("/");
    await expect(loader(page)).toHaveCount(0, { timeout: 7000 });
    await page.goto("/fr/");
    await expect(page.locator("html")).not.toHaveAttribute("data-welcome", /.*/);
    await expect(loader(page)).toHaveCount(0);
  });

  test("never appears on deep links or inner pages", async ({ page }) => {
    await page.goto("/#trails");
    await expect(loader(page)).toHaveCount(0);
    await page.goto("/trails/");
    await expect(loader(page)).toHaveCount(0);
  });

  test("fades out by CSS alone if its script never runs", async ({ page }) => {
    await page.route(/\.js(\?|$)/, (route) => route.abort());
    await page.goto("/");
    await expect(loader(page)).toBeVisible();
    await expect(loader(page)).toBeHidden({ timeout: 8000 });
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("is skipped and never fetches its clip", async ({ page }) => {
      const media: string[] = [];
      page.on("request", (r) => {
        if (/\.mp4(\?|$)/.test(r.url())) media.push(r.url());
      });
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(loader(page)).toHaveCount(0);
      expect(media).toEqual([]);
    });
  });
});

test.describe("Ambient clips", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("ctr-welcome", "1"));
  });

  test("are decorative, fetch nothing until near, then play while visible", async ({
    page,
  }) => {
    await page.goto("/");
    const clips = page.locator("[data-ambient-video]");
    // Treks + groups panels, plus the About band's standalone blurred backdrop.
    await expect(clips).toHaveCount(3);
    for (const clip of await clips.all()) {
      await expect(clip).toHaveAttribute("preload", "none");
      await expect(clip).not.toHaveAttribute("src", /.*/);
      await expect(clip.locator("..")).toHaveAttribute("aria-hidden", "true");
    }
    const group = page.locator("#groups [data-ambient-video]");
    await group.scrollIntoViewIfNeeded();
    await expect(group).toHaveAttribute("src", /ambient-group\.mp4$/);
    await expect
      .poll(() => group.evaluate((v: HTMLVideoElement) => !v.paused))
      .toBe(true);
    await expect(group).toHaveAttribute("data-playing", "true");
    await expect(group).toHaveCSS("opacity", "1");
  });

  test("About band plays its own blurred backdrop clip", async ({ page }) => {
    await page.goto("/");
    const clip = page.locator("#about .ambient-backdrop [data-ambient-video]");
    await clip.scrollIntoViewIfNeeded();
    await expect(clip).toHaveAttribute("src", /loader\.mp4$/);
    await expect(clip).toHaveAttribute("data-playing", "true");
    await expect(clip).toHaveCSS("opacity", "1");
  });

  for (const route of ["/", "/treks/"]) {
    test(`treks backdrop mirrors the panel clip on ${route}`, async ({ page }) => {
      await page.goto(route);
      const backdrop = page.locator("[data-ambient-scope] [data-ambient-backdrop]");
      await expect(backdrop).toHaveCount(1);
      await backdrop.scrollIntoViewIfNeeded();
      // Mirrored, not a second copy of the clip.
      await expect(page.locator("[data-ambient-scope] video")).toHaveCount(1);
      await expect(backdrop).toHaveAttribute("data-drawn", "true");
      await expect(backdrop).toHaveCSS("opacity", "1");
    });
  }

  for (const route of ["/treks/", "/groups/"]) {
    test(`render on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator("[data-ambient-video]")).toHaveCount(1);
    });
  }

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("keep the poster and never load the clip", async ({ page }) => {
      await page.goto("/");
      const group = page.locator("#groups [data-ambient-video]");
      await group.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      await expect(group).not.toHaveAttribute("src", /.*/);
      await expect(
        page.locator("#groups [data-ambient-poster]"),
      ).toHaveAttribute("src", /ambient-group\.webp$/);
      await expect(page.locator("#groups [data-ambient-poster]")).toBeVisible();
    });

    test("backdrops keep the blurred poster and never draw or load", async ({ page }) => {
      await page.goto("/");
      for (const id of ["#about", "#treks"]) {
        await page.locator(id).scrollIntoViewIfNeeded();
        await expect(page.locator(`${id} .ambient-backdrop img`)).toBeVisible();
      }
      await page.waitForTimeout(500);
      await expect(page.locator("#about .ambient-backdrop video")).not.toHaveAttribute("src", /.*/);
      await expect(page.locator("#treks [data-ambient-backdrop]")).not.toHaveAttribute("data-drawn", /.*/);
    });
  });
});

test.describe("Hero panel layout (v2 vertical footage)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("ctr-welcome", "1"));
  });

  const plateBox = async (page: Page, path: string) => {
    await page.goto(path);
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-layout",
      "panel",
    );
    return (await page.locator(".ctr-hero__plate").boundingBox())!;
  };

  test("desktop: a portrait panel on the inline-end side, clear of the copy", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const box = await plateBox(page, "/");
    // 3:4 window on the 9:16 footage
    expect(box.height / box.width).toBeCloseTo(4 / 3, 1);
    expect(box.width).toBeGreaterThan(500);
    expect(box.x).toBeGreaterThan(720);
    const h1 = (await page.getByRole("heading", { level: 1 }).boundingBox())!;
    expect(h1.x + h1.width).toBeLessThan(box.x);
  });

  test("Arabic desktop: the panel mirrors to the left", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const box = await plateBox(page, "/ar/");
    expect(box.x + box.width).toBeLessThan(720);
  });

  test("phone portrait: the footage fills the stage", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const box = await plateBox(page, "/");
    expect(box.width).toBeGreaterThanOrEqual(374);
  });
});
