import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { expect, test } from "vitest";

import { getNavigation } from "../locales/navigation.ts";
import { Home } from "../pages/Home.tsx";

/**
 * The inside of the about section's list of studios. The photo's alt text
 * names both studios too, so a check of the whole page could pass even if
 * the list were empty.
 */
function aboutList(html: string) {
	const about =
		/<section id="about"[^>]*>(.*?)<\/section>/su.exec(html)?.[1] ?? "";
	return /<ul\b[^>]*>(.*?)<\/ul>/su.exec(about)?.[1] ?? "";
}

test.each([
	{
		path: "/",
		language: "en",
		first: "Two girls.",
		second: "Same vision.",
		alt: "The two estheticians behind Bare Skin Co and Cherry Glow Studio, standing back to back",
	},
	{
		path: "/es",
		language: "es",
		first: "Dos chicas.",
		second: "Una misma visión.",
		alt: "Las dos esteticistas detrás de Bare Skin Co y Cherry Glow Studio, espalda con espalda",
	},
] as const)(
	"homepage at $path has a translated about section the About link can reach",
	({ path, language, first, second, alt }) => {
		const html = renderToStaticMarkup(
			createElement(
				MemoryRouter,
				{ initialEntries: [path] },
				createElement(Home),
			),
		);
		const aboutLink = getNavigation(language).find(
			({ to }) => to === "#about",
		);
		expect(aboutLink).toBeDefined();
		expect(html).toContain('id="about"');
		expect(html).toContain(`>${first}</span>`);
		expect(html).toContain(`>${second}</span>`);
		expect(html).toContain(`alt="${alt}"`);
		// The studios' names stay plain text until each has a page of its
		// own, so nothing links to an address that doesn't exist yet.
		const list = aboutList(html);
		expect(
			Array.from(
				list.matchAll(/<li\b[^>]*>(.*?)<\/li>/gsu),
				([, name = ""]) => name,
			),
		).toEqual(["Bare Skin Co", "Cherry Glow Studio"]);
		expect(list).not.toMatch(/<a\b/u);
	},
);
