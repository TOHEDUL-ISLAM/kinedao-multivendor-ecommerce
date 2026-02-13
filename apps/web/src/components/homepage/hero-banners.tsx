import { useRef } from "react";
import { Carousel } from "@mantine/carousel";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BannerDTO } from "@kineDao.com/api-types/catalog";
import Autoplay from "embla-carousel-autoplay";
import "@mantine/carousel/styles.css";

interface HeroBannersProps {
	banners: BannerDTO[];
}

const DEFAULT_HERO_SLIDES: BannerDTO[] = [
	{
		id: "default-hero-1",
		titleEn: "KineDao Promotion",
		titleBn: null,
		subtitleEn: null,
		subtitleBn: null,
		imageUrl:
			"https://images.unsplash.com/photo-1522771930-78848d9293e8?w=1200&q=80",
		linkUrl: "/catalog",
		priceLabel: null,
		badgeText: null,
		badgeColor: null,
		ctaText: null,
		discountPercentage: null,
		placement: "hero_carousel",
		sortOrder: 0,
	},
	{
		id: "default-hero-2",
		titleEn: "KineDao Promotion",
		titleBn: null,
		subtitleEn: null,
		subtitleBn: null,
		imageUrl:
			"https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=1200&q=80",
		linkUrl: "/catalog?category=toys",
		priceLabel: null,
		badgeText: null,
		badgeColor: null,
		ctaText: null,
		discountPercentage: null,
		placement: "hero_carousel",
		sortOrder: 1,
	},
];

export function HeroBanners({ banners }: HeroBannersProps) {
	const autoplay = useRef(Autoplay({ delay: 2000, stopOnInteraction: false }));
	const displayBanners = banners.length > 0 ? banners : DEFAULT_HERO_SLIDES;

	return (
		<Carousel
			withIndicators
			emblaOptions={{ loop: true }}
			plugins={[autoplay.current]}
			onMouseEnter={autoplay.current.stop}
			onMouseLeave={autoplay.current.reset}
			onFocusCapture={autoplay.current.stop}
			onBlurCapture={autoplay.current.reset}
			height="100%"
			nextControlIcon={
				<ChevronRight className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
			}
			previousControlIcon={
				<ChevronLeft className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
			}
			classNames={{
				root: "h-[220px] overflow-hidden rounded-lg sm:h-[300px] md:h-[340px] lg:h-[420px] lg:rounded-xl",
				viewport: "h-full",
				container: "h-full",
				slide: "h-full",
				control:
					"h-8 w-8 border-0 bg-white/80 opacity-0 shadow-md backdrop-blur-sm transition-opacity group-hover:opacity-100 dark:bg-zinc-800/80 lg:h-10 lg:w-10",
				indicators: "bottom-3 gap-1.5",
				indicator:
					"h-2 w-2 rounded-full bg-white/50 transition-all data-[active]:w-6 data-[active]:bg-white",
			}}
			withControls={displayBanners.length > 1}
			className="group"
		>
			{displayBanners.map((banner) => (
				<Carousel.Slide key={banner.id}>
					<a
						href={banner.linkUrl || "/catalog"}
						className="block h-full w-full overflow-hidden"
					>
						<img
							src={banner.imageUrl}
							alt={banner.titleEn || "KineDao Promotion"}
							className="h-full w-full object-cover"
						/>
					</a>
				</Carousel.Slide>
			))}
		</Carousel>
	);
}
