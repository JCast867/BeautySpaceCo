/* oxlint-disable no-await-in-loop -- each element is scrolled to and photographed in turn */
import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { openPage, sitePages } from "./pages.mts";

/**
 * Finds the lowest contrast between the text color and any pixel of a
 * screenshot of what sits behind the text. Runs in the browser, which
 * decodes the image and converts any CSS color to plain RGB.
 */
async function lowestContrast({ png, color }: { png: string; color: string }) {
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (context === null) {
		throw new Error("No 2D canvas available.");
	}

	context.fillStyle = color;
	context.fillRect(0, 0, 1, 1);
	const [red = 0, green = 0, blue = 0, alpha = 255] = context.getImageData(
		0,
		0,
		1,
		1,
	).data;
	const opacity = alpha / 255;

	const image = new Image();
	image.src = `data:image/png;base64,${png}`;
	await image.decode();
	canvas.width = image.width;
	canvas.height = image.height;
	context.drawImage(image, 0, 0);
	const pixels = context.getImageData(0, 0, image.width, image.height).data;

	/** Relative luminance, as WCAG defines it. */
	// Has to live in here: page.evaluate only sends this one function to
	// the browser, not anything around it.
	// oxlint-disable-next-line unicorn/consistent-function-scoping
	function luminance(r: number, g: number, b: number) {
		const [linearR = 0, linearG = 0, linearB = 0] = [r, g, b].map(
			(channel) => {
				const value = channel / 255;
				return value <= 0.039_28
					? value / 12.92
					: ((value + 0.055) / 1.055) ** 2.4;
			},
		);
		return 0.2126 * linearR + 0.7152 * linearG + 0.0722 * linearB;
	}

	// Skip a 2px border, where the screenshot can catch a sliver of
	// whatever sits next to the element.
	const border = 2;
	let lowest = Number.POSITIVE_INFINITY;
	for (let y = border; y < image.height - border; y += 1) {
		for (let x = border; x < image.width - border; x += 1) {
			const index = (y * image.width + x) * 4;
			const backR = pixels[index] ?? 0;
			const backG = pixels[index + 1] ?? 0;
			const backB = pixels[index + 2] ?? 0;
			// Semi-transparent text blends with the pixel behind it.
			const text = luminance(
				red * opacity + backR * (1 - opacity),
				green * opacity + backG * (1 - opacity),
				blue * opacity + backB * (1 - opacity),
			);
			const back = luminance(backR, backG, backB);
			const ratio =
				(Math.max(text, back) + 0.05) / (Math.min(text, back) + 0.05);
			lowest = Math.min(lowest, ratio);
		}
	}
	return lowest;
}

for (const { name, path } of sitePages) {
	test.describe(name, () => {
		test.beforeEach(async ({ page }) => {
			await openPage(page, path);
		});

		// WCAG 1.4.3 Contrast (Minimum). axe can't judge text over a photo,
		// so it hands those elements back as "needs review". This measures
		// them instead: hide the text, photograph what's behind it, and
		// check the text color against every pixel, darkest to lightest.
		test("text over photos has enough contrast", async ({ page }) => {
			const { incomplete } = await new AxeBuilder({ page })
				.withRules(["color-contrast"])
				.analyze();
			const selectors = incomplete.flatMap((result) =>
				result.nodes.map((node) => node.target.join(" ")),
			);

			const texts = [];
			for (const selector of selectors) {
				const element = page.locator(selector);
				texts.push({
					element,
					...(await element.evaluate((node) => {
						const style = getComputedStyle(node);
						const size = Number(style.fontSize.replace("px", ""));
						const isBold = Number(style.fontWeight) >= 700;
						return {
							text: node.textContent.trim().slice(0, 60),
							color: style.color,
							// Large text (24px, or 18.66px bold) only needs 3:1.
							needs:
								size >= 24 || (isBold && size >= 18.66)
									? 3
									: 4.5,
						};
					})),
				});
			}

			// Hide all of the text first, so no element's letters end up in
			// another element's photo.
			await page.addStyleTag({
				content: selectors
					.map(
						(selector) =>
							`${selector}, ${selector} * { color: transparent !important; text-decoration-color: transparent !important; }`,
					)
					.join("\n"),
			});

			const tooFaint = [];
			for (const { element, text, color, needs } of texts) {
				// Centered, so the fixed header can't cover any of it.
				await element.evaluate((node) => {
					node.scrollIntoView({
						block: "center",
						behavior: "instant",
					});
				});
				const png = await element.screenshot({
					animations: "disabled",
					scale: "css",
				});
				const lowest = await page.evaluate(lowestContrast, {
					png: png.toString("base64"),
					color,
				});
				test.info().annotations.push({
					type: "contrast",
					description: `"${text}": lowest ${lowest.toFixed(2)}:1, needs ${String(needs)}:1`,
				});
				if (lowest < needs) {
					tooFaint.push({ text, needs, lowest: lowest.toFixed(2) });
				}
			}

			expect(tooFaint).toEqual([]);
		});
	});
}
