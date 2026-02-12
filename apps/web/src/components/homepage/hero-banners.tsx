import { useRef } from "react";
import { Carousel } from "@mantine/carousel";
import { Button } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n/use-language";
import type { BannerDTO } from "@kineDao.com/api-types/catalog";
import Autoplay from "embla-carousel-autoplay";
import "@mantine/carousel/styles.css";

interface HeroBannersProps {
	banners: BannerDTO[];
}

const BADGE_COLORS: Record<string, string> = {
	red: "bg-red-500",
	teal: "bg-teal-500",
	purple: "bg-purple-500",
	orange: "bg-orange-500",
	green: "bg-green-500",
};

// Fallback slides when no banners in DB (Unsplash baby product images)
const DEFAULT_HERO_SLIDES: BannerDTO[] = [
	{
		id: "default-hero-1",
		titleEn: "Premium Baby Essentials",
		titleBn: "প্রিমিয়াম বেবি এসেনশিয়াল",
		subtitleEn: "Everything your little one needs",
		subtitleBn: "আপনার ছোট্ট সোনার জন্য সবকিছু",
		imageUrl:
			"https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1200&q=80",
		linkUrl: "/catalog",
		priceLabel: "From ৳499",
		badgeText: "NEW COLLECTION",
		badgeColor: "orange",
		ctaText: "Shop Now →",
		discountPercentage: null,
		placement: "hero_carousel",
		sortOrder: 0,
	},
	{
		id: "default-hero-2",
		titleEn: "Playful Toy Collection",
		titleBn: "খেলনার সংগ্রহ",
		subtitleEn: "Safe & educational toys for all ages",
		subtitleBn: "সব বয়সের জন্য নিরাপদ ও শিক্ষামূলক খেলনা",
		imageUrl:
			"https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&q=80",
		linkUrl: "/catalog?category=toys",
		priceLabel: "From ৳299",
		badgeText: "TOYS & GIFTS",
		badgeColor: "purple",
		ctaText: "Explore →",
		discountPercentage: null,
		placement: "hero_carousel",
		sortOrder: 1,
	},
];

export function HeroBanners({ banners }: HeroBannersProps) {
	const { language } = useLanguage();
	const autoplay = useRef(Autoplay({ delay: 2000, stopOnInteraction: false }));

	const displayBanners = banners.length > 0 ? banners : DEFAULT_HERO_SLIDES;

	return (
		<Carousel
			withIndicators
			emblaOptions={{ loop: true }}
			plugins={[autoplay.current]}
			onMouseEnter={autoplay.current.stop}
			onMouseLeave={autoplay.current.reset}
			height="100%"
			nextControlIcon={
				<ChevronRight className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
			}
			previousControlIcon={
				<ChevronLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-200" />
			}
			classNames={{
				root: "h-[220px] sm:h-[300px] md:h-[340px] lg:h-[420px] rounded-lg lg:rounded-xl overflow-hidden",
				viewport: "h-full",
				container: "h-full",
				slide: "h-full",
				control:
					"bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm border-0 shadow-md w-8 h-8 lg:w-10 lg:h-10 opacity-0 group-hover:opacity-100 transition-opacity",
				indicators: "bottom-3 gap-1.5",
				indicator:
					"w-2 h-2 rounded-full bg-white/50 data-[active]:bg-white data-[active]:w-6 transition-all",
			}}
			withControls={displayBanners.length > 1}
			className="group"
		>
			{displayBanners.map((banner) => {
				const title =
					language === "bn" && banner.titleBn
						? banner.titleBn
						: banner.titleEn;
				const subtitle =
					language === "bn" && banner.subtitleBn
						? banner.subtitleBn
						: banner.subtitleEn;

				return (
					<Carousel.Slide key={banner.id}>
						<div className="relative h-full overflow-hidden">
							{/* Full background image */}
							<img
								src={banner.imageUrl}
								alt={title}
								className="absolute inset-0 w-full h-full object-cover"
							/>

							{/* Gradient overlay */}
							<div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-transparent" />

							{/* Content — left-aligned overlay */}
							<div className="relative h-full flex flex-col justify-center px-4 sm:px-6 md:px-8 lg:px-12 max-w-[85%] sm:max-w-md">
								{banner.badgeText && (
									<span
										className={`inline-block px-3 py-1 rounded-full text-white text-xs sm:text-sm font-bold mb-3 w-fit ${
											banner.badgeColor
												? (BADGE_COLORS[banner.badgeColor] ?? "bg-teal-500")
												: "bg-teal-500"
										}`}
									>
										{banner.badgeText}
									</span>
								)}

								{banner.discountPercentage && !banner.badgeText && (
									<span className="inline-block px-3 py-1 rounded-full bg-red-500 text-white text-xs sm:text-sm font-bold mb-3 w-fit">
										{banner.discountPercentage}% OFF
									</span>
								)}

								<h2 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 leading-tight">
									{title}
								</h2>

								{subtitle && (
									<p className="text-sm sm:text-base text-white/85 mb-2 line-clamp-2">
										{subtitle}
									</p>
								)}

								{banner.priceLabel && (
									<p className="text-lg sm:text-xl lg:text-2xl font-bold text-teal-400 mb-4">
										{banner.priceLabel}
									</p>
								)}

								{banner.linkUrl && (
									<Button
										component="a"
										href={banner.linkUrl}
										size="md"
										radius="xl"
										className="bg-teal-500 hover:bg-teal-600 text-white w-fit font-semibold text-sm sm:text-base px-6"
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
