import { test, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const SHOT_DIR = join(__dirname, "screenshots");
mkdirSync(SHOT_DIR, { recursive: true });

const TEAM_NAMES = [
  "Couch Coaches",
  "Goon Squad",
  "Top Shelf",
  "Pocket Protectors",
  "Field Goals",
  "Hash Bros",
  "Audible Disasters",
  "Red Zone Refugees",
  "Punt Patrol",
  "End Zone Bandits",
];

async function shot(page: import("@playwright/test").Page, name: string) {
  await page.screenshot({
    path: join(SHOT_DIR, `${name}.png`),
    fullPage: false,
  });
}

test("schedules a draft and runs it end-to-end with screenshots", async ({
  page,
  request,
  baseURL,
}) => {
  const scheduledFor = new Date(Date.now() + 5_000).toISOString();

  const create = await request.post(`${baseURL}/api/drafts`, {
    data: {
      leagueName: `E2E Test ${Date.now()}`,
      creatorName: "Playwright",
      scheduledFor,
      teams: TEAM_NAMES.map((name, i) => ({
        name,
        ownerName: `Owner ${i + 1}`,
      })),
    },
  });
  expect(create.ok()).toBeTruthy();
  const { slug } = await create.json();
  expect(slug).toBeTruthy();

  page.on("pageerror", (err) => console.log("[browser-error]", err.message));
  await page.goto(`/d/${slug}`);

  // Pre-draft: scheduled state with countdown
  await expect(page.getByTestId("status-pill")).toHaveAttribute(
    "data-status",
    "SCHEDULED",
  );
  await expect(page.getByText("Drawing in")).toBeVisible();
  await shot(page, "01-scheduled");

  // Wait until draft time, immediately should hit "starting now" or first spinner
  await expect
    .poll(
      async () => {
        const pill = await page
          .getByTestId("status-pill")
          .getAttribute("data-status");
        const startingNow = await page
          .getByText("Your draft is starting now")
          .isVisible()
          .catch(() => false);
        const spinner = await page
          .getByTestId("reel-spinner")
          .isVisible()
          .catch(() => false);
        return { pill, startingNow, spinner };
      },
      { timeout: 15_000, intervals: [200, 300, 500] },
    )
    .toMatchObject({ pill: expect.stringMatching(/SCHEDULED|DRAWING/) });

  // Capture starting/spinner state
  const spinnerVisibleEarly = await page
    .getByTestId("reel-spinner")
    .isVisible()
    .catch(() => false);
  if (!spinnerVisibleEarly) {
    await shot(page, "02-starting-now");
  }

  // Wait for first spinner
  await expect(page.getByTestId("reel-spinner")).toBeVisible({ timeout: 10_000 });
  // Reverse-reveal: first pick to draft is the highest pick number
  await expect(page.getByTestId("reel-spinner")).toHaveAttribute(
    "data-spin-pick",
    String(TEAM_NAMES.length),
  );
  await shot(page, "03-spinner-pick-10");

  // Wait for first reveal landing
  await expect
    .poll(
      async () => {
        const list = page.getByTestId("revealed-list");
        if (!(await list.isVisible().catch(() => false))) return 0;
        const c = await list.getAttribute("data-count");
        return Number(c ?? 0);
      },
      { timeout: 10_000, intervals: [200, 300, 500] },
    )
    .toBeGreaterThanOrEqual(1);
  await shot(page, "04-first-pick-revealed");

  // Wait for a mid-draft state (~5 picks revealed)
  await expect
    .poll(
      async () =>
        Number(
          (await page
            .getByTestId("revealed-list")
            .getAttribute("data-count")) ?? 0,
        ),
      { timeout: 30_000, intervals: [300, 500, 1000] },
    )
    .toBeGreaterThanOrEqual(5);
  await shot(page, "05-mid-draft");

  // Wait for completion
  await expect(page.getByTestId("status-pill")).toHaveAttribute(
    "data-status",
    "COMPLETED",
    { timeout: 30_000 },
  );
  await expect(page.getByTestId("revealed-list")).toHaveAttribute(
    "data-count",
    String(TEAM_NAMES.length),
  );
  await expect(page.getByText("Final draft order")).toBeVisible();
  await shot(page, "06-completed");
});
