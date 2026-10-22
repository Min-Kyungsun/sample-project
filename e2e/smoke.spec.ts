import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 육하원칙 입력 칸이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("나의 글쓰기 책");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("나의 글쓰기 책");
  await expect(page.getByLabel("누가")).toBeVisible();
});
