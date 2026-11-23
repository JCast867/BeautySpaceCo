/* oxlint-disable no-await-in-loop -- each key press depends on where the last one left focus */
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { homePages, openPage } from "./pages.mts";

/**
 * The key that moves focus to the next link or button. Safari's Tab only
 * visits form fields unless "Press Tab to highlight each item" is turned
 * on, so its keyboard users press Option+Tab instead, and WebKit here
 * behaves the same way.
 */
function nextKey(browserName: string) {
	return browserName === "webkit" ? "Alt+Tab" : "Tab";
}

/**
 * Presses Tab from the top of the page until focus comes back around,
 * marking each element it lands on with data-tabbed, and describes each
 * stop: whether it shows a focus outline, and whether it sits entirely
 * under the fixed header bar.
 */
async function tabThroughPage(page: Page, key: string) {
	const stops = [];
	for (;;) {
		await page.keyboard.press(key);
		const stop = await page.evaluate(() => {
			const element = document.activeElement;
			if (
				!(element instanceof HTMLElement) ||
				element === document.body ||
				element.dataset["tabbed"] === "true"
			) {
				return null;
			}
			element.dataset["tabbed"] = "true";
			const bar = document.querySelector("header > div");
			const barBottom = bar?.getBoundingClientRect().bottom ?? 0;
			const style = getComputedStyle(element);
			return {
				element: element.outerHTML.slice(0, 120),
				hasOutline:
					style.outlineStyle !== "none" &&
					style.outlineWidth !== "0px",
				isHidden:
					element.closest("header") === null &&
					element.getBoundingClientRect().bottom <= barBottom,
			};
		});
		if (stop === null) {
			return stops;
		}
		stops.push(stop);
	}
}

/** Lists the controls a keyboard user can see but Tab never landed on. */
function findUnreached() {
	const controls = document.querySelectorAll<HTMLElement>(
		'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
	);
	return [...controls]
		.filter(
			(control) =>
				control.closest("[inert]") === null &&
				control.checkVisibility({ visibilityProperty: true }) &&
				control.dataset["tabbed"] !== "true",
		)
		.map((control) => control.outerHTML.slice(0, 120));
}

for (const { language, path } of homePages) {
	test.describe(`${language} home page`, () => {
		test.beforeEach(async ({ page }) => {
			await openPage(page, path);
		});

		// WCAG 2.1.1 Keyboard and 2.1.2 No Keyboard Trap: Tab has to reach
		// every control and come back around. 3.2.1 On Focus: just landing
		// on something must not navigate away or open anything.
		test("Tab reaches every control without getting stuck", async ({
			page,
			browserName,
		}) => {
			const url = page.url();
			const stops = await tabThroughPage(page, nextKey(browserName));
			expect(stops.length).toBeGreaterThan(0);
			expect(await page.evaluate(findUnreached)).toEqual([]);
			expect(page.url()).toBe(url);
			await expect(page.locator('[aria-expanded="true"]')).toHaveCount(0);
		});

		// WCAG 2.4.7 Focus Visible and 2.4.11 Focus Not Obscured: every stop
		// needs an outline and must not sit entirely under the fixed header.
		test("every keyboard stop is visible", async ({
			page,
			browserName,
		}) => {
			const stops = await tabThroughPage(page, nextKey(browserName));
			expect(stops.length).toBeGreaterThan(0);
			expect(
				stops.filter((stop) => !stop.hasOutline || stop.isHidden),
			).toEqual([]);
		});

		// WCAG 2.1.1 Keyboard, 2.4.3 Focus Order and 4.1.2 Name, Role, Value:
		// Enter opens the menu and says so, Tab stays in the menu instead of
		// wandering into the page behind it, and Escape closes it and puts
		// focus back on the button.
		test("the mobile menu works with the keyboard", async ({
			page,
			browserName,
		}) => {
			const button = page.locator('[aria-controls="mobile-menu"]');
			test.skip(
				!(await button.isVisible()),
				"The menu button only shows on small screens.",
			);
			const menu = page.locator("#mobile-menu");

			await button.focus();
			await page.keyboard.press("Enter");
			await expect(button).toHaveAttribute("aria-expanded", "true");
			await expect(menu).toBeVisible();

			// Enough presses to go around the open menu more than once.
			const places = [];
			for (let press = 0; press < 25; press += 1) {
				await page.keyboard.press(nextKey(browserName));
				places.push(
					await page.evaluate(() => {
						const element = document.activeElement;
						if (element === null || element === document.body) {
							return "browser";
						}
						if (element.closest("#mobile-menu") !== null) {
							return "menu";
						}
						return element.closest("header") === null
							? "page behind the menu"
							: "header";
					}),
				);
			}
			expect(places).toContain("menu");
			expect(places).not.toContain("page behind the menu");

			await page.keyboard.press("Escape");
			await expect(button).toHaveAttribute("aria-expanded", "false");
			await expect(button).toBeFocused();
			await expect(menu).toBeHidden();
		});

		for (const { place, landmark } of [
			{ place: "header", landmark: "banner" },
			{ place: "footer", landmark: "contentinfo" },
		] as const) {
			// Same criteria as the mobile menu, for each platform's card.
			// Both Enter and Space open a button.
			test(`the ${place}'s social cards work with the keyboard`, async ({
				page,
				browserName,
			}) => {
				const triggers = await page
					.getByRole(landmark)
					.locator(
						'button[aria-controls]:not([aria-controls="mobile-menu"])',
					)
					.all();
				test.skip(
					!(await triggers[0]?.isVisible()),
					"The header's social icons hide on small screens.",
				);

				for (const trigger of triggers) {
					const cardId = await trigger.getAttribute("aria-controls");
					const firstLink = page
						.locator(`[id="${cardId ?? ""}"]`)
						.getByRole("link")
						.first();

					for (const key of ["Enter", "Space"]) {
						await trigger.focus();
						await page.keyboard.press(key);
						await expect(trigger).toHaveAttribute(
							"aria-expanded",
							"true",
						);

						await page.keyboard.press(nextKey(browserName));
						await expect(firstLink).toBeFocused();

						await page.keyboard.press("Escape");
						await expect(trigger).toHaveAttribute(
							"aria-expanded",
							"false",
						);
						await expect(trigger).toBeFocused();
					}
				}
			});
		}
	});
}
