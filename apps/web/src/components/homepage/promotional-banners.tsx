import { useLanguage } from "@/lib/i18n/use-language";
import type { BannerDTO } from "@kineDao.com/api-types/catalog";

interface PromotionalBannersProps {
	banners: BannerDTO[];
}

const DEFAULT_PROMOS = [
	{
		id: "default-1",
		titleEn: "Strollers",
		titleBn: null,
		subtitleEn: null,
		subtitleBn: null,
		imageUrl: "/images/promo-strollers.jpg",
		linkUrl: "/catalog?category=strollers",
		priceLabel: null,
		badgeText: "50% OFF",
		badgeColor: "red",
		ctaText: "Shop Now →",
		discountPercentage: null,
		placement: "promotional_card",
		sortOrder: 0,
	},
	{
		id: "default-2",
		titleEn: "Clothing",
		titleBn: null,
		subtitleEn: null,
		subtitleBn: null,
		imageUrl: "/images/promo-clothing.jpg",
		linkUrl: "/catalog?category=clothing",
		priceLabel: null,
		badgeText: "30% OFF",
		badgeColor: "orange",
		ctaText: "Shop Now →",
		discountPercentage: null,
		placement: "promotional_card",
		sortOrder: 1,
	},
	{
		id: "default-3",
		titleEn: "Feeding",
		titleBn: null,
		subtitleEn: null,
		subtitleBn: null,
		imageUrl: "/images/promo-feeding.jpg",
		linkUrl: "/catalog?category=feeding",
		priceLabel: null,
		badgeText: "25% OFF",
		badgeColor: "purple",
		ctaText: "Shop Now →",
		discountPercentage: null,
		placement: "promotional_card",
		sortOrder: 2,
	},
] as BannerDTO[];

export function PromotionalBanners({ banners }: PromotionalBannersProps) {
	const { language } = useLanguage();

	// Use banners from database or fallback to defaults
	const displayBanners = banners.length > 0 ? banners.slice(0, 3) : DEFAULT_PROMOS;

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{displayBanners.map((banner) => {
				const title = language === "bn" && banner.titleBn ? banner.titleBn : banner.titleEn;
				const badgeText = banner.discountPercentage
					? `${banner.discountPercentage}% OFF`
					: banner.badgeText;

				return (
					<a
						key={banner.id}
						href={banner.linkUrl || "#"}
						className="group relative h-[280px] rounded-xl overflow-hidden bg-cover bg-center hover:scale-105 transition-transform duration-300"
						style={{ backgroundImage: `url(${banner.imageUrl})` }}
					>
						{/* Overlay gradient */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

						{/* Badge */}
						{badgeText && (
							<span className="absolute top-4 right-4 px-3 py-1 rounded-full bg-red-500 text-white text-sm font-semibold">
								{badgeText}
							</span>
						)}

						{/* Content */}
						<div className="absolute bottom-0 left-0 right-0 p-6">
							<h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
							<span className="text-teal-400 font-semibold group-hover:underline">
								{banner.ctaText || "Shop Now →"}
							</span>
						</div>
					</a>
				);
			})}
		</div>
	);
}
