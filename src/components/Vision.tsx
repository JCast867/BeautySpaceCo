import visionSmall from "../assets/vision-640.webp";
import visionMedium from "../assets/vision-960.webp";
import visionLarge from "../assets/vision-1280.webp";
import visionExtraLarge from "../assets/vision-1920.webp";
import { translations, useLanguage } from "../locales/language.ts";

export function Vision() {
	const text = translations[useLanguage()].vision;

	return (
		<section
			id="about"
			aria-labelledby="vision-heading"
			className="scroll-mt-28 bg-espresso py-12 text-primary sm:py-16"
		>
			<div className="mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-16">
				{/* steps slightly past the page margin, like the mockup */}
				<div className="relative lg:-ml-8 lg:w-[calc(100%+2rem)]">
					<img
						src={visionMedium}
						srcSet={`${visionSmall} 640w, ${visionMedium} 960w, ${visionLarge} 1280w, ${visionExtraLarge} 1920w`}
						sizes="(min-width: 80rem) 40rem, (min-width: 64rem) 50vw, 100vw"
						width={1280}
						height={960}
						alt={text.imageAlt}
						loading="lazy"
						decoding="async"
						className="aspect-4/3 w-full object-cover"
					/>
					{/* warms the photo's grey studio backdrop toward the cream palette */}
					<div
						aria-hidden="true"
						className="absolute inset-0 bg-[#f6ecdf] mix-blend-multiply"
					/>
				</div>

				<div>
					<p className="text-xs font-semibold tracking-[0.3em] uppercase">
						{text.eyebrow}
					</p>
					<h2
						id="vision-heading"
						className="mt-3 font-didone text-4xl/tight uppercase sm:text-5xl/tight"
					>
						<span className="block">{text.headingFirst}</span>
						<span className="block">{text.headingSecond}</span>
					</h2>
					<p className="mt-5 max-w-md text-base/relaxed text-primary/80">
						{text.description}
					</p>
					{/*
					 * The two studios, side by side at the same size. Both stay
					 * on one line, shrinking on narrow phones and again where
					 * this text shares the row with the photo. If they still
					 * can't fit (someone widens the letter spacing, or the
					 * script fonts fail to load), each name wraps inside its own
					 * column, so the divider stays between them. The padding
					 * keeps the divider as tall as it was when the names were
					 * links; they become links again once each studio has its
					 * own page.
					 */}
					<ul className="mt-8 flex items-center text-[clamp(1.125rem,6vw,1.75rem)] leading-none sm:text-4xl/none lg:text-[clamp(1.75rem,calc(4.5vw-1.125rem),2.25rem)]">
						<li className="py-1 pr-3 font-birthstone sm:pr-5">
							Bare Skin Co
						</li>
						<li className="border-l border-primary/30 py-1 pl-3 font-doulaise sm:pl-5">
							Cherry Glow Studio
						</li>
					</ul>
				</div>
			</div>
		</section>
	);
}
