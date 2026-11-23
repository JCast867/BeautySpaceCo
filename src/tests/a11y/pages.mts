import type { Locator, Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

type SitePage = {
	/** Names the page in test titles. */
	name: string;
	/** Starts the file name of its saved screen reader outline. */
	outline: string;
	path: string;
	/** What the browser tab says, the first thing a screen reader announces. */
	title: string | RegExp;
	/**
	 * Whether to also test the header's and footer's menus open here.
	 * They're the same on every page, so the home pages cover them.
	 */
	opensMenus: boolean;
};

/** Every page the site publishes, in each language. */
export const sitePages: readonly SitePage[] = [
	{
		name: "English home page",
		outline: "english",
		path: "/",
		// Loose, so a more descriptive title for search results still passes.
		title: /Beauty ?Space ?Co/u,
		opensMenus: true,
	},
	{
		name: "Spanish home page",
		outline: "spanish",
		path: "/es",
		title: /Beauty ?Space ?Co/u,
		opensMenus: true,
	},
	// Any address without a page of its own, like an old link or a typo.
	{
		name: "English not-found page",
		outline: "english-not-found",
		path: "/this-page-does-not-exist",
		title: "Page not found | Beauty Space Co",
		opensMenus: false,
	},
	{
		name: "Spanish not-found page",
		outline: "spanish-not-found",
		path: "/es/esta-pagina-no-existe",
		title: "Página no encontrada | Beauty Space Co",
		opensMenus: false,
	},
];

/** Requests for the site's web fonts, which come from Google Fonts. */
export const googleFonts = /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//u;

type CachedResponse = {
	status: number;
	headers: Record<string, string>;
	body: Buffer;
};

/** Font responses already downloaded by this test worker, by URL. */
const fontCache = new Map<string, CachedResponse>();

/**
 * Every test opens a fresh browser, so without this each one downloads
 * the fonts again. Hundreds of downloads in a row occasionally stall for
 * minutes, failing whichever test was waiting. This downloads each font
 * once per test worker and serves it from memory after that.
 */
async function serveFontsFromCache(page: Page) {
	await page.route(googleFonts, async (route) => {
		const url = route.request().url();
		let cached = fontCache.get(url);
		if (cached === undefined) {
			const response = await route.fetch();
			// The body comes back already decompressed, so drop the headers
			// that describe the compressed original.
			const headers = Object.fromEntries(
				Object.entries(response.headers()).filter(
					([name]) =>
						!["content-encoding", "content-length"].includes(name),
				),
			);
			cached = {
				status: response.status(),
				headers,
				body: await response.body(),
			};
			if (response.ok()) {
				fontCache.set(url, cached);
			}
		}
		await route.fulfill(cached);
	});
}

/**
 * Opens a page and waits until it has fully rendered. The web fonts are
 * awaited too: they finish after the page's load event, and until they
 * do, a wider fallback font changes the layout.
 */
export async function openPage(page: Page, path: string) {
	await serveFontsFromCache(page);
	await page.goto(path);
	await page.getByRole("contentinfo").waitFor();
	await page.evaluate(async () => {
		await document.fonts.ready;
	});
}

type PageState = {
	name: string;
	/** The button that opens this state; none for the page at rest. */
	trigger?: (page: Page) => Locator;
	/** Why that button can be missing at some screen sizes. */
	missingBecause?: string;
};

/** The page with nothing open, then with each menu or card open in turn. */
export const pageStates: readonly PageState[] = [
	{ name: "at rest" },
	{
		name: "with the mobile menu open",
		trigger: (page) => page.locator('[aria-controls="mobile-menu"]'),
		missingBecause: "The menu button only shows on small screens.",
	},
	{
		name: "with a header social card open",
		trigger: (page) =>
			page
				.getByRole("banner")
				.getByRole("button", { name: "Instagram", exact: false }),
		missingBecause: "The header's social icons hide on small screens.",
	},
	{
		name: "with a footer social card open",
		trigger: (page) =>
			page
				.getByRole("contentinfo")
				.getByRole("button", { name: "Instagram", exact: false }),
	},
];

/** The states to test a page in: only at rest, unless it tests the menus too. */
export function statesFor({ opensMenus }: SitePage) {
	return opensMenus
		? pageStates
		: pageStates.filter((state) => state.trigger === undefined);
}

/**
 * Puts the page into a state, skipping the test when this screen size
 * doesn't show the button for it. Opens it from the keyboard, which works
 * in every browser: Playwright's WebKit misplaces mouse clicks on macOS 26,
 * so a click would miss.
 */
export async function enterState(page: Page, state: PageState) {
	if (state.trigger === undefined) {
		return;
	}
	const trigger = state.trigger(page);
	test.skip(!(await trigger.isVisible()), state.missingBecause);
	await trigger.focus();
	await page.keyboard.press("Enter");
	await expect(trigger).toHaveAttribute("aria-expanded", "true");
}
