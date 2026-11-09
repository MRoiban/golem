// The playground (/play): every component on one page. It is for people to play with, so these
// checks only keep it working: it loads clean in every motion mode, every motion part gets drawn,
// the settings reach the URL, stress bursts raise no errors, and it fits a phone.
import { expect, test, type Page } from "@playwright/test";
import { HAS_ANIMA, NEEDS_ANIMA, THEMES, expectNoHorizontalOverflow, watchConsole } from "./helpers";

const CELLS = ["switch", "checkbox", "radio-group", "toggle", "button", "spinner", "progress", "meter", "tabs",
  "toggle-group", "section-select", "slider", "password-field", "collapsible", "accordion", "toast", "alert", "events"];

/** Scrolls through the page, so the scheduler mounts the motion parts below the fold. */
async function scrollThrough(page: Page) {
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= height; y += 500) { await page.evaluate((top) => scrollTo(0, top), y); await page.waitForTimeout(60); }
  await page.evaluate(() => scrollTo(0, 0));
}

test("every component has a cell", async ({ page }) => {
  await page.goto("/play");
  for (const id of CELLS) await expect(page.locator(`[data-cell='${id}']`)).toBeVisible();
});

test("every motion part is drawn by Anima once scrolled into view", async ({ page }) => {
  test.skip(!HAS_ANIMA, NEEDS_ANIMA);
  const console = watchConsole(page);
  await page.goto("/play?motion=anima");
  await expect(page.getByTestId("runtime")).toHaveText("ready");
  await scrollThrough(page);
  await expect.poll(() => page.locator("[data-golem-part]:not([data-anima='ready'])").count()).toBe(0);
  expect(await page.locator("[data-golem-part]").count()).toBeGreaterThan(60);
  console.expectClean();
});

for (const query of ["motion=css", "motion=reduced", "anima=off"]) {
  test(`plain Onyx with ${query}: no drawings, no errors`, async ({ page }) => {
    const console = watchConsole(page);
    await page.goto(`/play?${query}`);
    await scrollThrough(page);
    await expect(page.locator("anima-icon")).toHaveCount(0);
    console.expectClean();
  });
}

test("settings go into the URL and survive a reload", async ({ page }) => {
  await page.goto("/play");
  const bar = page.locator(".bar");
  await bar.getByRole("radio", { name: "Rose dark" }).click();
  await bar.getByRole("radio", { name: "Comfortable" }).click();
  await bar.getByRole("radio", { name: "Reduced" }).click();
  await page.getByLabel("Plain Onyx beside").click();
  await expect(page).toHaveURL(/theme=rose-dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "rose-dark");
  await expect(page.locator("html")).toHaveAttribute("data-density", "comfortable");
  await expect(page.getByTestId("motion")).toHaveText("reduced");
  await expect(page.getByTestId("reference-switch")).toBeVisible();
});

test("changes are logged, and stress bursts in every theme raise no errors", async ({ page }) => {
  const console = watchConsole(page);
  await page.goto("/play?motion=anima");
  await page.getByLabel("Beta features").click();
  await expect(page.getByTestId("state-switch")).toContainText("beta=on");
  await expect(page.locator(".events li").first()).toContainText("Beta → on");
  for (const [i, label] of ["Light", "Rose", "Rose dark", "Flexoki", "Flexoki dark", "Dark"].entries()) {
    await page.locator(".bar").getByRole("radio", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`theme=${THEMES[(i + 1) % THEMES.length]}&`));
    await page.getByRole("button", { name: "Stress everything" }).click();
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(1500);
  // Stress opens and closes the accordions and collapsibles above the viewport, so Firefox's scroll
  // anchoring gives up for a moment and says so. That is the page's layout moving, not a component.
  console.expectClean([/Scroll anchoring was disabled/]);
});

test("fits a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/play");
  await scrollThrough(page);
  await expectNoHorizontalOverflow(page);
});
