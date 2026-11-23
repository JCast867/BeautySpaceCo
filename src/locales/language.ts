import { useMatch } from "react-router";

import en from "./en.json";
import es from "./es.json";

export type Language = "en" | "es";

export function useLanguage(): Language {
	return useMatch("/es/*") ? "es" : "en";
}

/** Each language's home page; every other page in it lives under this. */
export const homePaths = {
	en: "/",
	es: "/es",
} satisfies Record<Language, string>;

export const translations = {
	en,
	es,
} satisfies Record<Language, typeof en>;
