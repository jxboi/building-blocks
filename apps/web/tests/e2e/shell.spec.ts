import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("auth page carries the security header baseline", async ({ page }) => {
  const response = await page.goto("/login");
  expect(response).not.toBeNull();
  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"]).toContain("script-src 'self' 'nonce-");
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["permissions-policy"]).toContain("camera=()");
});

test("demo shell is accessible at mobile width", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: /Good morning/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation" })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);

  await page.getByRole("button", { name: "Open navigation" }).click();
  const navigationDialog = page.getByRole("dialog", { name: "Open navigation" });
  await expect(navigationDialog).toBeVisible();
  await expect(navigationDialog.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
  await expect(navigationDialog.getByRole("button", { name: "Collapse sidebar" })).toHaveCount(0);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("demo shell command palette opens without leaving the page", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  await page.goto("/demo");
  await page.getByRole("button", { name: "Search or jump to… ⌘K" }).click();
  await expect(page.getByRole("dialog", { name: "Open command palette" })).toBeVisible();
  await expect(page.getByRole("combobox")).toBeFocused();
  await expect(page).toHaveURL(/\/demo$/);
});

test("demo sidebar identifies the current workspace view", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  await page.goto("/demo");

  await expect(page.getByText("Building Blocks", { exact: true })).toHaveCount(0);

  const overviewLink = page.getByRole("link", { name: "Overview" });
  await expect(overviewLink).toHaveAttribute("aria-current", "page");
  await expect(page.getByText("Workspace", { exact: true })).toBeVisible();

  await overviewLink.click({ button: "right" });
  await expect(page.getByRole("menu")).toHaveCount(0);

  const approvalsRow = page.getByRole("button", { name: "Expand Approvals" });
  await approvalsRow.click();
  await expect(page.getByRole("link", { name: "Pending 9" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Collapse Approvals" })).toBeVisible();

  const collapseSidebar = page.getByRole("button", { name: "Collapse sidebar" });
  await expect(collapseSidebar.locator("..").getByRole("button", { name: /Product/ })).toBeVisible();
  await collapseSidebar.click();
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Overview" })).toHaveAttribute("aria-current", "page");
});

test("demo controls communicate selected and temporary states", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  await page.goto("/demo");

  await page.getByRole("button", { name: "Date range: Last 30 days" }).click();
  await expect(page.getByRole("menuitemradio", { name: "Last 30 days" })).toBeChecked();
  await page.getByRole("menuitemradio", { name: "This quarter" }).click();
  await expect(page.getByRole("button", { name: "Date range: This quarter" })).toBeVisible();

  await page.getByRole("button", { name: "Refresh" }).click();
  await expect(page.getByRole("button", { name: "Refreshing…" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible({ timeout: 2_000 });
});

test("design catalogue renders real component states without axe violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  await page.goto("/design");
  await expect(page.getByRole("heading", { name: "Design system" })).toBeVisible();
  await page.getByRole("tab", { name: "Components" }).click();
  await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("design catalogue kit tab renders every shell component accessibly", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  await page.goto("/design");
  await page.getByRole("tab", { name: "Kit" }).click();
  // Spot-check the first and last registry entries actually rendered.
  await expect(page.getByText("kit/status-badge", { exact: true })).toBeVisible();
  await expect(page.getByText("kit/dashboard/time-series-chart", { exact: true })).toBeVisible();
  // Ensure the chart has mounted so axe evaluates its settled colours.
  await expect(page.locator('[role="tabpanel"] svg.recharts-surface').first()).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[role="tabpanel"]').analyze();
  expect(results.violations).toEqual([]);
});

test("design catalogue controls tab renders every control accessibly", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  await page.goto("/design");
  await page.getByRole("tab", { name: "Controls" }).click();
  await expect(page.getByRole("heading", { name: "Date & time" })).toBeVisible();
  // Controls carry accessible names (labels / aria-label), the crux of the a11y pass.
  await expect(page.getByRole("switch", { name: "Auto-archive" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Product updates" })).toBeVisible();
  await expect(page.getByRole("slider").first()).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[role="tabpanel"]').analyze();
  expect(results.violations).toEqual([]);
});

test("design catalogue messaging surfaces render accessibly with the banner collapse", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  await page.goto("/design");
  await page.getByRole("tab", { name: "Patterns" }).click();
  await expect(page.getByRole("heading", { name: "Messaging surfaces" })).toBeVisible();
  // Priority + collapse: the four-banner example shows only two plus an indicator.
  await expect(page.getByText("+2 more")).toBeVisible();
  const results = await new AxeBuilder({ page }).include('[role="tabpanel"]').analyze();
  expect(results.violations).toEqual([]);
});

test("design catalogue contrast section reports every pair as passing", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium");
  await page.goto("/design");
  await expect(page.getByRole("heading", { name: "Contrast checks" })).toBeVisible();
  // The live audit must not surface a failing pair in either theme.
  await expect(page.getByText("failing")).toHaveCount(0);
  expect(await page.getByText("All pairs pass").count()).toBeGreaterThanOrEqual(2);
});

test("design catalogue has no horizontal overflow at mobile width", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/design");
  await page.getByRole("tab", { name: "Kit" }).click();
  await expect(page.getByText("kit/data-table", { exact: true })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});
