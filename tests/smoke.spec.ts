import { test, expect } from "@playwright/test";

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
