import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import { enterState, homePages, openPage, pageStates } from "./pages.mts";

/** Every axe rule that maps to WCAG 2.0, 2.1 or 2.2 at level A or AA. */
const wcagAA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

type AxeResults = Awaited<ReturnType<AxeBuilder["analyze"]>>;

/** Lists each failing rule with the elements that break it. */
function summarize(violations: AxeResults["violations"]) {
	return violations.map((violation) => ({
		rule: violation.id,
		impact: violation.impact,
		help: violation.help,
		elements: violation.nodes.map((node) => ({
			element: node.target.join(" "),
			problem: node.failureSummary,
		})),
	}));
}

/**
 * Runs axe's WCAG A and AA rules on the page as it currently looks.
 * Results axe can't decide on its own (text over a photo, for example) are
 * attached to the report as "needs review"; contrast.spec.mts measures
 * those.
 */
async function audit(page: Page) {
	const { violations, incomplete } = await new AxeBuilder({ page })
		// Experimental, so off by default: checks that the page doesn't
		// lock itself to portrait or landscape (1.3.4 Orientation).
		.options({ rules: { "css-orientation-lock": { enabled: true } } })
		.withTags(wcagAA)
		.analyze();

	for (const result of incomplete) {
		test.info().annotations.push({
			type: "needs review",
			description: `${result.id}: ${result.nodes.map((node) => node.target.join(" ")).join(", ")}`,
		});
	}

	return summarize(violations);
}

for (const { language, path } of homePages) {
	test.describe(`${language} home page`, () => {
		test.beforeEach(async ({ page }) => {
			await openPage(page, path);
		});

		for (const state of pageStates) {
			test(state.name, async ({ page }) => {
				await enterState(page, state);
				expect(await audit(page)).toEqual([]);
			});
		}

		// Not required by WCAG, but these catch structural slips early: a
		// skipped heading level, content outside any landmark, and so on.
		test("follows axe's best practices", async ({ page }) => {
			const { violations } = await new AxeBuilder({ page })
				.withTags(["best-practice"])
				.analyze();
			expect(summarize(violations)).toEqual([]);
		});
	});
}
