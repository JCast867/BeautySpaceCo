import type { RouteObject } from "react-router";

import { Layout } from "../components/Layout.tsx";
import { Home } from "../pages/Home.tsx";
import { NotFound } from "../pages/NotFound.tsx";

/**
 * The same pages in both languages: English at /, Spanish under /es.
 * Netlify only knows about real files, so each page added here also needs
 * a rule in netlify.toml. src/tests/notFound.test.mts checks that they
 * match.
 */
const children: RouteObject[] = [
	{ index: true, Component: Home },
	// Any other address, like an old link or a typo.
	{ path: "*", Component: NotFound },
];

export const routes: RouteObject[] = [
	{
		path: "/",
		Component: Layout,
		children,
	},
	{
		path: "/es",
		Component: Layout,
		children,
	},
];
