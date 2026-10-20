import { expect, test } from "@playwright/test";

test("home screen answers in English and switches to Hebrew right to left", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  await expect(page.getByRole("heading", { name: "Perkly" })).toBeVisible();
  await expect(page.getByText("Perkly does not charge the purchase.")).toBeVisible();
  await expect(page.getByText("The local server is responding.")).toBeVisible();
  await expect(page.getByRole("button", { name: /checkout|pay now/i })).toHaveCount(0);

  await page.getByRole("button", { name: "עברית" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "he");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.getByText("מסד הנתונים הוא המשימה הבאה.")).toBeVisible();
  await expect(page.getByText("השרת המקומי עונה.")).toBeVisible();
});
