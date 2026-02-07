import { useTranslation } from "@/hooks/use-translation";
import { useCartStore } from "@/stores/cart-store";
import { useCheckoutStore } from "@/stores/checkout-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Tag } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function OrderSummarySidebar() {
	const { t, language } = useTranslation();
	const cart = useCartStore((state) => state.cart);
	const shippingCost = useCheckoutStore((state) => state.shippingCost);
	const [isExpanded, setIsExpanded] = useState(false);
	const [promoCode, setPromoCode] = useState("");

	if (!cart) return null;

	const formatPrice = (paisa: number) => {
		const amount = paisa / 100;
		return language === "bn"
			? `৳${amount.toLocaleString("bn-BD")}`
			: `৳${amount.toLocaleString("en-BD")}`;
	};

	const subtotal = cart.subtotal;
	const shipping = shippingCost?.costPaisa ?? 0;
	const total = subtotal + shipping;

	return (
		<div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
			{/* Mobile: Collapsible header */}
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="lg:hidden w-full flex items-center justify-between p-4 border-b border-border"
			>
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium text-muted-foreground">
						{t("checkout.orderSummary")}
					</span>
					<span className="text-xs text-muted-foreground">
						({cart.itemCount} {cart.itemCount === 1 ? t("checkout.item") : t("checkout.items")})
					</span>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-lg font-bold">{formatPrice(total)}</span>
					{isExpanded ? (
						<ChevronUp className="w-5 h-5" />
					) : (
						<ChevronDown className="w-5 h-5" />
					)}
				</div>
			</button>

			{/* Desktop: Always visible header */}
			<div className="hidden lg:block p-5 border-b border-border">
				<h2 className="text-lg font-semibold">{t("checkout.orderSummary")}</h2>
				<p className="text-sm text-muted-foreground">
					{cart.itemCount} {cart.itemCount === 1 ? t("checkout.item") : t("checkout.items")}
				</p>
			</div>

			{/* Content (collapsed on mobile, always visible on desktop) */}
			<div
				className={cn(
					"lg:block",
					isExpanded ? "block" : "hidden",
				)}
			>
				{/* Promotion code section */}
				<div className="p-5 border-b border-border">
					<div className="flex items-center gap-2 mb-3">
						<Tag className="w-4 h-4 text-muted-foreground" />
						<h3 className="text-sm font-medium">{t("checkout.promotion")}</h3>
					</div>
					<div className="flex gap-2">
						<Input
							type="text"
							placeholder={t("checkout.promoCodePlaceholder")}
							value={promoCode}
							onChange={(e) => setPromoCode(e.target.value)}
							className="flex-1"
						/>
						<Button type="button" variant="default" size="sm">
							{t("checkout.apply")}
						</Button>
					</div>
				</div>

				{/* Pricing summary */}
				<div className="p-5 space-y-3">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">
							{t("checkout.itemsTotal")} ({cart.itemCount} {cart.itemCount === 1 ? t("checkout.item") : t("checkout.items")})
						</span>
						<span className="font-medium">{formatPrice(subtotal)}</span>
					</div>

					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">
							{t("checkout.deliveryFee")}
							{shippingCost && (
								<span className="block text-xs">
									({language === "bn" ? shippingCost.labelBn : shippingCost.labelEn})
								</span>
							)}
						</span>
						<span className="font-medium">
							{shipping > 0 ? formatPrice(shipping) : t("cart.calculatedAtCheckout")}
						</span>
					</div>

					<div className="flex justify-between pt-3 border-t border-border">
						<span className="text-base font-semibold">{t("checkout.total")}</span>
						<span className="text-xl font-bold text-primary">
							{formatPrice(total)}
						</span>
					</div>

					{shippingCost && (
						<p className="text-xs text-muted-foreground text-center">
							{t("checkout.vatIncluded")}
						</p>
					)}
				</div>

				{/* Trust badges */}
				<div className="p-5 border-t border-border bg-muted/30">
					<div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
						<div className="flex items-center gap-1">
							<span>🔒</span>
							<span>{t("cart.trust.secure")}</span>
						</div>
						<div className="flex items-center gap-1">
							<span>💰</span>
							<span>{t("cart.trust.cod")}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
