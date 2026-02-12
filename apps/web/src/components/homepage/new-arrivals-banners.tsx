import { useLanguage } from "@/lib/i18n/use-language";
import type { BannerDTO } from "@kineDao.com/api-types/catalog";

interface NewArrivalsBannersProps {
	banners: BannerDTO[];
}

export function NewArrivalsBanners({ banners }: NewArrivalsBannersProps) {
	const { language } = useLanguage();
	const displayBanners = banners.slice(0, 6);

	return (
		<div className="h-full flex flex-col">
			<h3 className="text-lg lg:text-xl font-bold text-zinc-900 dark:text-white mb-2 lg:mb-3 px-1">
				New Arrivals
			</h3>

			<div className="flex-1 grid grid-cols-3 gap-2 lg:gap-3">
				{displayBanners.map((banner, index) => {
					const title =
						language === "bn" && banner.titleBn
							? banner.titleBn
							: banner.titleEn;

					return (
						<a
							key={banner.id}
							href={banner.linkUrl || "#"}
							className="group flex flex-col"
						>
							<div className="aspect-[4/5] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
								<img
									src={banner.imageUrl}
									alt={title}
									className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
									loading="lazy"
								/>
							</div>
							<p
								className={`text-xs font-semibold mt-1.5 text-center truncate ${
									index % 3 === 0
										? "text-red-500"
										: index % 3 === 1
											? "text-blue-500"
											: "text-pink-500"
								}`}
							>
								#{title.split(" ").slice(0, 2).join("")}
							</p>
						</a>
					);
				})}
			</div>
		</div>
	);
}
