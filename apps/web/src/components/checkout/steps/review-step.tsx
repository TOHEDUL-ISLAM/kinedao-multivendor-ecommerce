import { useTranslation } from "@/hooks/use-translation";
import { useCheckoutStore } from "@/stores/checkout-store";
import { useCartStore } from "@/stores/cart-store";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api-client";
import { Loader2, Edit, AlertTriangle, Package } from "lucide-react";
import { useMemo, useEffect } from "react";

interface ReviewStepProps {
	onEditStep: (step: 1 | 2) => void;
}

export function ReviewStep({ onEditStep }: ReviewStepProps) {
	const { t, language } = useTranslation();
	const cart = useCartStore((state) => state.cart);
	const {
		selectedAddress,
		shippingCost,
		customerNotes,
		acceptedTerms,
		setAcceptedTerms,
		setShippingCost,
	} = useCheckoutStore();

	// Auto-calculate shipping cost if missing but address exists
	useEffect(() => {
		const calculateShipping = async () => {
			if (selectedAddress && !shippingCost) {
				try {
					const response = await api.shippingAddresses["shipping-cost"].$get({
						query: { district: selectedAddress.district },
					});
					if (response.ok) {
						const cost = await response.json();
						setShippingCost(cost);
					}
				} catch (error) {
					console.error("Failed to calculate shipping:", error);
				}
			}
		};
		calculateShipping();
	}, [selectedAddress, shippingCost, setShippingCost]);

	const formatPrice = (paisa: number) => {
		const amount = paisa / 100;
		return language === "bn"
			? `৳${amount.toLocaleString("bn-BD")}`
			: `৳${amount.toLocaleString("en-BD")}`;
	};

	// Group cart items by vendor
	const vendorGroups = useMemo(() => {
		if (!cart) return [];
		const groups = new Map<
			string,
			{ vendor: any; items: typeof cart.items }
		>();
		cart.items.forEach((item) => {
			const vendor = item.product.vendor;
			if (!groups.has(vendor.id)) {
				groups.set(vendor.id, { vendor, items: [] });
			}
			groups.get(vendor.id)!.items.push(item);
		});
		return Array.from(groups.values());
	}, [cart]);

	const totalPackages = vendorGroups.length;

	// Check if any item has baby-specific attributes
	const hasBabyProducts = useMemo(() => {
		if (!cart) return false;
		return cart.items.some(
			(item) =>
				item.product.ageRange ||
				item.product.isBpaFree ||
				item.product.isOrganic ||
				item.product.isHypoallergenic,
		);
	}, [cart]);

	if (!cart) {
		return (
			<Alert variant="destructive">
				<AlertTriangle className="w-4 h-4" />
				<AlertDescription>Your cart is empty. Please add items to continue.</AlertDescription>
			</Alert>
		);
	}

	if (!selectedAddress) {
		return (
			<Alert variant="destructive">
				<AlertTriangle className="w-4 h-4" />
				<AlertDescription>Please go back to Step 1 and select a shipping address.</AlertDescription>
			</Alert>
		);
	}

	if (!shippingCost) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
				<span className="ml-3">Calculating shipping cost...</span>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold mb-2">
					{t("checkout.review.title")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t("checkout.review.subtitle")}
				</p>
			</div>

			{/* Shipping address */}
			<Card className="p-4">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<h3 className="text-sm font-semibold mb-2">
							{t("checkout.review.shippingAddress")}
						</h3>
						<div className="text-sm space-y-1">
							<p className="font-medium">{selectedAddress.fullName}</p>
							<p className="text-muted-foreground">{selectedAddress.phone}</p>
							<p className="text-muted-foreground">
								{selectedAddress.addressLine1}
								{selectedAddress.addressLine2 &&
									`, ${selectedAddress.addressLine2}`}
							</p>
							<p className="text-muted-foreground">
								{selectedAddress.city}, {selectedAddress.district}
								{selectedAddress.postalCode &&
									` ${selectedAddress.postalCode}`}
							</p>
							{selectedAddress.deliveryInstructions && (
								<p className="text-muted-foreground italic mt-2">
									{selectedAddress.deliveryInstructions}
								</p>
							)}
						</div>
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => onEditStep(1)}
					>
						<Edit className="w-4 h-4 mr-1" />
						{t("checkout.review.edit")}
					</Button>
				</div>
			</Card>

			{/* Payment method */}
			<Card className="p-4">
				<div className="flex items-start justify-between">
					<div>
						<h3 className="text-sm font-semibold mb-2">
							{t("checkout.review.paymentMethod")}
						</h3>
						<p className="text-sm">{t("checkout.payment.cod")}</p>
						<p className="text-xs text-muted-foreground mt-1">
							{t("checkout.payment.codDescription")}
						</p>
						{customerNotes && (
							<div className="mt-3">
								<p className="text-xs font-medium text-muted-foreground mb-1">
									{t("checkout.payment.notes")}:
								</p>
								<p className="text-sm">{customerNotes}</p>
							</div>
						)}
					</div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => onEditStep(2)}
					>
						<Edit className="w-4 h-4 mr-1" />
						{t("checkout.review.edit")}
					</Button>
				</div>
			</Card>

			{/* Order items grouped by vendor as packages */}
			<div className="space-y-6">
				{vendorGroups.map((group, index) => (
					<div key={group.vendor.id}>
						<div className="mb-3">
							<h3 className="text-sm font-semibold text-muted-foreground">
								{t("checkout.package")} {index + 1} {t("checkout.of")} {totalPackages}
							</h3>
						</div>

						<Card className="p-4">
							<div className="mb-4 pb-3 border-b">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Package className="w-4 h-4 text-primary" />
										<p className="text-sm">
											{t("checkout.deliveryOrPickup")}
										</p>
									</div>
								</div>
								<div className="mt-2 text-sm text-muted-foreground">
									<p>{t("checkout.standardDelivery")}</p>
									{shippingCost && (
										<p className="text-xs">
											{t("checkout.guaranteedBy")} {shippingCost.estimatedDays} {t("checkout.days")}
										</p>
									)}
								</div>
							</div>

							<div className="space-y-4">
								{group.items.map((item) => (
									<div key={item.id} className="flex gap-3">
										<div className="relative flex-shrink-0">
											<img
												src={item.product.image || "/placeholder-product.png"}
												alt={item.product.imageAlt || item.product.title}
												className="w-20 h-20 object-cover rounded-lg"
											/>
										</div>
										<div className="flex-1 min-w-0">
											<p className="text-sm font-medium line-clamp-2">
												{language === "bn" && item.product.titleBn
													? item.product.titleBn
													: item.product.title}
											</p>
											<p className="text-xs text-muted-foreground mt-0.5">
												{item.product.vendor.shopName}
											</p>
											{item.product.ageRange && (
												<span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
													{item.product.ageRange}
												</span>
											)}
											<div className="flex items-center justify-between mt-2">
												<span className="text-sm font-semibold text-primary">
													{formatPrice(item.lineTotal)}
												</span>
												<span className="text-sm text-muted-foreground">
													{t("checkout.qty")}: {item.quantity}
												</span>
											</div>
										</div>
									</div>
								))}
							</div>

							<div className="mt-4 pt-3 border-t text-right text-sm text-muted-foreground">
								{t("checkout.shippedBy")}: <span className="font-medium">{group.vendor.shopName}</span>
							</div>
						</Card>
					</div>
				))}
			</div>

			{/* Baby safety reminder */}
			{hasBabyProducts && (
				<Alert className="bg-yellow-50 border-yellow-200">
					<AlertTriangle className="w-4 h-4 text-yellow-600" />
					<AlertDescription className="text-yellow-800">
						{t("checkout.review.safetyReminder")}
					</AlertDescription>
				</Alert>
			)}

			{/* Terms and conditions */}
			<div className="flex items-start gap-3">
				<Checkbox
					id="terms"
					checked={acceptedTerms}
					onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
				/>
				<label
					htmlFor="terms"
					className="text-sm leading-normal cursor-pointer"
				>
					{t("checkout.review.terms")}{" "}
					<a href="/terms" className="text-primary underline">
						{t("checkout.review.termsLink")}
					</a>
				</label>
			</div>

		</div>
	);
}
