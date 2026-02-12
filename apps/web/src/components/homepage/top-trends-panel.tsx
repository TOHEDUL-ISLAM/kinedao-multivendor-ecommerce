import { Link } from "@tanstack/react-router";
import { useTranslation } from "@/hooks/use-translation";
import { Package } from "lucide-react";
import type { ProductCardDTO } from "@kineDao.com/api-types/catalog";

interface TopTrendsPanelProps {
	products: ProductCardDTO[];
}

// Rotating colors for hashtag labels (SHEAN style)
const LABEL_COLORS = [
	"text-red-500",
	"text-blue-500",
	"text-pink-500",
	"text-red-500",
	"text-blue-500",
	"text-teal-500",
];

export function TopTrendsPanel({ products }: TopTrendsPanelProps) {
	const { t, language } = useTranslation();
	const displayProducts = products.slice(0, 6);

	return (
		<div className="h-full flex flex-col">
			{/* Header — SHEAN style: bold title, no border container */}
			<h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3 px-1">
				{t("home.topTrends")}
			</h3>

			{/* 3x2 Product Grid */}
			<div className="flex-1 grid grid-cols-3 gap-x-3 gap-y-3">
				{displayProducts.length > 0 ? (
					displayProducts.map((product, index) => {
						const productTitle =
							language === "bn" && product.titleBn
								? product.titleBn
								: product.title;

						return (
							<Link
								key={product.id}
								to="/product/$slug"
								params={{ slug: product.slug }}
								className="group flex flex-col"
							>
								{/* Product image — rectangular, no rounded corners (SHEAN style) */}
								<div className="aspect-[4/5] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
									{product.imageUrl ? (
										<img
											src={product.imageUrl}
											alt={productTitle}
											className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
											loading="lazy"
										/>
									) : (
										<div className="w-full h-full flex items-center justify-center">
											<Package className="w-6 h-6 text-zinc-400" />
										</div>
									)}
								</div>
								{/* Colored hashtag label below image (SHEAN style) */}
								<p
									className={`text-xs font-semibold mt-1.5 text-center truncate ${LABEL_COLORS[index % LABEL_COLORS.length]}`}
								>
									#{productTitle.split(" ").slice(0, 2).join("")}
								</p>
							</Link>
						);
					})
				) : (
					<div className="col-span-3 flex flex-col items-center justify-center py-8 text-zinc-400">
						<Package className="w-10 h-10 mb-2 opacity-50" />
						<p className="text-xs">No items yet</p>
					</div>
				)}
			</div>
		</div>
	);
}
