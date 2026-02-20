import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/lib/api-client";
import { Button, Card, Text, Flex, Stack, Textarea, Badge, Modal, Group, Loader, Center } from "@mantine/core";
import { ArrowLeft, MapPin, Package2, Star } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { StatusTimeline } from "@/components/orders/status-timeline";
import { Separator } from "@/components/ui/separator";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrderDetailDTO } from "@kineDao.com/api-types/checkout";

export const Route = createFileRoute("/account/_layout/orders/$orderId")({
	component: OrderDetailPage,
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
	},
});

function OrderDetailPage() {
	const { t, language } = useTranslation();
	const navigate = useNavigate();
	const { orderId } = Route.useParams();
	const queryClient = useQueryClient();

	// All useState hooks before any early returns
	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [cancelling, setCancelling] = useState(false);
	const [reviewModalOpen, setReviewModalOpen] = useState(false);
	const [reviewRating, setReviewRating] = useState(5);
	const [reviewTitle, setReviewTitle] = useState("");
	const [reviewContent, setReviewContent] = useState("");
	const [selectedReviewItem, setSelectedReviewItem] = useState<{
		productId: string;
		productTitle: string;
	} | null>(null);

	const { data: order, isLoading, isError } = useQuery<OrderDetailDTO>({
		queryKey: ["order", orderId],
		queryFn: async () => {
			const response = await api.orders[":orderId"].$get({
				param: { orderId },
			});
			if (!response.ok) {
				throw new Error("Failed to load order");
			}
			return response.json() as Promise<OrderDetailDTO>;
		},
	});

	const isDelivered = order?.status === "delivered";
	const uniqueProductIds = useMemo(
		() => Array.from(new Set((order?.items ?? []).map((item) => item.productId))),
		[order?.items],
	);

	const { data: reviewEligibilityMap = {}, isLoading: reviewEligibilityLoading } =
		useQuery({
			queryKey: ["order-review-eligibility", orderId, ...uniqueProductIds],
			enabled: isDelivered && uniqueProductIds.length > 0,
			queryFn: async () => {
				const entries = await Promise.all(
					uniqueProductIds.map(async (productId) => {
						const response = await api.reviews.products[":productId"].eligibility.$get({
							param: { productId },
						});

						if (!response.ok) {
							return [
								productId,
								{
									canReview: false,
									reason: "not_available",
									remainingReviewSlots: 0,
								},
							] as const;
						}

						const data = await response.json();
						return [productId, data] as const;
					}),
				);

				return Object.fromEntries(entries) as Record<
					string,
					{
						canReview: boolean;
						reason: string;
						remainingReviewSlots: number;
					}
				>;
			},
		});

	const submitReviewMutation = useMutation({
		mutationFn: async () => {
			if (!selectedReviewItem) {
				throw new Error("No selected product");
			}

			const response = await api.reviews.$post({
				json: {
					productId: selectedReviewItem.productId,
					rating: reviewRating,
					title: reviewTitle || undefined,
					content: reviewContent,
				},
			});

			if (!response.ok) {
				const body = await response.json().catch(() => ({ error: "Failed to submit review" }));
				throw new Error(body.error || "Failed to submit review");
			}

			return response.json();
		},
		onSuccess: () => {
			toast.success("Review submitted successfully");
			setReviewModalOpen(false);
			setSelectedReviewItem(null);
			setReviewTitle("");
			setReviewContent("");
			setReviewRating(5);
			queryClient.invalidateQueries({
				queryKey: ["order-review-eligibility", orderId],
				exact: false,
			});
		},
		onError: (error) => {
			const message = error instanceof Error ? error.message : "Failed to submit review";
			toast.error(message);
		},
	});

	// Early returns after all hooks
	if (isLoading) {
		return (
			<Center py="xl">
				<Loader />
			</Center>
		);
	}

	if (isError || !order) {
		return (
			<div className="container max-w-5xl mx-auto px-4 py-8">
				<Button
					component={Link}
					to="/account/orders"
					variant="subtle"
					leftSection={<ArrowLeft className="w-4 h-4" />}
					className="mb-6"
				>
					{t("order.detail.backToOrders")}
				</Button>
				<Text c="dimmed">{t("orders.empty")}</Text>
			</div>
		);
	}

	const formatPrice = (paisa: number) => {
		const amount = paisa / 100;
		return language === "bn"
			? `৳${amount.toLocaleString("bn-BD")}`
			: `৳${amount.toLocaleString("en-BD")}`;
	}

	const handleCancelOrder = async () => {
		setCancelling(true);
		try {
			const response = await api.orders[":orderId"].cancel.$post({
				param: { orderId: order.id },
				json: { reason: cancelReason || undefined },
			})

			if (response.ok) {
				toast.success(t("order.detail.cancelled"));
				setCancelModalOpen(false);
				navigate({ to: "/account/orders" });
			} else {
				toast.error(t("order.detail.cancelError"));
			}
		} catch (error) {
			toast.error(t("order.detail.cancelError"));
		} finally {
			setCancelling(false);
		}
	}

	const handleOpenReviewModal = (item: (typeof order.items)[number]) => {
		setSelectedReviewItem({
			productId: item.productId,
			productTitle:
				language === "bn" && item.productSnapshot.titleBn
					? item.productSnapshot.titleBn
					: item.productSnapshot.title,
		});
		setReviewModalOpen(true);
	};

	return (
		<div className="container max-w-5xl mx-auto px-4 py-8">
			{/* Back Button */}
			<Button
				component={Link}
				to="/account/orders"
				variant="subtle"
				leftSection={<ArrowLeft className="w-4 h-4" />}
				className="mb-6"
			>
				{t("order.detail.backToOrders")}
			</Button>

			{/* Header */}
			<Flex justify="space-between" align="flex-start" className="mb-8">
				<div>
					<h1 className="text-2xl font-bold mb-2">{order.orderNumber}</h1>
					<Text c="dimmed">{order.vendorName}</Text>
				</div>
				<OrderStatusBadge status={order.status} />
			</Flex>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Left Column - Timeline & Items */}
				<div className="lg:col-span-2 space-y-6">
					{/* Timeline */}
					<StatusTimeline
						status={order.status}
						createdAt={order.createdAt}
						confirmedAt={order.confirmedAt}
						processingAt={order.processingAt}
						shippedAt={order.shippedAt}
						deliveredAt={order.deliveredAt}
						cancelledAt={order.cancelledAt}
					/>

					{/* Order Items */}
					<Card className="p-6">
						<h3 className="text-lg font-semibold mb-4">{t("order.detail.items")}</h3>
						{isDelivered && (
							<Text size="sm" c="dimmed" className="mb-4">
								This order is delivered. You can now review each product.
							</Text>
						)}
						<Stack gap="md">
								{order.items.map((item) => {
									const reviewEligibility = reviewEligibilityMap[item.productId];
									const canReview = reviewEligibility?.canReview ?? false;

									return (
										<div key={item.id} className="flex gap-4">
											{item.productSnapshot.image ? (
												<img
													src={item.productSnapshot.image}
													alt={item.productSnapshot.title}
													className="w-20 h-20 object-cover rounded"
												/>
											) : (
												<div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
													<Package2 className="w-8 h-8 text-muted-foreground" />
												</div>
											)}
											<div className="flex-1">
												<Text fw={500} className="mb-1">
													{language === "bn" && item.productSnapshot.titleBn
														? item.productSnapshot.titleBn
														: item.productSnapshot.title}
												</Text>
												{item.productSnapshot.ageRange && (
													<Badge size="sm" color="blue" variant="light" className="mb-2">
														{item.productSnapshot.ageRange}
													</Badge>
												)}
												<Flex justify="space-between" align="center">
													<Text size="sm" c="dimmed">
														{t("checkout.qty")}: {item.quantity}
													</Text>
													<Text fw={600}>{formatPrice(item.lineTotal)}</Text>
												</Flex>

												{isDelivered && (
													<Flex justify="flex-end" mt="xs">
														<Button
															size="xs"
															variant={canReview ? "light" : "subtle"}
															disabled={reviewEligibilityLoading || !canReview}
															onClick={() => handleOpenReviewModal(item)}
														>
															{reviewEligibilityLoading
																? "Checking review eligibility..."
																: canReview
																	? "Review Product"
																	: reviewEligibility?.reason === "already_reviewed"
																		? "Already Reviewed"
																		: "Review Unavailable"}
														</Button>
													</Flex>
												)}
											</div>
										</div>
									);
								})}
							</Stack>
						</Card>
				</div>

				{/* Right Column - Address & Payment */}
				<div className="space-y-6">
					{/* Shipping Address */}
					<Card className="p-5">
						<Flex align="center" gap="sm" className="mb-4">
							<MapPin className="w-5 h-5 text-primary" />
							<Text fw={600}>{t("checkout.deliveryAddress")}</Text>
						</Flex>
						<Stack gap="xs">
							<Text fw={500}>{order.shippingAddress.fullName}</Text>
							<Text size="sm" c="dimmed">
								{order.shippingAddress.phone}
							</Text>
							<Text size="sm" c="dimmed">
								{order.shippingAddress.addressLine1}
								{order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
							</Text>
							<Text size="sm" c="dimmed">
								{order.shippingAddress.city}, {order.shippingAddress.district}
								{order.shippingAddress.postalCode && ` ${order.shippingAddress.postalCode}`}
							</Text>
						</Stack>
					</Card>

					{/* Tracking Info */}
					<Card className="p-5">
						<Text fw={600} className="mb-3">
							{t("order.detail.trackingInfo")}
						</Text>
						{order.status === "shipped" || order.status === "delivered" ? (
							<Text size="sm" c="dimmed">
								{t("order.detail.estimatedDelivery")}: {order.estimatedDelivery}
							</Text>
						) : (
							<Text size="sm" c="dimmed">
								{t("order.detail.noTracking")}
							</Text>
						)}
					</Card>

					{/* Payment Breakdown */}
					<Card className="p-5">
						<Text fw={600} className="mb-4">
							{t("order.detail.paymentBreakdown")}
						</Text>
						<Stack gap="sm">
							<Flex justify="space-between">
								<Text size="sm" c="dimmed">
									{t("checkout.subtotal")}
								</Text>
								<Text size="sm">{formatPrice(order.subtotal)}</Text>
							</Flex>
							<Flex justify="space-between">
								<Text size="sm" c="dimmed">
									{t("checkout.shipping")}
								</Text>
								<Text size="sm">{formatPrice(order.shippingCost)}</Text>
							</Flex>
							{order.codFee > 0 && (
								<Flex justify="space-between">
									<Text size="sm" c="dimmed">
										COD Fee
									</Text>
									<Text size="sm">{formatPrice(order.codFee)}</Text>
								</Flex>
							)}
							<Separator className="my-2" />
							<Flex justify="space-between">
								<Text fw={700}>{t("checkout.total")}</Text>
								<Text fw={700} className="text-primary">
									{formatPrice(order.total)}
								</Text>
							</Flex>
						</Stack>
					</Card>

					{/* Action Buttons */}
					<Stack gap="sm">
						{order.status === "pending" && (
							<Button
								color="red"
								variant="light"
								fullWidth
								onClick={() => setCancelModalOpen(true)}
							>
								{t("order.detail.cancelOrder")}
							</Button>
						)}
						<Button component={Link} to="/contact" variant="outline" fullWidth>
							{t("order.detail.contactSupport")}
						</Button>
					</Stack>
				</div>
			</div>

			{/* Cancel Order Modal */}
			<Modal
				opened={cancelModalOpen}
				onClose={() => setCancelModalOpen(false)}
				title={t("order.detail.cancelOrder")}
				centered
			>
				<Stack gap="md">
					<Text>{t("order.detail.cancelConfirm")}</Text>
					<Textarea
						label={t("order.detail.cancelReason")}
						placeholder={t("order.detail.cancelReason")}
						value={cancelReason}
						onChange={(e) => setCancelReason(e.currentTarget.value)}
						rows={3}
					/>
					<Group justify="flex-end">
						<Button variant="subtle" onClick={() => setCancelModalOpen(false)}>
							{t("common.close")}
						</Button>
						<Button
							color="red"
							onClick={handleCancelOrder}
							loading={cancelling}
							disabled={cancelling}
						>
							{cancelling ? t("order.detail.cancelling") : t("order.detail.cancelOrder")}
						</Button>
					</Group>
					</Stack>
				</Modal>

			{/* Review Product Modal */}
			<Modal
				opened={reviewModalOpen}
				onClose={() => setReviewModalOpen(false)}
				title="Review Product"
				centered
			>
				<Stack gap="md">
					<Text fw={600}>{selectedReviewItem?.productTitle}</Text>
					<Flex align="center" gap="xs">
						<Text size="sm" c="dimmed">
							Rating:
						</Text>
						<Group gap={4}>
							{[1, 2, 3, 4, 5].map((star) => (
								<button
									key={star}
									type="button"
									onClick={() => setReviewRating(star)}
									className="cursor-pointer"
								>
									<Star
										size={18}
										className={
											star <= reviewRating
												? "fill-amber-400 text-amber-400"
												: "text-gray-300"
										}
									/>
								</button>
							))}
						</Group>
					</Flex>

					<Textarea
						label="Title (optional)"
						placeholder="Short review title"
						value={reviewTitle}
						onChange={(e) => setReviewTitle(e.currentTarget.value)}
						rows={2}
					/>
					<Textarea
						label="Your Review"
						placeholder="Share your experience with this product"
						value={reviewContent}
						onChange={(e) => setReviewContent(e.currentTarget.value)}
						rows={4}
					/>

					<Group justify="flex-end">
						<Button variant="subtle" onClick={() => setReviewModalOpen(false)}>
							Cancel
						</Button>
						<Button
							onClick={() => submitReviewMutation.mutate()}
							loading={submitReviewMutation.isPending}
							disabled={reviewContent.trim().length < 8}
						>
							Submit Review
						</Button>
					</Group>
				</Stack>
			</Modal>
		</div>
	)
}
