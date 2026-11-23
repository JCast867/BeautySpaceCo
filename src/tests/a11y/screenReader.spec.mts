import { expect, test } from "@playwright/test";

import { openPage, sitePages } from "./pages.mts";

for (const { name, outline, path, title } of sitePages) {
	test.describe(name, () => {
		test.beforeEach(async ({ page }) => {
			await openPage(page, path);
		});

		// WCAG 2.4.2 Page Titled: the tab says which page this is, and
		// it's the first thing a screen reader announces when it opens.
		test("has a title that names the page", async ({ page }) => {
			await expect(page).toHaveTitle(title);
		});

		// What a screen reader gets: every landmark, heading, link, button
		// and image, with the names it announces. The saved copy lives in
		// screenReader.spec.mts-snapshots/. When a change to the page is
		// intended, review the diff, then save the new version with
		// `pnpm run test:a11y --update-snapshots`.
		test("matches the saved screen reader outline", async ({
			page,
		}, testInfo) => {
			await expect(page.locator("body")).toMatchAriaSnapshot({
				name: `${outline}-${testInfo.project.name}.aria.yml`,
			});
		});
	});
}
