import { useTranslation } from "@/hooks/use-translation";
import { useCheckoutStore } from "@/stores/checkout-store";
import { useCartStore } from "@/stores/cart-store";
import { useForm } from "@tanstack/react-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { shippingAddressSchema } from "@kineDao.com/api-types/checkout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Loader2, Plus, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DistrictSelect } from "@/components/vendor/district-select";

export function ShippingStep() {
	const { t, language } = useTranslation();
	const queryClient = useQueryClient();
	const [showAddressForm, setShowAddressForm] = useState(false);
	const cart = useCartStore((state) => state.cart);
	const { setSelectedAddress, setShippingCost } = useCheckoutStore();
	const selectedAddressId = useCheckoutStore(
		(state) => state.selectedAddressId,
	);

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

	// Fetch saved addresses
	const { data: addressesData, isLoading } = useQuery({
		queryKey: ["shipping-addresses"],
		queryFn: async () => {
			const response = await api.shippingAddresses.$get();
			if (!response.ok) throw new Error("Failed to fetch addresses");
			return response.json();
		},
	});

	const addresses = addressesData?.addresses ?? [];

	// Create address mutation
	const createAddressMutation = useMutation({
		mutationFn: async (data: any) => {
			const response = await api.shippingAddresses.$post({ json: data });
			if (!response.ok) {
				const error = await response.json();
				throw new Error(error.error || "Failed to create address");
			}
			return response.json();
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["shipping-addresses"] });
			setShowAddressForm(false);
			handleAddressSelect(data.address);
			toast.success(t("checkout.shipping.addressCreated"));
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	// Address form
	const form = useForm({
		defaultValues: {
			fullName: "",
			phone: "",
			alternatePhone: "",
			addressLine1: "",
			addressLine2: "",
			city: "",
			district: "",
			postalCode: "",
			deliveryInstructions: "",
			isDefault: false,
		},
			onSubmit: async ({ value }) => {
				createAddressMutation.mutate(value);
			},
			validators: {
				onSubmit: shippingAddressSchema as any,
			},
		});

	// Handle address selection
	const handleAddressSelect = async (address: any) => {
		setSelectedAddress(address);

		// Calculate shipping cost
		try {
			const response = await api.shippingAddresses["shipping-cost"].$get({
				query: { district: address.district },
			});
			if (response.ok) {
				const shippingInfo = await response.json();
				setShippingCost(shippingInfo);
			}
		} catch (error) {
			console.error("Failed to calculate shipping:", error);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="w-8 h-8 animate-spin text-primary" />
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-semibold mb-2">
					{t("checkout.shipping.title")}
				</h2>
				<p className="text-sm text-muted-foreground">
					{t("checkout.shipping.subtitle")}
				</p>
			</div>

			{/* Saved addresses */}
			{addresses.length > 0 && !showAddressForm && (
				<div className="space-y-3">
					<h3 className="text-sm font-medium">
						{t("checkout.shipping.savedAddresses")}
					</h3>
					<RadioGroup
						value={selectedAddressId || ""}
						onValueChange={(value) => {
							const addr = addresses.find((a) => a.id === value);
							if (addr) handleAddressSelect(addr);
						}}
					>
						{addresses.map((address) => (
							<label
								key={address.id}
								className={cn(
									"flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all",
									selectedAddressId === address.id
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50",
								)}
							>
								<RadioGroupItem value={address.id} className="mt-1" />
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<p className="font-medium">{address.fullName}</p>
										{address.isDefault && (
											<span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
												{t("checkout.shipping.default")}
											</span>
										)}
									</div>
									<p className="text-sm text-muted-foreground">
										{address.phone}
									</p>
									<p className="text-sm text-muted-foreground mt-1">
										{address.addressLine1}
										{address.addressLine2 && `, ${address.addressLine2}`}
									</p>
									<p className="text-sm text-muted-foreground">
										{address.city}, {address.district}
										{address.postalCode && ` ${address.postalCode}`}
									</p>
								</div>
								{selectedAddressId === address.id && (
									<Check className="w-5 h-5 text-primary flex-shrink-0" />
								)}
							</label>
						))}
					</RadioGroup>
				</div>
			)}

			{/* Add new address button */}
			{!showAddressForm && (
				<Button
					type="button"
					variant="outline"
					className="w-full"
					onClick={() => setShowAddressForm(true)}
				>
					<Plus className="w-4 h-4 mr-2" />
					{t("checkout.shipping.addNew")}
				</Button>
			)}

			{/* Selected Products */}
			{!showAddressForm && cart && cart.items.length > 0 && (
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

			{/* Address form */}
			{showAddressForm && (
				<Card className="p-6">
					<h3 className="text-lg font-semibold mb-4">
						{t("checkout.shipping.newAddress")}
					</h3>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="space-y-4"
					>
						<form.Field name="fullName">
							{(field) => (
								<div>
									<Label htmlFor="fullName">
										{t("checkout.shipping.form.fullName")} *
									</Label>
									<Input
										id="fullName"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
									{field.state.meta.errors.map((error, i) => (
										<p key={i} className="text-sm text-destructive mt-1">
											{error}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<form.Field name="phone">
								{(field) => (
									<div>
										<Label htmlFor="phone">
											{t("checkout.shipping.form.phone")} *
										</Label>
										<Input
											id="phone"
											placeholder="01712345678"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
										{field.state.meta.errors.map((error, i) => (
											<p key={i} className="text-sm text-destructive mt-1">
												{error}
											</p>
										))}
									</div>
								)}
							</form.Field>

							<form.Field name="alternatePhone">
								{(field) => (
									<div>
										<Label htmlFor="alternatePhone">
											{t("checkout.shipping.form.alternatePhone")}
										</Label>
										<Input
											id="alternatePhone"
											placeholder="01712345678"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
										{field.state.meta.errors.map((error, i) => (
											<p key={i} className="text-sm text-destructive mt-1">
												{error}
											</p>
										))}
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="addressLine1">
							{(field) => (
								<div>
									<Label htmlFor="addressLine1">
										{t("checkout.shipping.form.addressLine1")} *
									</Label>
									<Input
										id="addressLine1"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
									{field.state.meta.errors.map((error, i) => (
										<p key={i} className="text-sm text-destructive mt-1">
											{error}
										</p>
									))}
								</div>
							)}
						</form.Field>

						<form.Field name="addressLine2">
							{(field) => (
								<div>
									<Label htmlFor="addressLine2">
										{t("checkout.shipping.form.addressLine2")}
									</Label>
									<Input
										id="addressLine2"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
								</div>
							)}
						</form.Field>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<form.Field name="city">
								{(field) => (
									<div>
										<Label htmlFor="city">
											{t("checkout.shipping.form.city")} *
										</Label>
										<Input
											id="city"
											value={field.state.value}
											onChange={(e) => field.handleChange(e.target.value)}
											onBlur={field.handleBlur}
										/>
										{field.state.meta.errors.map((error, i) => (
											<p key={i} className="text-sm text-destructive mt-1">
												{error}
											</p>
										))}
									</div>
								)}
							</form.Field>

							<form.Field name="district">
								{(field) => (
									<div>
										<Label htmlFor="district">
											{t("checkout.shipping.form.district")} *
										</Label>
										<DistrictSelect
											value={field.state.value}
											onChange={field.handleChange}
										/>
										{field.state.meta.errors.map((error, i) => (
											<p key={i} className="text-sm text-destructive mt-1">
												{error}
											</p>
										))}
									</div>
								)}
							</form.Field>
						</div>

						<form.Field name="postalCode">
							{(field) => (
								<div>
									<Label htmlFor="postalCode">
										{t("checkout.shipping.form.postalCode")}
									</Label>
									<Input
										id="postalCode"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
								</div>
							)}
						</form.Field>

						<form.Field name="deliveryInstructions">
							{(field) => (
								<div>
									<Label htmlFor="deliveryInstructions">
										{t("checkout.shipping.form.deliveryInstructions")}
									</Label>
									<Textarea
										id="deliveryInstructions"
										rows={3}
										placeholder={t(
											"checkout.shipping.form.deliveryInstructionsPlaceholder",
										)}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
								</div>
							)}
						</form.Field>

						<div className="flex gap-3">
							<Button
								type="button"
								variant="outline"
								onClick={() => setShowAddressForm(false)}
							>
								{t("checkout.back")}
							</Button>
							<Button
								type="submit"
								disabled={createAddressMutation.isPending}
								className="flex-1"
							>
								{createAddressMutation.isPending && (
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								)}
								{t("checkout.shipping.saveAddress")}
							</Button>
						</div>
					</form>
				</Card>
			)}

		</div>
	);
}
