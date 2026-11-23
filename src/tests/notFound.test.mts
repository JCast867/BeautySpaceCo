import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { RouteObject } from "react-router";
import { MemoryRouter, matchRoutes } from "react-router";
import { expect, test } from "vitest";

import { readFileSync } from "node:fs";

import { bookingLink } from "../config/site.ts";
import { homePaths } from "../locales/language.ts";
import { Home } from "../pages/Home.tsx";
import { NotFound } from "../pages/NotFound.tsx";
import { routes } from "../routes/routes.ts";

/** The page component the site shows at an address. */
function pageAt(path: string) {
	return matchRoutes(routes, path)?.at(-1)?.route.Component;
}

/** Every address the app has a page for, like /es. Catch-alls aren't pages. */
function pagePaths(branch: readonly RouteObject[], parent = ""): string[] {
	return branch.flatMap((route) => {
		if (route.index === true) {
			return [parent === "" ? "/" : parent];
		}
		if (route.path === undefined || route.path.includes("*")) {
			return [];
		}
		const path = `${parent}/${route.path}`
			.replaceAll(/\/+/gu, "/")
			.replace(/(.)\/$/u, "$1");
		return route.children === undefined
			? [path]
			: pagePaths(route.children, path);
	});
}

type Redirect = {
	from: string;
	to: string;
	status: number;
};

/** The [[redirects]] rules in netlify.toml, in the order Netlify tries them. */
function netlifyRedirects(): Redirect[] {
	const toml = readFileSync(
		new URL("../../netlify.toml", import.meta.url),
		"utf8",
	);
	return toml
		.split(/^(?=\[)/mu)
		.filter((table) => table.startsWith("[[redirects]]"))
		.map((table) => ({
			from: /^\s*from\s*=\s*"([^"]*)"/mu.exec(table)?.[1] ?? "",
			to: /^\s*to\s*=\s*"([^"]*)"/mu.exec(table)?.[1] ?? "",
			status: Number(/^\s*status\s*=\s*(\d+)/mu.exec(table)?.[1]),
		}));
}

function render(path: string) {
	return renderToStaticMarkup(
		createElement(
			MemoryRouter,
			{ initialEntries: [path] },
			createElement(NotFound),
		),
	);
}

/** Each link's address and the name a screen reader announces for it. */
function links(html: string) {
	return Array.from(
		html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gu),
		([, href = "", inner = ""]) => ({
			href,
			name: inner
				.replaceAll(/<span aria-hidden="true".*?<\/span>/gu, "")
				.replaceAll(/<[^>]*>/gu, ""),
		}),
	);
}

// Where the not-found page's home links lead, with or without a trailing slash.
for (const path of [...Object.values(homePaths), "/es/"]) {
	test(`${path} shows the home page`, () => {
		expect(pageAt(path)).toBe(Home);
	});
}

// Typos and old links in both languages. /services and /es/services used
// to be empty placeholder pages.
for (const path of [
	"/missing-page",
	"/services",
	"/essential",
	"/es/services",
	"/es/pagina/perdida",
]) {
	test(`${path} shows the not-found page`, () => {
		expect(pageAt(path)).toBe(NotFound);
	});
}

test.each([
	{
		path: "/missing-page",
		strip: ["Vol. 1 No. 404", "East Dundee, IL", "Page not found"],
		first: "Wrong page.",
		second: "Right place.",
		links: [
			{ href: "/", name: "Back to home" },
			{ href: bookingLink, name: "Book now" },
		],
		alt: "The two estheticians behind Bare Skin Co and Cherry Glow Studio, reading a newspaper together",
		caption: "We checked every page.",
	},
	{
		path: "/es/pagina-perdida",
		strip: ["Vol. 1 Núm. 404", "East Dundee, IL", "Página no encontrada"],
		first: "Página equivocada.",
		second: "Lugar correcto.",
		links: [
			{ href: "/es", name: "Volver al inicio" },
			{ href: bookingLink, name: "Reservar cita" },
		],
		alt: "Las dos esteticistas detrás de Bare Skin Co y Cherry Glow Studio, leyendo juntas un periódico",
		caption: "Revisamos cada página.",
	},
])(
	"not-found page at $path is translated and keeps the way home in its language",
	({ path, strip, first, second, links: expected, alt, caption }) => {
		const html = render(path);
		for (const part of strip) {
			expect(html).toContain(`>${part}</span>`);
		}
		expect(html).toMatch(
			new RegExp(
				`<h1 id="not-found-heading"[^>]*><span[^>]*>${first}</span><span[^>]*>${second}</span></h1>`,
				"u",
			),
		);
		expect(links(html)).toEqual(expected);
		expect(html).toContain(`alt="${alt}"`);
		expect(html).toContain(`>${caption}</figcaption>`);
	},
);

// Netlify only knows about files, so the app's pages and its redirect rules
// have to agree. A page without a rule would load with a 404 status, and
// search engines would never list it.
test("netlify.toml loads every page with a 200 status and anything else with a 404", () => {
	const rules = netlifyRedirects();
	// / is index.html itself, so Netlify serves it without a rule.
	const pages = pagePaths(routes).filter((path) => path !== "/");
	expect(
		rules
			.filter(({ status }) => status === 200)
			.map(({ from }) => from)
			.toSorted(),
	).toEqual(pages.toSorted());
	expect(rules.map(({ to }) => to)).toEqual(rules.map(() => "/index.html"));
	// Netlify uses the first rule that matches, so the catch-all goes last.
	expect(rules.at(-1)).toEqual({
		from: "/*",
		to: "/index.html",
		status: 404,
	});
});
