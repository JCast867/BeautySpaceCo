import { expect, test } from "@playwright/test";

import {
	enterState,
	googleFonts,
	openPage,
	sitePages,
	statesFor,
} from "./pages.mts";

/**
 * Lists visible text that doesn't fit: text running past the edge of the
 * screen, or cut off by a box that hides its overflow. Decorative text
 * (aria-hidden) and closed menus (inert) are skipped. Runs in the browser.
 */
function findCutOffText() {
	const screenWidth = document.documentElement.clientWidth;
	const problems: string[] = [];
	const walker = document.createTreeWalker(
		document.body,
		NodeFilter.SHOW_TEXT,
	);

	for (
		let node = walker.nextNode();
		node !== null;
		node = walker.nextNode()
	) {
		const text = node.textContent?.trim() ?? "";
		const parent = node.parentElement;
		const isShown =
			text !== "" &&
			parent?.closest('[inert], [aria-hidden="true"]') === null &&
			parent.checkVisibility({ visibilityProperty: true });

		if (isShown) {
			const range = document.createRange();
			range.selectNodeContents(node);
			const rect = range.getBoundingClientRect();
			const pastEdge = Math.max(-rect.left, rect.right - screenWidth);
			let cutBy = 0;

			for (
				let box: HTMLElement | null = parent;
				box !== null && box !== document.body && cutBy <= 1;
				box = box.parentElement
			) {
				const style = getComputedStyle(box);
				const clipsX = ["hidden", "clip"].includes(style.overflowX);
				const clipsY = ["hidden", "clip"].includes(style.overflowY);
				const edges = box.getBoundingClientRect();
				const left = edges.left + box.clientLeft;
				const top = edges.top + box.clientTop;
				cutBy = Math.max(
					clipsX ? left - rect.left : 0,
					clipsX ? rect.right - (left + box.clientWidth) : 0,
					clipsY ? top - rect.top : 0,
					clipsY ? rect.bottom - (top + box.clientHeight) : 0,
				);
			}

			if (pastEdge > 1) {
				problems.push(
					`"${text}" runs ${String(Math.round(pastEdge))}px past the edge of the screen`,
				);
			} else if (cutBy > 1) {
				problems.push(
					`"${text}" is cut off by ${String(Math.round(cutBy))}px`,
				);
			}
		}
	}

	return problems;
}

/** How far the page scrolls sideways, in pixels. */
function sidewaysScroll() {
	// clientWidth, not innerWidth: mobile emulation widens innerWidth to fit
	// overflowing content, which would hide the problem.
	const root = document.documentElement;
	return root.scrollWidth - root.clientWidth;
}

for (const sitePage of sitePages) {
	const { name, path } = sitePage;
	test.describe(name, () => {
		for (const state of statesFor(sitePage)) {
			test.describe(state.name, () => {
				test.beforeEach(async ({ page }) => {
					await openPage(page, path);
				});

				// WCAG 1.4.10 Reflow: 320px wide is a 1280px screen zoomed
				// to 400%.
				test("fits 320px without sideways scrolling", async ({
					page,
				}) => {
					await page.setViewportSize({ width: 320, height: 640 });
					await enterState(page, state);
					expect(
						await page.evaluate(sidewaysScroll),
					).toBeLessThanOrEqual(0);
					expect(await page.evaluate(findCutOffText)).toEqual([]);
				});

				// WCAG 1.4.12 Text Spacing: people who need more space
				// between letters, words and lines override it with their
				// own stylesheet. These are the largest values the criterion
				// requires to still work.
				test("text spacing can be increased without cutting anything off", async ({
					page,
				}) => {
					await enterState(page, state);
					await page.addStyleTag({
						content: `
							* {
								line-height: 1.5 !important;
								letter-spacing: 0.12em !important;
								word-spacing: 0.16em !important;
							}
							p { margin-bottom: 2em !important; }
						`,
					});
					expect(await page.evaluate(findCutOffText)).toEqual([]);
				});
			});
		}

		// Not a WCAG criterion, but a real situation: some networks block
		// Google Fonts, and the wider fallback fonts used to push the
		// names in the about section off the screen.
		test("still fits when the web fonts fail to load", async ({ page }) => {
			await page.route(googleFonts, (route) => route.abort());
			await page.goto(path);
			await page.getByRole("contentinfo").waitFor();
			expect(await page.evaluate(findCutOffText)).toEqual([]);
			await page.setViewportSize({ width: 320, height: 640 });
			expect(await page.evaluate(sidewaysScroll)).toBeLessThanOrEqual(0);
			expect(await page.evaluate(findCutOffText)).toEqual([]);
		});
	});
}
