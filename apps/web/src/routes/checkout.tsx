import { createFileRoute, redirect, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { z } from "zod";
import { getUser } from "@/functions/get-user";
import { useTranslation } from "@/hooks/use-translation";
import { useCartStore } from "@/stores/cart-store";
import { useBuyNowStore } from "@/stores/buy-now-store";
import { CheckoutWizard } from "@/components/checkout/checkout-wizard";

const checkoutSearchSchema = z.object({
	mode: z.enum(["buy_now"]).optional(),
});

export const Route = createFileRoute("/checkout")({
	validateSearch: checkoutSearchSchema,
	component: CheckoutPage,
	beforeLoad: async ({ search }) => {
		const session = await getUser();
		if (!session) {
			throw redirect({
				to: "/login",
				search: {
					redirect:
						search.mode === "buy_now" ? "/checkout?mode=buy_now" : "/checkout",
				},
			});
		}
		return { session };
	},
});

function CheckoutPage() {
	const { t } = useTranslation();
	const { mode } = Route.useSearch();
	const cart = useCartStore((state) => state.cart);
	const buyNowCart = useBuyNowStore((state) => state.cart);
	const clearBuyNow = useBuyNowStore((state) => state.clearBuyNow);

	useEffect(() => {
		if (mode !== "buy_now" && buyNowCart) {
			clearBuyNow();
		}
	}, [mode, buyNowCart, clearBuyNow]);

	if (mode === "buy_now") {
		if (!buyNowCart || buyNowCart.items.length === 0) {
			return <Navigate to="/cart" />;
		}

		return (
			<div className="container max-w-6xl mx-auto px-4 py-8">
				<h1 className="text-2xl sm:text-3xl font-bold mb-6">
					{t("checkout.title")}
				</h1>
				<CheckoutWizard mode="buy_now" checkoutCart={buyNowCart} />
			</div>
		);
	}

	// Redirect to cart if empty
	if (!cart || cart.items.length === 0) {
		return <Navigate to="/cart" />;
	}

	return (
		<div className="container max-w-6xl mx-auto px-4 py-8">
			<h1 className="text-2xl sm:text-3xl font-bold mb-6">
				{t("checkout.title")}
			</h1>
			<CheckoutWizard mode="cart" checkoutCart={cart} />
		</div>
	);
}
