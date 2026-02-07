import { createFileRoute, redirect } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
	CheckCircle,
	Package,
	MapPin,
	Banknote,
	AlertTriangle,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";

const orderConfirmationSearchSchema = z.object({
	groupId: z.string().uuid(),
});

export const Route = createFileRoute("/order-confirmation")({
	component: OrderConfirmationPage,
	validateSearch: orderConfirmationSearchSchema,
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
	},
	loaderDeps: ({ search }) => ({ groupId: search.groupId }),
	loader: async ({ deps }) => {
		const response = await api.orders.group[":groupId"].$get({
			param: { groupId: deps.groupId },
		});
		if (!response.ok) {
			throw redirect({ to: "/" });
		}
		return response.json();
	},
});

function OrderConfirmationPage() {
	const { t, language } = useTranslation();
	const orderGroup = Route.useLoaderData();

	const formatPrice = (paisa: number) => {
		const amount = paisa / 100;
		return language === "bn"
			? `৳${amount.toLocaleString("bn-BD")}`
			: `৳${amount.toLocaleString("en-BD")}`;
	};

	const orderNumbers = orderGroup.orders.map((o) => o.orderNumber).join(", ");
	const shippingAddress = orderGroup.orders[0].shippingAddress;

	// Check if any item has baby-specific attributes
	const hasBabyProducts = orderGroup.orders.some((order) =>
		order.items.some(
			(item) =>
				item.productSnapshot.ageRange ||
				item.productSnapshot.isBpaFree ||
				item.productSnapshot.isOrganic ||
				item.productSnapshot.isHypoallergenic,
		),
	);

	return (
		<div className="container max-w-4xl mx-auto px-4 py-8">
			{/* Success header */}
			<div className="text-center mb-8">
				<div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
					<CheckCircle className="w-10 h-10 text-green-600" />
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold mb-2">
					{t("checkout.confirmation.title")}
				</h1>
				<p className="text-muted-foreground">
					{t("checkout.confirmation.subtitle")}
				</p>
			</div>

			{/* Order numbers */}
			<Card className="p-6 mb-6 bg-primary/5 border-primary/20">
				<div className="text-center">
					<p className="text-sm text-muted-foreground mb-1">
						{t("checkout.confirmation.orderNumber")}
						{orderGroup.orders.length > 1 ? "s" : ""}
					</p>
					<p className="text-xl font-bold text-primary">{orderNumbers}</p>
				</div>
			</Card>

			{/* Order items by vendor */}
			<div className="space-y-4 mb-6">
				<h2 className="text-lg font-semibold">{t("checkout.orderSummary")}</h2>

				{orderGroup.orders.map((order) => (
					<Card key={order.id} className="p-5">
						<div className="flex items-center gap-2 mb-4 pb-3 border-b">
							<Package className="w-5 h-5 text-primary" />
							<div>
								<p className="font-semibold">{order.orderNumber}</p>
								<p className="text-sm text-muted-foreground">
									{order.vendorName}
								</p>
							</div>
						</div>

						<div className="space-y-3 mb-4">
							{order.items.map((item) => (
								<div key={item.id} className="flex gap-3">
									<img
										src={
											item.productSnapshot.image || "/placeholder-product.png"
										}
										alt={item.productSnapshot.title}
										className="w-16 h-16 object-cover rounded-lg"
									/>
									<div className="flex-1">
										<p className="text-sm font-medium line-clamp-2">
											{language === "bn" && item.productSnapshot.titleBn
												? item.productSnapshot.titleBn
												: item.productSnapshot.title}
										</p>
										{item.productSnapshot.ageRange && (
											<span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
												{item.productSnapshot.ageRange}
											</span>
										)}
										<div className="flex items-center justify-between mt-1">
											<span className="text-sm text-muted-foreground">
												Qty: {item.quantity}
											</span>
											<span className="text-sm font-semibold">
												{formatPrice(item.lineTotal)}
											</span>
										</div>
									</div>
								</div>
							))}
						</div>

						<Separator className="my-3" />

						<div className="space-y-2 text-sm">
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("checkout.subtotal")}
								</span>
								<span className="font-medium">{formatPrice(order.subtotal)}</span>
							</div>
							<div className="flex justify-between">
								<span className="text-muted-foreground">
									{t("checkout.shipping")}
								</span>
								<span className="font-medium">
									{formatPrice(order.shippingCost)}
								</span>
							</div>
							<div className="flex justify-between pt-2 border-t font-semibold">
								<span>{t("checkout.total")}</span>
								<span className="text-primary">{formatPrice(order.total)}</span>
							</div>
						</div>
					</Card>
				))}

				{/* Grand total if multiple orders */}
				{orderGroup.orders.length > 1 && (
					<Card className="p-4 bg-muted/50">
						<div className="flex justify-between items-center">
							<span className="text-lg font-semibold">Grand Total</span>
							<span className="text-2xl font-bold text-primary">
								{formatPrice(orderGroup.grandTotal)}
							</span>
						</div>
					</Card>
				)}
			</div>

			{/* Delivery info */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<Card className="p-5">
					<div className="flex items-start gap-3">
						<MapPin className="w-5 h-5 text-primary mt-0.5" />
						<div>
							<h3 className="font-semibold mb-2">
								{t("checkout.deliveryAddress")}
							</h3>
							<div className="text-sm space-y-1 text-muted-foreground">
								<p className="font-medium text-foreground">
									{shippingAddress.fullName}
								</p>
								<p>{shippingAddress.phone}</p>
								<p>
									{shippingAddress.addressLine1}
									{shippingAddress.addressLine2 &&
										`, ${shippingAddress.addressLine2}`}
								</p>
								<p>
									{shippingAddress.city}, {shippingAddress.district}
									{shippingAddress.postalCode &&
										` ${shippingAddress.postalCode}`}
								</p>
							</div>
						</div>
					</div>
				</Card>

				<Card className="p-5">
					<div className="flex items-start gap-3">
						<Banknote className="w-5 h-5 text-primary mt-0.5" />
						<div className="flex-1">
							<h3 className="font-semibold mb-2">{t("checkout.payment")}</h3>
							<p className="text-sm text-muted-foreground mb-3">
								{t("checkout.payment.cod")}
							</p>
							<Alert className="bg-yellow-50 border-yellow-200">
								<AlertDescription className="text-yellow-800 text-xs">
									{t("checkout.confirmation.codReminder")}
								</AlertDescription>
							</Alert>
						</div>
					</div>
				</Card>
			</div>

			{/* Baby safety reminder */}
			{hasBabyProducts && (
				<Alert className="mb-6 bg-red-50 border-red-200">
					<AlertTriangle className="w-4 h-4 text-red-600" />
					<AlertDescription className="text-red-800">
						{t("checkout.review.safetyReminder")}
					</AlertDescription>
				</Alert>
			)}

			{/* Action buttons */}
			<div className="flex flex-col sm:flex-row gap-3">
				<Button asChild variant="outline" className="flex-1">
					<Link to="/">
						{t("checkout.confirmation.continueShopping")}
					</Link>
				</Button>
				{/* TODO: Create /account/orders route for order history */}
				{/* <Button asChild className="flex-1">
					<Link to="/account/orders">
						{t("checkout.confirmation.viewOrders")}
					</Link>
				</Button> */}
			</div>
		</div>
	);
}
