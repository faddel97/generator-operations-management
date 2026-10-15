/* eslint-disable @typescript-eslint/no-require-imports */
// Real-browser smoke test. Set PLAYWRIGHT_MODULE to a local Playwright package if needed.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

async function main() {
  const output = path.resolve("tmp", "assembly-qa");
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
  const page = await browser.newPage({ viewport: { width: 1640, height: 1180 }, deviceScaleFactor: 1, hasTouch: true });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error" && !message.text().includes("Failed to load resource")) errors.push(message.text()); });
  try {
    await page.goto(`${process.env.ASSEMBLY_TEST_URL || "http://localhost:3002"}/parts/assembly`, { waitUntil: "networkidle", timeout: 120000 });
    await page.locator('[data-testid="assembly-scene"][data-ready="true"]').waitFor({ timeout: 60000 });
    await page.waitForTimeout(1800);
    assert(await page.locator("canvas").count() === 1, "A real 3D canvas must render");
    await page.screenshot({ path: path.join(output, "assembled-desktop.png"), fullPage: true });
    const canvas = page.locator("canvas");
    const area = await canvas.boundingBox();
    assert(area && area.width > 200 && area.height > 200);
    const initial = await canvas.screenshot();
    await page.mouse.move(area.x + area.width * .6, area.y + area.height * .5);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width * .8, area.y + area.height * .6, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    assert(!initial.equals(await canvas.screenshot()), "Dragging must rotate the rendered assembly");
    const beforeZoom = await canvas.screenshot();
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.waitForTimeout(700);
    const zoomedIn = await canvas.screenshot();
    assert(!beforeZoom.equals(zoomedIn), "Zoom-in button must change the rendered view");
    await page.getByRole("button", { name: "Zoom out", exact: true }).click();
    await page.waitForTimeout(700);
    assert(!zoomedIn.equals(await canvas.screenshot()), "Zoom-out button must change the rendered view");
    await page.mouse.move(area.x + area.width * .5, area.y + area.height * .5);
    const beforeWheel = await canvas.screenshot();
    await page.mouse.wheel(0, -180);
    await page.waitForTimeout(400);
    assert(!beforeWheel.equals(await canvas.screenshot()), "Mouse-wheel zoom must work");
    await page.getByRole("button", { name: "Reset assembly", exact: true }).click();

    const viewport = page.getByRole("region", { name: "Interactive 3D assembly" });
    await page.locator('[data-part-id="battery"]').click();
    assert.equal(await viewport.getAttribute("data-camera-pivot"), "battery", "Selecting a component must make it the orbit pivot");
    await page.waitForTimeout(800);
    const partPivot = await canvas.screenshot();
    const navigationArea = await canvas.boundingBox();
    const navigationPoint = { x: navigationArea.x + navigationArea.width * .48, y: navigationArea.y + navigationArea.height * .42 };

    await page.mouse.move(navigationPoint.x, navigationPoint.y);
    await page.mouse.down({ button: "right" });
    await page.mouse.move(navigationPoint.x + 70, navigationPoint.y + 35, { steps: 8 });
    await page.mouse.up({ button: "right" });
    await page.waitForTimeout(300);
    assert.equal(await viewport.getAttribute("data-camera-pivot"), "battery", "Right-drag must pan without clearing the component pivot");
    assert(!partPivot.equals(await canvas.screenshot()), "Right-drag must change the rendered view");

    const beforeChord = await canvas.screenshot();
    await page.mouse.move(navigationPoint.x, navigationPoint.y);
    await page.mouse.down({ button: "left" });
    await page.mouse.down({ button: "right" });
    await page.mouse.move(navigationPoint.x - 65, navigationPoint.y + 30, { steps: 8 });
    await page.mouse.up({ button: "right" });
    await page.mouse.up({ button: "left" });
    await page.waitForTimeout(300);
    assert.equal(await viewport.getAttribute("data-camera-pivot"), "battery", "The two-button pan gesture must not clear the component pivot");
    assert(!beforeChord.equals(await canvas.screenshot()), "Holding left and right buttons together must pan the view");

    const beforeReverseChord = await canvas.screenshot();
    await page.mouse.move(navigationPoint.x, navigationPoint.y);
    await page.mouse.down({ button: "right" });
    await page.mouse.down({ button: "left" });
    await page.mouse.move(navigationPoint.x + 55, navigationPoint.y - 35, { steps: 8 });
    await page.mouse.up({ button: "left" });
    await page.mouse.up({ button: "right" });
    await page.waitForTimeout(300);
    assert.equal(await viewport.getAttribute("data-camera-pivot"), "battery", "The reverse-order two-button pan must not clear the component pivot");
    assert(!beforeReverseChord.equals(await canvas.screenshot()), "The two-button pan must work regardless of which mouse button is pressed first");

    const beforeClear = await canvas.screenshot();
    await page.mouse.click(navigationPoint.x, navigationPoint.y, { button: "right" });
    await page.waitForTimeout(800);
    assert.equal(await viewport.getAttribute("data-camera-pivot"), "assembly", "A short right-click must return the orbit pivot to the assembly");
    assert(!beforeClear.equals(await canvas.screenshot()), "Clearing component focus must recenter the rotation pivot");
    await page.getByRole("button", { name: "Reset assembly", exact: true }).click();

    // Enter a close view first. Exploding from here must keep that camera view,
    // allowing a technician to inspect the moving parts without an automatic fit.
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "Explode", exact: true }).click();
    await page.waitForFunction(() => document.querySelector('output[for="assembly-explode"]')?.textContent === "100%");
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(output, "exploded-closeup.png"), fullPage: true });
    await page.getByLabel("Internal components", { exact: true }).check();
    await page.locator('[data-part-id="rotor"]').click();
    await page.getByRole("button", { name: "Isolate part", exact: true }).click();
    await page.getByLabel("Design dimensions*", { exact: true }).check();
    await page.waitForTimeout(1000);
    assert.match(await page.getByTestId("selected-part-name").textContent(), /Main rotor/);
    assert(await page.getByRole("slider").isDisabled(), "Explode must be unavailable in isolated view");
    const isolated = await canvas.screenshot();
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.waitForTimeout(700);
    assert(!isolated.equals(await canvas.screenshot()), "Zoom must also work in isolated-part view");
    await page.mouse.move(area.x + area.width * .5, area.y + area.height * .5);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width * .7, area.y + area.height * .6, { steps: 12 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    assert(!isolated.equals(await canvas.screenshot()), "An isolated component must rotate independently");
    await page.screenshot({ path: path.join(output, "isolated-rotor.png"), fullPage: true });
    await page.getByRole("button", { name: "Return to assembly", exact: true }).click();
    assert.equal(await page.getByRole("slider").inputValue(), "100", "Returning must preserve separation");

    await page.locator('[data-part-id="battery"]').click();
    await page.getByRole("tab", { name: /Links/ }).click();
    await page.locator('[data-connection-id="battery-start"]').click();
    assert.equal(await page.locator('[data-connection-id="battery-start"]').getAttribute("aria-pressed"), "true");
    await page.screenshot({ path: path.join(output, "exploded-connections.png"), fullPage: true });
    await page.getByRole("button", { name: "Hide part", exact: true }).click();
    assert.match(await page.locator('[data-part-id="battery"]').textContent(), /Hidden/);
    await page.getByRole("button", { name: "Reset assembly", exact: true }).click();
    assert.equal(await page.getByRole("slider").inputValue(), "0");
    assert.equal(await page.getByLabel("Internal components", { exact: true }).isChecked(), false);
    assert.equal(await page.getByTestId("selected-part-name").textContent(), "Engine block");

    await page.getByRole("tab", { name: "Assembly story", exact: true }).click();
    assert.match(await page.getByLabel("Assembly story", { exact: true }).textContent(), /Foundation/);
    await page.getByRole("button", { name: "Next assembly stage" }).click();
    assert.match(await page.getByLabel("Assembly story", { exact: true }).textContent(), /Power unit/);
    await page.getByRole("tab", { name: "Installation & use", exact: true }).click();
    assert(await page.getByLabel("Installation and operation planning").isVisible());
    await page.getByRole("button", { name: "Reset assembly", exact: true }).click();
    await page.getByRole("textbox", { name: "Search components" }).fill("not-a-component");
    assert(await page.getByText("No matching components.").isVisible());
    await page.getByRole("textbox", { name: "Search components" }).fill("");

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(800);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert(!overflow, "Mobile layout must not overflow horizontally");
    await canvas.scrollIntoViewIfNeeded();
    const touchArea = await canvas.boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const centerX = touchArea.x + touchArea.width * .5;
    const centerY = Math.max(100, touchArea.y + touchArea.height * .5);
    const beforePinch = await canvas.screenshot();
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: centerX - 25, y: centerY, id: 1 }, { x: centerX + 25, y: centerY, id: 2 }] });
    for (const spread of [35, 45, 60, 75]) await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: centerX - spread, y: centerY, id: 1 }, { x: centerX + spread, y: centerY, id: 2 }] });
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await page.waitForTimeout(400);
    assert(!beforePinch.equals(await canvas.screenshot()), "Two-finger pinch must zoom on touch devices");
    await page.screenshot({ path: path.join(output, "mobile.png"), fullPage: true });
    assert.equal(errors.length, 0, errors.join("\n"));
    console.log("PASS: rendering, component orbit pivot and right-click clear, right-drag and two-button pan, whole-set and part orbit, +/- buttons, mouse-wheel and touch-pinch zoom, close-view explode/isolate/restore, connection selection, hide/reset, assembly stages, lifecycle, filtering, mobile layout; no browser exceptions or React errors.");
  } finally { await browser.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
