import { Carousel } from "@mantine/carousel";
import { Button } from "@mantine/core";
import { useLanguage } from "@/lib/i18n/use-language";
import type { BannerDTO } from "@kineDao.com/api-types/catalog";
import "@mantine/carousel/styles.css";

interface HeroBannersProps {
	banners: BannerDTO[];
}

const BADGE_COLORS = {
	red: "bg-red-500",
	teal: "bg-teal-500",
	purple: "bg-purple-500",
	orange: "bg-orange-500",
	green: "bg-green-500",
} as const;

export function HeroBanners({ banners }: HeroBannersProps) {
	const { language } = useLanguage();

	if (banners.length === 0) {
		// Fallback: Show default hardcoded hero banner
		return <DefaultHeroBanner />;
	}

	return (
		<Carousel
			withIndicators
			loop
			dragFree
			slideGap="md"
			align="start"
			slidesToScroll={1}
			height={500}
			styles={{
				control: {
					"&[data-inactive]": {
						opacity: 0,
						cursor: "default",
					},
				},
			}}
			classNames={{
				indicator: "bg-white/50 hover:bg-white transition-colors",
				indicators: "bottom-4",
			}}
			withControls={banners.length > 1}
		>
			{banners.map((banner) => {
				const title = language === "bn" && banner.titleBn ? banner.titleBn : banner.titleEn;
				const subtitle = language === "bn" && banner.subtitleBn ? banner.subtitleBn : banner.subtitleEn;

				return (
					<Carousel.Slide key={banner.id}>
						<div
							className="relative h-[500px] rounded-xl overflow-hidden bg-cover bg-center"
							style={{ backgroundImage: `url(${banner.imageUrl})` }}
						>
							{/* Overlay gradient */}
							<div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent" />

							{/* Content */}
							<div className="relative h-full flex flex-col justify-center px-12 max-w-2xl">
								{banner.badgeText && (
									<span
										className={`inline-block px-4 py-1 rounded-full text-white text-sm font-semibold mb-4 w-fit ${
											banner.badgeColor ? BADGE_COLORS[banner.badgeColor as keyof typeof BADGE_COLORS] : "bg-teal-500"
										}`}
									>
										{banner.badgeText}
									</span>
								)}

								<h1 className="text-5xl font-bold text-white mb-4">{title}</h1>

								{subtitle && (
									<p className="text-xl text-white/90 mb-4">{subtitle}</p>
								)}

								{banner.priceLabel && (
									<p className="text-3xl font-bold text-teal-400 mb-6">{banner.priceLabel}</p>
								)}

								{banner.linkUrl && (
									<Button
										component="a"
										href={banner.linkUrl}
										size="lg"
										className="bg-teal-500 hover:bg-teal-600 text-white w-fit"
									>
										{banner.ctaText || "Shop Now →"}
									</Button>
								)}
							</div>
						</div>
					</Carousel.Slide>
				);
			})}
		</Carousel>
	);
}

// Fallback component (existing hardcoded hero)
function DefaultHeroBanner() {
	return (
		<div className="relative h-[500px] rounded-xl overflow-hidden bg-gradient-to-r from-teal-400 to-purple-500">
			<div className="relative h-full flex flex-col justify-center px-12 max-w-2xl">
				<span className="inline-block px-4 py-1 rounded-full bg-orange-500 text-white text-sm font-semibold mb-4 w-fit">
					NEW COLLECTION
				</span>
				<h1 className="text-5xl font-bold text-white mb-4">Premium Baby Essentials</h1>
				<p className="text-xl text-white/90 mb-4">Everything your little one needs</p>
				<p className="text-3xl font-bold text-white mb-6">From $19.99</p>
				<Button
					component="a"
					href="/catalog"
					size="lg"
					className="bg-white text-teal-600 hover:bg-gray-100 w-fit"
				>
					Shop Now →
				</Button>
			</div>
		</div>
	);
}
