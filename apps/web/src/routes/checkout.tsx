import { createFileRoute, redirect, Navigate } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { useTranslation } from "@/hooks/use-translation";
import { useCartStore } from "@/stores/cart-store";
import { CheckoutWizard } from "@/components/checkout/checkout-wizard";

export const Route = createFileRoute("/checkout")({
	component: CheckoutPage,
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: "/checkout" },
			});
		}
		return { session };
	},
});

function CheckoutPage() {
	const { t } = useTranslation();
	const cart = useCartStore((state) => state.cart);

	// Redirect to cart if empty
	if (!cart || cart.items.length === 0) {
		return <Navigate to="/cart" />;
	}

	return (
		<div className="container max-w-6xl mx-auto px-4 py-8">
			<h1 className="text-2xl sm:text-3xl font-bold mb-6">
				{t("checkout.title")}
			</h1>
			<CheckoutWizard />
		</div>
	);
}
