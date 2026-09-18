import { test, expect, type Page } from "@playwright/test";

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
      .poll(() => media.some((u) => u.includes("ride-desktop.mp4")))
      .toBe(true);
    expect(media.some((u) => u.includes("ride-mobile.mp4"))).toBe(false);
  });

  test("scrolling reveals the river act and advances the rail", async ({
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
    await expect(page.locator('[data-act="river"]')).toHaveCSS("opacity", "1");
    await expect(page.locator('[data-act="intro"]')).toHaveCSS("opacity", "0");
    await expect(page.locator('a[data-chapter="river"]')).toHaveAttribute(
      "aria-current",
      "true",
    );
  });

  test("#river deep link opens at the river chapter", async ({ page }) => {
    await page.goto("/#river");
    await expect(page.locator("[data-hero]")).toHaveAttribute(
      "data-mode",
      "scrub",
    );
    await expect(page.locator('[data-act="river"]')).toHaveCSS("opacity", "1");
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
      await expect(page.locator("[data-hero]")).toHaveAttribute("data-mode", "scrub");
      await page.locator('[data-hero] [data-hero-cta="book"]').click();
      await expect(page).toHaveURL(new RegExp(`${contact}$`));
    });
  }

  test("at p=0.5 the river act, not the intro, receives pointer events", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-mode", "scrub");
    await scrollToProgress(page, 0.5);
    await expect(page.locator('[data-act="river"]')).toHaveCSS("opacity", "1");
    await expect
      .poll(() =>
        page.evaluate(() => {
          const r = document.querySelector('[data-act="river"]')!.getBoundingClientRect();
          const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
          return hit?.closest("[data-act]")?.getAttribute("data-act") ?? null;
        }),
      )
      .toBe("river");
  });

  test("dock links are out of the tab order until the dock appears", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-mode", "scrub");
    const tabindexes = () =>
      page.locator("[data-hero-dock] a").evaluateAll((els) => els.map((e) => e.getAttribute("tabindex")));
    expect(await tabindexes()).toEqual(["-1", "-1"]);
    await scrollToProgress(page, 0.5);
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-dock", "on");
    expect(await tabindexes()).toEqual([null, null]);
  });

  test("deep link resyncs the video to the river frame once it is ready", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __seeks: number[] };
      w.__seeks = [];
      const desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "currentTime")!;
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
    await page.goto("/#river");
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-ready", "true");
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
    // river chapter is p=0.5; clip is ~5.7s, so the target is ~2.8s, never frame 0
    expect(last).toBeGreaterThan(2);
    expect(last).toBeLessThan(3.5);
  });

  test("snap does not fire while a pointer is held down, and may after release", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-mode", "scrub");
    // Let the video/layout settle so 0.47 stays near the river chapter.
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-ready", "true");
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

  test("a blur during a held mouse press releases the snap guard", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-hero]")).toHaveAttribute("data-ready", "true");
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
        await expect(page.locator("[data-hero]")).toHaveAttribute("data-ready", "true");
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 700, y: 450 }] });
        await scrollToProgress(page, 0.47);
        const held = await page.evaluate(() => window.scrollY);
        // Bounded waits: the frame-based velocity estimate must settle first (slow headless frames),
        // otherwise a snap would be rejected as "still moving" and the test could not fail.
        await page.waitForTimeout(1200);
        if (withPointerCancel) {
          // What a browser does when it takes the drag over as a native pan.
          await page.evaluate(() =>
            window.dispatchEvent(new PointerEvent("pointercancel", { pointerType: "touch" })),
          );
        }
        // Negative check: a wrongly-fired snap (160 ms idle timer) would show well inside this window.
        await page.waitForTimeout(600);
        expect(await page.evaluate(() => window.scrollY)).toBe(held);
        await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await expect.poll(() => page.evaluate(() => window.scrollY)).not.toBe(held);
      });
    }
  });
});
