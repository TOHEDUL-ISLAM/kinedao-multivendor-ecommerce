import { useTranslation } from "@/hooks/use-translation";
import { useCheckoutStore } from "@/stores/checkout-store";
import type { CartResponse } from "@kineDao.com/api-types/cart";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Banknote, Info } from "lucide-react";
import { useMemo } from "react";

interface PaymentStepProps {
	checkoutCart: CartResponse["cart"];
}

export function PaymentStep({ checkoutCart }: PaymentStepProps) {
	const { t, language } = useTranslation();
	const { customerNotes, setCustomerNotes, shippingCost } = useCheckoutStore();

	const formatPrice = (paisa: number) => {
		const amount = paisa / 100;
		return language === "bn"
			? `৳${amount.toLocaleString("bn-BD")}`
			: `৳${amount.toLocaleString("en-BD")}`;
	};

	// Group cart items by vendor
	const vendorGroups = useMemo(() => {
		const groups = new Map<
			string,
			{ vendor: any; items: typeof checkoutCart.items }
		>();
		checkoutCart.items.forEach((item) => {
			const vendor = item.product.vendor;
			if (!groups.has(vendor.id)) {
				groups.set(vendor.id, { vendor, items: [] });
			}
			groups.get(vendor.id)!.items.push(item);
		});
		return Array.from(groups.values());
	}, [checkoutCart]);

	const totalPackages = vendorGroups.length;

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold mb-2">
					{t("checkout.payment.title")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t("checkout.payment.subtitle")}
				</p>
			</div>

			{/* Payment method */}
			<div className="space-y-3">
				<h3 className="text-sm font-medium">
					{t("checkout.payment.method")}
				</h3>
				<RadioGroup value="cod" disabled>
					<label className="flex items-start gap-3 p-4 border-2 border-primary bg-primary/5 rounded-lg">
						<RadioGroupItem value="cod" className="mt-1" checked />
						<div className="flex-1">
							<div className="flex items-center gap-2 mb-1">
								<Banknote className="w-5 h-5 text-primary" />
								<p className="font-medium">{t("checkout.payment.cod")}</p>
							</div>
							<p className="text-sm text-muted-foreground">
								{t("checkout.payment.codDescription")}
							</p>
						</div>
					</label>
				</RadioGroup>
			</div>

			{/* COD information */}
			<Alert>
				<Info className="w-4 h-4" />
				<AlertDescription>{t("checkout.payment.codInfo")}</AlertDescription>
			</Alert>

			{/* Customer notes */}
			<div className="space-y-2">
				<Label htmlFor="customerNotes">{t("checkout.payment.notes")}</Label>
				<Textarea
					id="customerNotes"
					rows={4}
					placeholder={t("checkout.payment.notesPlaceholder")}
					value={customerNotes}
					onChange={(e) => setCustomerNotes(e.target.value)}
					maxLength={500}
				/>
				<p className="text-xs text-muted-foreground text-right">
					{customerNotes.length}/500
				</p>
			</div>

			{/* Selected Products */}
			{checkoutCart.items.length > 0 && (
				<div className="space-y-6 mt-8">
					<div className="border-t pt-6">
						<h3 className="text-lg font-semibold mb-4">
							{t("checkout.selectedProducts")}
						</h3>

						{vendorGroups.map((group, index) => (
							<div key={group.vendor.id} className="mb-6">
								<div className="mb-3">
									<h4 className="text-sm font-semibold text-muted-foreground">
										{t("checkout.package")} {index + 1} {t("checkout.of")} {totalPackages}
									</h4>
								</div>

								<Card className="p-4">
									<div className="mb-4 pb-3 border-b">
										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="text-sm font-semibold text-primary">
													{t("checkout.deliveryFee")}: {shippingCost ? formatPrice(shippingCost.costPaisa) : ""}
												</span>
											</div>
										</div>
										<div className="mt-1 text-sm text-muted-foreground">
											<p>{t("checkout.standardDelivery")}</p>
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
				</div>
			)}

		</div>
	);
}
