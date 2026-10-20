/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const out = path.resolve("tmp", "facility-map-qa");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe" });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1500, height: 1050 } });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("response", (response) => { if (response.url().includes("/facility-map/tiles/") && response.status() !== 200) errors.push(`tile ${response.status()} ${response.url()}`); });
  try {
    await page.goto(`${process.env.FACILITY_TEST_URL || "http://localhost:3003"}/tracking`, { waitUntil: "networkidle", timeout: 120000 });
    await page.locator(".leaflet-tile-loaded").first().waitFor({ timeout: 30000 });
    assert(await page.getByText("FICTIONAL DEMO", { exact: true }).count() === 1);
    assert(await page.locator(".leaflet-tile-loaded").count() > 3);
    await page.screenshot({ path: path.join(out, "desktop.png"), fullPage: true });

    const canvas = page.locator(".facility-map-canvas");
    const before = await canvas.screenshot();
    await page.getByRole("button", { name: "Zoom in" }).click();
    await page.waitForTimeout(850);
    assert(!before.equals(await canvas.screenshot()), "Zoom control must change the map");
    const zoomed = await canvas.screenshot();
    const box = await canvas.boundingBox();
    assert(box && box.width > 300 && box.height > 300);
    await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
    await page.mouse.wheel(0, -180);
    await page.waitForTimeout(800);
    assert(!zoomed.equals(await canvas.screenshot()), "Mouse wheel must zoom the map");
    const wheeled = await canvas.screenshot();
    await page.mouse.move(box.x + box.width * .5, box.y + box.height * .5);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * .67, box.y + box.height * .63, { steps: 8 });
    await page.mouse.up();
    await page.waitForTimeout(500);
    assert(!wheeled.equals(await canvas.screenshot()), "Drag must pan the map");

    await page.getByRole("textbox", { name: "Search facility locations and assets" }).fill("DEMO-FLK-001");
    await page.getByRole("button", { name: /Demo search forklift/ }).first().click();
    assert(await page.getByRole("heading", { name: "Demo search forklift" }).count() === 1);
    assert(await page.getByText("47%", { exact: true }).count() === 1);
    await page.getByRole("button", { name: "Directions to last known position" }).click();
    assert(await page.getByText(/Illustrative demo route/).count() === 1);
    await page.screenshot({ path: path.join(out, "find-asset.png"), fullPage: true });

    await page.getByRole("textbox", { name: "Search facility locations and assets" }).fill("963-C410-GMS-301");
    await page.getByRole("button", { name: /963-C410-GMS-301/ }).first().click();
    assert(await page.getByText(/annotation box, not a verified/).count() === 1, "PDF codes must be searchable but unverified");
    await page.getByRole("textbox", { name: "Search facility locations and assets" }).fill("D1");
    assert(await page.getByRole("button", { name: /D1 block/ }).count() >= 1, "Block search must work");
    await page.getByRole("textbox", { name: "Search facility locations and assets" }).fill("P-01");
    assert(await page.getByRole("button", { name: /Demo return area 01/ }).count() >= 1, "Parking search must work");

    await page.getByRole("combobox", { name: "Select demo scenario" }).selectOption("fuel");
    assert(await page.getByRole("heading", { name: "Demo low fuel generator" }).count() === 1);
    assert(await page.getByText("9%", { exact: true }).count() === 1);
    await page.getByRole("combobox", { name: "Select demo scenario" }).selectOption("movement");
    await page.waitForTimeout(3100);
    assert(await page.getByText(/Simulated clock: \+[12] min/).count() === 1, "Demo movement should advance");
    await page.locator(".facility-demo-bar label select").first().selectOption("5");
    await page.getByRole("combobox", { name: "Select demo scenario" }).selectOption("return");
    await page.waitForTimeout(3900);
    assert(await page.locator(".facility-detail-panel .facility-pill.returned").count() === 1, "Demo return should update status");
    await page.getByRole("button", { name: "Real records" }).click();
    assert(await page.getByText(/0 assets · 0 mapped/).count() === 1, "Real mode must not contain fictional markers");
    const unauthorized = await page.evaluate(async () => {
      const response = await fetch("/api/facility-map", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "place", code: "TEST", name: "Unauthorized", kind: "building", x: 100, y: 100 }) });
      return response.status;
    });
    assert.equal(unauthorized, 401, "Map writes require authentication");

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    mobile.on("pageerror", (error) => errors.push(error.message));
    await mobile.goto(`${process.env.FACILITY_TEST_URL || "http://localhost:3003"}/tracking`, { waitUntil: "networkidle", timeout: 120000 });
    await mobile.locator(".leaflet-tile-loaded").first().waitFor({ timeout: 30000 });
    await mobile.screenshot({ path: path.join(out, "mobile.png"), fullPage: true });
    const horizontalOverflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
    assert(!horizontalOverflow, "No horizontal page overflow on mobile");
    assert.deepEqual(errors, []);
    console.log("Facility map browser check passed:", out);
    await mobile.close();
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
