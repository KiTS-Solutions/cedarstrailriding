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

test.describe("Autoplay hero", () => {
  // The welcome screen has its own suite; keep it out of the way of hero interactions.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem("ctr-welcome", "1"));
  });

  const hero = (page: Page) => page.locator("[data-hero]");
  const heroVideo = (page: Page) => page.locator("[data-hero-video]");
  const playing = (page: Page) =>
    heroVideo(page).evaluate((v: HTMLVideoElement) => !v.paused);
  const currentTime = (page: Page) =>
    heroVideo(page).evaluate((v: HTMLVideoElement) => v.currentTime);
  const mediaRequests = (page: Page): string[] => {
    const media: string[] = [];
    page.on("request", (r) => {
      if (/\.mp4(\?|$)/.test(r.url())) media.push(r.url());
    });
    return media;
  };
  const untilPlaying = async (page: Page) => {
    await expect(hero(page)).toHaveAttribute("data-mode", "play");
    await expect(hero(page)).toHaveAttribute("data-ready", "true");
  };

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
      const media = mediaRequests(page);
      await page.goto("/");
      await page.waitForLoadState("networkidle");
      await expect(hero(page)).toHaveAttribute("data-mode", "static");
      expect(media).toEqual([]);
      await expect(
        page.locator('[data-hero] [data-hero-cta="book"]'),
      ).toBeVisible();
      await expect(page.locator("[data-hero-toggle]")).toBeHidden();
    });
  });

  test("autoplays the desktop clip, muted and looping", async ({ page }) => {
    const media = mediaRequests(page);
    await page.goto("/");
    await untilPlaying(page);
    expect(await playing(page)).toBe(true);
    const v = await heroVideo(page).evaluate((el: HTMLVideoElement) => ({
      muted: el.muted,
      loop: el.loop,
      duration: el.duration,
    }));
    expect(v).toEqual({
      muted: true,
      loop: true,
      duration: expect.any(Number),
    });
    // The seamless 13 s loop (scripts/encode-hero-v2.sh).
    expect(v.duration).toBeCloseTo(13, 0);
    expect(media.some((u) => u.includes("play-hd.mp4"))).toBe(true);
    expect(media.some((u) => u.includes("play-mobile.mp4"))).toBe(false);
    await expect(heroVideo(page)).toHaveCSS("opacity", "1");
  });

  test("a 3g connection estimate still autoplays, on the lighter 540p clip", async ({
    page,
  }) => {
    // Chrome reports "3g" for ordinary high-RTT broadband (e.g. 350 ms in Lebanon).
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "connection", {
        value: { effectiveType: "3g", saveData: false },
      }),
    );
    const media = mediaRequests(page);
    await page.goto("/");
    await untilPlaying(page);
    expect(media.some((u) => u.includes("play-mobile.mp4"))).toBe(true);
    expect(media.some((u) => u.includes("play-hd.mp4"))).toBe(false);
  });

  for (const vp of [
    { name: "desktop", width: 1440, height: 900 },
    { name: "phone", width: 375, height: 812 },
  ]) {
    test(`the hero is one screen tall: the next section starts at the fold (${vp.name})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");
      await untilPlaying(page);
      const bottom = await hero(page).evaluate(
        (el) => el.getBoundingClientRect().bottom,
      );
      // +8: at 375px the copy itself is a few px taller than the min-height, so content wins.
      expect(bottom).toBeLessThanOrEqual(vp.height + 8);
      expect(bottom).toBeGreaterThanOrEqual(vp.height - 8);
    });

    test(`static to play upgrade causes no layout shift (${vp.name})`, async ({
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
      await untilPlaying(page);
      await page.waitForTimeout(500);
      const cls = await page.evaluate(
        () => (window as unknown as { __cls: number }).__cls,
      );
      expect(cls).toBeLessThan(0.02);
    });
  }

  test("the acts and the rail follow the footage as it plays", async ({
    page,
  }) => {
    test.setTimeout(30_000);
    await page.goto("/");
    await untilPlaying(page);
    await expect(page.locator('a[data-chapter="shouf"]')).toHaveAttribute(
      "aria-current",
      "true",
    );
    // Ridge from 0.32 of the 13 s loop, ride from 0.68: real playback, no seeking.
    await expect(page.locator('[data-act="ridge"]')).toHaveCSS("opacity", "1", {
      timeout: 8000,
    });
    await expect(page.locator('[data-act="intro"]')).toHaveCSS("opacity", "0");
    await expect(page.locator('a[data-chapter="ridge"]')).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(page.locator('[data-act="ride"]')).toHaveCSS("opacity", "1", {
      timeout: 8000,
    });
    await expect(page.locator('a[data-chapter="ride"]')).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("the pause button stops the footage and the copy, and resumes them", async ({
    page,
  }) => {
    await page.goto("/");
    await untilPlaying(page);
    const toggle = page.locator("[data-hero-toggle]");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect(toggle).toHaveAccessibleName("Pause video");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toHaveAccessibleName("Play video");
    await expect.poll(() => playing(page)).toBe(false);
    const t = await currentTime(page);
    const p = await hero(page).evaluate((el) =>
      el.style.getPropertyValue("--p"),
    );
    await page.waitForTimeout(1000);
    expect(await currentTime(page)).toBe(t);
    expect(
      await hero(page).evaluate((el) => el.style.getPropertyValue("--p")),
    ).toBe(p);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await expect.poll(() => playing(page)).toBe(true);
    await expect.poll(() => currentTime(page)).toBeGreaterThan(t);
  });

  test("keyboard focus inside the copy holds the loop still", async ({
    page,
  }) => {
    await page.goto("/");
    await untilPlaying(page);
    await page.locator('[data-hero] [data-hero-cta="book"]').focus();
    await expect.poll(() => playing(page)).toBe(false);
    // The visitor's own pause state is untouched.
    await expect(page.locator("[data-hero-toggle]")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await page.locator("[data-hero-toggle]").focus();
    await expect.poll(() => playing(page)).toBe(true);
  });

  test("refused autoplay keeps the poster and offers the play button", async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = function () {
        return Promise.reject(new DOMException("blocked", "NotAllowedError"));
      };
    });
    await page.goto("/");
    await expect(hero(page)).toHaveAttribute("data-mode", "play");
    const toggle = page.locator("[data-hero-toggle]");
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect(toggle).toHaveAccessibleName("Play video");
    await expect(hero(page)).not.toHaveAttribute("data-ready", /.*/);
    await expect(page.locator(".ctr-hero__poster")).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("a video that fails to load falls back to the static hero", async ({
    page,
  }) => {
    await page.route(/\.mp4(\?|$)/, (route) => route.abort());
    await page.goto("/");
    await expect(hero(page)).toHaveAttribute("data-mode", "static");
    await expect(hero(page)).not.toHaveAttribute("data-ready", /.*/);
    await expect(page.locator(".ctr-hero__poster")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('[data-act="ridge"]')).toBeHidden();
    await expect(page.locator("[data-hero-toggle]")).toBeHidden();
  });

  test("a rail click jumps the loop to that chapter", async ({ page }) => {
    await page.goto("/");
    await untilPlaying(page);
    await page.locator("[data-hero-toggle]").click(); // hold still for the assertions
    await page.locator('a[data-chapter="ride"]').click();
    await expect(page).toHaveURL(/#ride$/);
    await expect(page.locator('[data-act="ride"]')).toHaveCSS("opacity", "1");
    await expect(page.locator('a[data-chapter="ride"]')).toHaveAttribute(
      "aria-current",
      "true",
    );
    // ride chapter is p=0.72 of the 13 s loop
    await expect.poll(() => currentTime(page)).toBeGreaterThan(8.8);
    expect(await currentTime(page)).toBeLessThan(10);
  });

  test("#ridge deep link opens on the ridge act and its footage", async ({
    page,
  }) => {
    await page.goto("/#ridge");
    await expect(page.locator('[data-act="ridge"]')).toHaveCSS("opacity", "1");
    await untilPlaying(page);
    // ridge chapter is p=0.36 of the 13 s loop (~4.7 s), never frame 0
    const t = await currentTime(page);
    expect(t).toBeGreaterThan(4.3);
    expect(t).toBeLessThan(8);
  });

  test("only the act on show is clickable and focusable", async ({ page }) => {
    await page.goto("/");
    await untilPlaying(page);
    await page.locator("[data-hero-toggle]").click();
    await expect(
      page.locator('[data-act="ride"] [data-hero-cta="plan"]'),
    ).toHaveAttribute("tabindex", "-1");
    await page.locator('a[data-chapter="ridge"]').click();
    await expect(page.locator('[data-act="ridge"]')).toHaveCSS("opacity", "1");
    await expect(
      page.locator('[data-act="intro"] [data-hero-cta="book"]'),
    ).toHaveAttribute("tabindex", "-1");
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

  test("pauses while scrolled out of view and resumes on return", async ({
    page,
  }) => {
    await page.goto("/");
    await untilPlaying(page);
    await page.locator("#groups").scrollIntoViewIfNeeded();
    await expect.poll(() => playing(page)).toBe(false);
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => playing(page)).toBe(true);
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
    await expect(hero(page)).toHaveAttribute("data-mode", "play");
    const box = await page.locator(".ctr-hero__rail").boundingBox();
    const vw = page.viewportSize()!.width;
    expect(box!.x).toBeGreaterThan(vw / 2);
    await expect(page.getByRole("heading", { level: 1 })).not.toHaveText(
      "Explore Lebanon on Horseback",
    );
    await expect(page.locator("[data-hero-toggle]")).toHaveAccessibleName(
      "إيقاف الفيديو مؤقتاً",
    );
  });

  for (const [label, viewport, path, contact] of [
    ["desktop", { width: 1440, height: 900 }, "/", "/contact/"],
    ["phone", { width: 375, height: 812 }, "/", "/contact/"],
    ["phone Arabic", { width: 375, height: 812 }, "/ar/", "/ar/contact/"],
  ] as const) {
    test(`Book CTA is really clickable (${label})`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto(path);
      await expect(hero(page)).toHaveAttribute("data-mode", "play");
      await page.locator('[data-hero] [data-hero-cta="book"]').click();
      await expect(page).toHaveURL(new RegExp(`${contact}$`));
    });
  }

  test("dust motes drift over the hero without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
    await page.goto("/");
    await untilPlaying(page);
    await expect(hero(page)).toHaveAttribute("data-fx", "dust");
    // The canvas must be sized to the stage, not left at the 1x1 it has while display:none.
    expect(
      await page.evaluate(
        () =>
          document.querySelector<HTMLCanvasElement>("[data-hero-fx]")!.width,
      ),
    ).toBeGreaterThan(300);
    await expect
      .poll(
        () =>
          page.evaluate(() => {
            const c =
              document.querySelector<HTMLCanvasElement>("[data-hero-fx]")!;
            const data = c
              .getContext("2d")!
              .getImageData(0, 0, c.width, c.height).data;
            let n = 0;
            for (let i = 3; i < data.length; i += 4) if (data[i] !== 0) n++;
            return n;
          }),
        { timeout: 8000, intervals: [250] },
      )
      .toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });

  test("the panel's blurred backdrop mirrors real frames once playing", async ({
    page,
  }) => {
    await page.goto("/");
    await untilPlaying(page);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const c = document.querySelector<HTMLCanvasElement>(
            "[data-hero-backdrop]",
          )!;
          const ctx = c.getContext("2d")!;
          let bright = 0;
          for (let i = 1; i <= 6; i++) {
            for (let j = 1; j <= 6; j++) {
              const d = ctx.getImageData(
                Math.floor((c.width * i) / 7),
                Math.floor((c.height * j) / 7),
                1,
                1,
              ).data;
              const lum =
                0.2126 * (d[0] ?? 0) +
                0.7152 * (d[1] ?? 0) +
                0.0722 * (d[2] ?? 0);
              if ((d[3] ?? 0) > 0 && lum > 20) bright++;
            }
          }
          return bright;
        }),
      )
      .toBeGreaterThan(0);
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

    test("chapter clicks and the pause control are tracked; playback alone is not", async ({
      page,
    }) => {
      await stubGtag(page);
      await page.goto("/");
      await untilPlaying(page);
      await page.waitForTimeout(700);
      expect(named(await calls(page), "hero_chapter_click")).toEqual([]);
      await page.locator('a[data-chapter="ridge"]').click();
      await page.locator("[data-hero-toggle]").click();
      await expect
        .poll(async () => [
          ...named(await calls(page), "hero_chapter_click"),
          ...named(await calls(page), "hero_video_toggle"),
        ])
        .toEqual([
          ["event", "hero_chapter_click", { chapter: "ridge" }],
          ["event", "hero_video_toggle", { state: "paused" }],
        ]);
    });

    test("hero CTA clicks are tracked by name", async ({ page }) => {
      await stubGtag(page);
      await page.goto("/");
      await expect(hero(page)).toHaveAttribute("data-mode", "play");
      // "Explore" stays on the page (#trails), so the recorded call can be read back.
      await page.locator('[data-hero] [data-hero-cta="explore"]').click();
      await expect
        .poll(async () => named(await calls(page), "hero_cta_click"))
        .toEqual([["event", "hero_cta_click", { cta: "explore" }]]);
    });

    test("a throwing analytics hook never breaks the hero", async ({
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
      await untilPlaying(page);
      await page.locator('a[data-chapter="ride"]').click();
      await expect(page.locator('[data-act="ride"]')).toHaveCSS("opacity", "1");
      await page.locator("[data-hero-toggle]").click();
      await expect(page.locator("[data-hero-toggle]")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await expect(hero(page)).toHaveAttribute("data-mode", "play");
      expect(errors).toEqual([]);
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
        await expect(hero(page)).toHaveAttribute("data-mode", "static");
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

  test("French: autoplay hero, LTR, FR headline, rail on the left", async ({
    page,
  }) => {
    const fr = JSON.parse(
      readFileSync(
        fileURLToPath(new URL("../src/i18n/locales/fr.json", import.meta.url)),
        "utf8",
      ),
    ) as Record<string, string>;
    await page.goto("/fr/");
    await expect(hero(page)).toHaveAttribute("data-mode", "play");
    await expect(page.locator("html")).toHaveAttribute("lang", "fr");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      fr["brand.hero"]!,
    );
    await expect(page.locator("[data-hero-toggle]")).toHaveAccessibleName(
      fr["hero.pause"]!,
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

  // The bar deliberately yields to the hero (which has its own Book CTA) and to the booking form,
  // so it is asserted on content pages rather than on "/" or "/contact/".
  for (const path of ["/trails/", "/ar/trails/", "/fr/trails/"]) {
    test(`sticky WhatsApp/Call bar and 44px targets (${path})`, async ({
      page,
    }) => {
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
    const links = page
      .getByRole("dialog")
      .getByRole("group", { name: "Language" })
      .getByRole("link");
    await expect(links).toHaveCount(3);
    for (const link of await links.all()) {
      expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("booking form has mobile input hints", async ({ page }) => {
    await page.goto("/contact/");
    await expect(page.locator('input[name="phone"]')).toHaveAttribute(
      "inputmode",
      "tel",
    );
    await expect(page.locator('input[name="phone"]')).toHaveAttribute(
      "autocomplete",
      "tel",
    );
    await expect(page.locator('input[name="email"]')).toHaveAttribute(
      "autocomplete",
      "email",
    );
  });

  test("bar is hidden on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/trails/");
    await expect(page.locator("[data-sticky-contact]")).toBeHidden();
  });
});

test.describe("Welcome loader", () => {
  const loader = (page: Page) => page.locator("[data-loader]");

  const sinceNavigation = (page: Page) =>
    page.evaluate(() => performance.now());

  test("plays for its minimum time, then leaves on its own within the cap", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-welcome", "on");
    await expect(loader(page)).toBeVisible();
    await expect(loader(page).getByRole("button")).toHaveText("Skip");
    // Still fully up just before the 5 s minimum, even though the hero is ready by then.
    await page.waitForTimeout(
      Math.max(0, 4700 - (await sinceNavigation(page))),
    );
    await expect(loader(page)).not.toHaveAttribute("data-state", "out");
    // 8 s cap + 1.25 s staged exit, measured from navigation start.
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
    await page.waitForTimeout(
      Math.max(0, 5100 - (await sinceNavigation(page))),
    );
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
    await expect(loader(page)).toHaveCount(0, { timeout: 11000 });
    await page.goto("/fr/");
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-welcome",
      /.*/,
    );
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
    await expect(loader(page)).toBeHidden({ timeout: 11000 });
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
    for (const clip of await clips.all())
      await expect(clip.locator("..")).toHaveAttribute("aria-hidden", "true");
    // The About band sits just under the one-screen hero, inside the load margin; the treks
    // and groups clips are far below it and must not be fetched yet.
    for (const id of ["#treks", "#groups"]) {
      const clip = page.locator(`${id} [data-ambient-video]`);
      await expect(clip).toHaveAttribute("preload", "none");
      await expect(clip).not.toHaveAttribute("src", /.*/);
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

  test("About band plays the gallop clip as its blurred backdrop", async ({
    page,
  }) => {
    await page.goto("/");
    const clip = page.locator("#about .ambient-backdrop [data-ambient-video]");
    await clip.scrollIntoViewIfNeeded();
    await expect(clip).toHaveAttribute("src", /ambient-gallop\.mp4$/);
    await expect(clip).toHaveAttribute("data-playing", "true");
    await expect(clip).toHaveCSS("opacity", "1");
  });

  for (const route of ["/", "/treks/"]) {
    test(`treks backdrop mirrors the panel clip on ${route}`, async ({
      page,
    }) => {
      await page.goto(route);
      const backdrop = page.locator(
        "[data-ambient-scope] [data-ambient-backdrop]",
      );
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

    test("backdrops keep the blurred poster and never draw or load", async ({
      page,
    }) => {
      await page.goto("/");
      for (const id of ["#about", "#treks"]) {
        await page.locator(id).scrollIntoViewIfNeeded();
        await expect(page.locator(`${id} .ambient-backdrop img`)).toBeVisible();
      }
      await page.waitForTimeout(500);
      await expect(
        page.locator("#about .ambient-backdrop video"),
      ).not.toHaveAttribute("src", /.*/);
      await expect(
        page.locator("#treks [data-ambient-backdrop]"),
      ).not.toHaveAttribute("data-drawn", /.*/);
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

test.describe("Site credit", () => {
  test("agency credit is collapsed by default and reveals contact on click", async ({ page }) => {
    await page.goto("/");
    const credit = page.locator("footer details").filter({ hasText: "KiTS" });
    const whatsapp = credit.getByRole("link", { name: /WhatsApp/ });
    await expect(credit).not.toHaveAttribute("open", "");
    await expect(whatsapp).toBeHidden();

    await credit.locator("summary").click();
    await expect(whatsapp).toBeVisible();
    await expect(whatsapp).toHaveAttribute("href", "https://wa.me/96181290662");
    await expect(credit.getByRole("link", { name: "kits.tech.co@gmail.com" })).toHaveAttribute(
      "href",
      "mailto:kits.tech.co@gmail.com",
    );
  });

  test("credit is translated on /ar/", async ({ page }) => {
    await page.goto("/ar/");
    await expect(page.locator("footer summary").filter({ hasText: "KiTS" })).toContainText("تصميم وتطوير وصيانة");
  });
});
