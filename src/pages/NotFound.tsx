import { useEffect } from "react";
import { Link } from "react-router";

import photoSmall from "../assets/not-found-480.webp";
import photoMedium from "../assets/not-found-720.webp";
import photoLarge from "../assets/not-found-960.webp";
import photoExtraLarge from "../assets/not-found-1440.webp";
import { bookingLink } from "../config/site.ts";
import { homePaths, translations, useLanguage } from "../locales/language.ts";

/**
 * Shown for any address the site has no page for. In the photo, from the
 * same shoot as the rest of the site, the two of them read a mock
 * newspaper, so the page borrows that paper's masthead strip and the
 * issue number becomes the error code.
 */
export function NotFound() {
	const language = useLanguage();
	const text = translations[language];
	const page = text.notFound;
	usePageTitle(`${page.status} | Beauty Space Co`);

	return (
		<section
			aria-labelledby="not-found-heading"
			className="flex bg-primary py-12 text-espresso sm:py-16 md:min-h-[calc(100svh-6rem)] lg:min-h-[calc(100svh-7rem)] lg:py-10"
		>
			<div className="m-auto grid w-full max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-16 lg:px-16">
				<div className="@container">
					{/*
					 * The strip across the top of their paper, which reads
					 * "Vol. 1 No. 1". Where the column is too narrow for all
					 * three, the town drops out so the issue and the status
					 * can share one line.
					 */}
					<p className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-b-3 border-double border-espresso py-2.5 font-didone text-xs tracking-[0.18em] uppercase motion-safe:animate-print @md:text-[0.8125rem]">
						<span>{page.issue}</span>
						<span className="hidden @xl:block">
							{page.dateline}
						</span>
						<span>{page.status}</span>
					</p>

					<h1
						id="not-found-heading"
						className="mt-8 font-didone text-[clamp(2.25rem,11vw,4.5rem)] leading-none tracking-tight uppercase sm:mt-10 lg:text-[clamp(3.25rem,5.2vw,4.5rem)]"
					>
						<span
							className="block motion-safe:animate-rise"
							style={{ animationDelay: "250ms" }}
						>
							{page.headingFirst}
						</span>
						<span
							className="mt-[0.08em] block motion-safe:animate-rise"
							style={{ animationDelay: "380ms" }}
						>
							{page.headingSecond}
						</span>
					</h1>

					<p className="mt-6 max-w-md text-base/relaxed text-pretty text-espresso/80 sm:text-lg/relaxed">
						{page.description}
					</p>

					{/*
					 * Home keeps the visitor in their language. The arrow
					 * points back and nudges that way, the mirror of the
					 * hero's Book now.
					 */}
					<div className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-5">
						<Link
							to={homePaths[language]}
							className="group/home inline-flex min-h-14 items-center justify-center gap-4 bg-espresso px-8 py-4 text-sm font-semibold tracking-[0.2em] text-primary uppercase transition-colors duration-200 ease-out hover:bg-mocha focus-visible:bg-mocha focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-espresso active:bg-mocha motion-reduce:transition-none"
						>
							<span
								aria-hidden="true"
								className="text-xl leading-none transition-[translate] duration-200 ease-out motion-safe:group-hover/home:-translate-x-1 motion-safe:group-focus-visible/home:-translate-x-1 motion-safe:group-active/home:-translate-x-1 motion-reduce:transition-none"
							>
								&larr;
							</span>
							{page.home}
						</Link>
						<a
							href={bookingLink}
							className="rounded-sm py-2 font-didone text-lg underline decoration-espresso/35 decoration-1 underline-offset-8 transition-colors duration-300 ease-glide hover:decoration-espresso focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-espresso motion-reduce:transition-none"
						>
							{text.navigation.bookFull}
						</a>
					</div>
				</div>

				{/*
				 * After the text on phones, then a wider crop across tablets.
				 * From desktop it sits beside the text, and narrows on short
				 * laptop screens so the photo and its caption fit without
				 * scrolling.
				 */}
				<figure className="w-full lg:order-first lg:w-[clamp(18rem,calc((100svh-16rem)*6/7),min(31rem,37vw))]">
					<div className="relative">
						<img
							src={photoMedium}
							srcSet={`${photoSmall} 480w, ${photoMedium} 720w, ${photoLarge} 960w, ${photoExtraLarge} 1440w`}
							sizes="(min-width: 64rem) min(31rem, 37vw), (min-width: 40rem) calc(100vw - 4rem), calc(100vw - 2.5rem)"
							width={960}
							height={1120}
							alt={page.imageAlt}
							decoding="async"
							className="aspect-6/7 w-full object-cover sm:aspect-4/3 sm:object-top lg:aspect-6/7"
						/>
						{/* warms the grey studio backdrop, like the about section's photo */}
						<div
							aria-hidden="true"
							className="absolute inset-0 bg-[#f6ecdf] mix-blend-multiply"
						/>
					</div>
					<figcaption className="mt-4 font-didone text-[0.9375rem] text-espresso/80">
						{page.caption}
					</figcaption>
				</figure>
			</div>
		</section>
	);
}

/** Names the browser tab while this page is open, then gives the site's title back. */
function usePageTitle(title: string) {
	useEffect(() => {
		const siteTitle = document.title;
		document.title = title;
		return () => {
			document.title = siteTitle;
		};
	}, [title]);
}
