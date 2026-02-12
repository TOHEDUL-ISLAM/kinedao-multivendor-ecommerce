import { Link } from "@tanstack/react-router";
import { useLanguage } from "@/lib/i18n/use-language";
import type { BannerDTO } from "@kineDao.com/api-types/catalog";

interface PromotionalBannersProps {
	banners: BannerDTO[];
	layout?: "vertical" | "horizontal";
}

const BADGE_COLORS: Record<string, string> = {
	red: "bg-red-500",
	teal: "bg-teal-500",
	purple: "bg-purple-500",
	orange: "bg-orange-500",
	green: "bg-green-500",
};

// Fallback promos with Unsplash baby product images
const DEFAULT_PROMOS: BannerDTO[] = [
	{
		id: "default-promo-1",
		titleEn: "Strollers & Travel",
		titleBn: "স্ট্রলার ও ভ্রমণ",
		subtitleEn: "Premium quality strollers",
		subtitleBn: "প্রিমিয়াম মানের স্ট্রলার",
		imageUrl:
			"https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=600&h=400&fit=crop",
		linkUrl: "/catalog?category=strollers",
		priceLabel: null,
		badgeText: "50% OFF",
		badgeColor: "red",
		ctaText: "Shop Now →",
		discountPercentage: 50,
		placement: "promotional_card",
		sortOrder: 0,
	},
	{
		id: "default-promo-2",
		titleEn: "Baby Clothing",
		titleBn: "বেবি পোশাক",
		subtitleEn: "Soft & comfortable",
		subtitleBn: "নরম ও আরামদায়ক",
		imageUrl:
			"https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&h=400&fit=crop",
		linkUrl: "/catalog?category=clothing",
		priceLabel: null,
		badgeText: "30% OFF",
		badgeColor: "orange",
		ctaText: "Shop Now →",
		discountPercentage: 30,
		placement: "promotional_card",
		sortOrder: 1,
	},
	{
		id: "default-promo-3",
		titleEn: "Feeding Essentials",
		titleBn: "খাওয়ানোর সরঞ্জাম",
		subtitleEn: "Free delivery on orders ৳999+",
		subtitleBn: "৳৯৯৯+ অর্ডারে ফ্রি ডেলিভারি",
		imageUrl:
			"https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&h=400&fit=crop",
		linkUrl: "/catalog?category=feeding",
		priceLabel: null,
		badgeText: "25% OFF",
		badgeColor: "purple",
		ctaText: "Shop Now →",
		discountPercentage: 25,
		placement: "promotional_card",
		sortOrder: 2,
	},
];

export function PromotionalBanners({
	banners,
	layout = "vertical",
}: PromotionalBannersProps) {
	const { language } = useLanguage();
	const displayBanners = banners.length > 0 ? banners.slice(0, 3) : DEFAULT_PROMOS;

	if (layout === "horizontal") {
		return (
			<>
				{displayBanners.map((banner) => (
					<PromoCard key={banner.id} banner={banner} language={language} compact />
				))}
			</>
		);
	}

	return (
		<div className="flex flex-col gap-3 h-full">
			{displayBanners.map((banner) => (
				<PromoCard key={banner.id} banner={banner} language={language} />
			))}
		</div>
	);
}

function PromoCard({
	banner,
	language,
	compact = false,
}: {
	banner: BannerDTO;
	language: string;
	compact?: boolean;
}) {
	const title =
		language === "bn" && banner.titleBn ? banner.titleBn : banner.titleEn;
	const subtitle =
		language === "bn" && banner.subtitleBn
			? banner.subtitleBn
			: banner.subtitleEn;
	const badgeText = banner.discountPercentage
		? `${banner.discountPercentage}% OFF`
		: banner.badgeText;
	const badgeColorClass = banner.badgeColor
		? (BADGE_COLORS[banner.badgeColor] ?? "bg-teal-500")
		: "bg-red-500";
	const linkUrl = banner.linkUrl || "#";
	const isInternalLink = linkUrl.startsWith("/") && !linkUrl.startsWith("//");
	const isExternalLink = /^https?:\/\//i.test(linkUrl);
	const cardClassName = `group relative overflow-hidden rounded-lg ${
		compact ? "h-[92px] sm:h-[100px]" : "flex-1 min-h-[110px] sm:min-h-[120px]"
	}`;

	const cardContent = (
		<>
			{/* Background image */}
			<img
				src={banner.imageUrl}
				alt={title}
				className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
			/>

			{/* Gradient overlay */}
			<div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

			{/* Badge — top left */}
			{badgeText && (
				<span
					className={`absolute top-2 left-2 ${badgeColorClass} text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full shadow-sm`}
				>
					{badgeText}
				</span>
			)}

			{/* Content — bottom */}
			<div className="absolute bottom-0 left-0 right-0 p-3">
				<h3
					className={`font-bold text-white leading-tight ${
						compact ? "text-sm" : "text-base lg:text-lg"
					}`}
				>
					{title}
				</h3>
				{!compact && subtitle && (
					<p className="text-xs text-white/75 mt-0.5 line-clamp-1">
						{subtitle}
					</p>
				)}
			</div>
		</>
	);

	if (isInternalLink) {
		return (
			<Link to={linkUrl as any} className={cardClassName}>
				{cardContent}
			</Link>
		);
	}

	return (
		<a
			href={linkUrl}
			className={cardClassName}
			target={isExternalLink ? "_blank" : undefined}
			rel={isExternalLink ? "noopener noreferrer" : undefined}
		>
			{cardContent}
		</a>
	);
}
