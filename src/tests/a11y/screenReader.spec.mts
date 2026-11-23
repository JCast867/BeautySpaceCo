import { expect, test } from "@playwright/test";

import { homePages, openPage } from "./pages.mts";

for (const { language, path } of homePages) {
	test.describe(`${language} home page`, () => {
		test.beforeEach(async ({ page }) => {
			await openPage(page, path);
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
				name: `${language.toLowerCase()}-${testInfo.project.name}.aria.yml`,
			});
		});
	});
}
