import { defineConfig, devices } from "@playwright/test";

const port = 4173;
const baseURL = `http://localhost:${String(port)}`;
const isCI = process.env["CI"] !== undefined;

// Accessibility audits run against the production build in a real browser,
// because checks like color contrast need the final computed styles.
export default defineConfig({
	testDir: "./src/tests/a11y",
	testMatch: "*.spec.mts",
	forbidOnly: isCI,
	// The HTML report shows each failure with a screenshot. Open it with
	// `pnpm exec playwright show-report`.
	reporter: isCI ? "list" : [["list"], ["html", { open: "never" }]],
	use: {
		baseURL,
		locale: "en-US",
		// Transitions finish instantly, so audits see menus fully open.
		reducedMotion: "reduce",
		screenshot: { mode: "only-on-failure", fullPage: true },
	},
	// Chrome and Safari, on a computer, a phone held both ways (WCAG 1.3.4
	// Orientation: the fixed header takes up more of a short screen) and an
	// iPad. Safari's engine, WebKit, is what every iPhone browser uses.
	// Install both browsers once with
	// `pnpm exec playwright install chromium webkit`.
	projects: [
		{ name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
		{ name: "android", use: { ...devices["Pixel 7"] } },
		{
			name: "android-landscape",
			use: { ...devices["Pixel 7 landscape"] },
		},
		{ name: "desktop-safari", use: { ...devices["Desktop Safari"] } },
		// 390px wide: the iPhone 12 to 14 and the 16e and 17e.
		{ name: "iphone", use: { ...devices["iPhone 17e"] } },
		{
			name: "iphone-landscape",
			use: { ...devices["iPhone 17e landscape"] },
		},
		// Exactly the 768px breakpoint where the full header appears, so
		// it's the tightest fit for the header.
		{ name: "ipad", use: { ...devices["iPad Mini"] } },
		// 1024px: where the about section splits into two columns, the
		// tightest fit for the names beside the photo.
		{ name: "ipad-landscape", use: { ...devices["iPad Mini landscape"] } },
	],
	webServer: {
		command: `vite build && vite preview --port ${String(port)} --strictPort`,
		url: baseURL,
		reuseExistingServer: !isCI,
	},
});
