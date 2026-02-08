import { createFileRoute, redirect, Link, useNavigate } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/lib/api-client";
import { Button, Card, Text, Flex, Stack, Textarea, Badge, Modal, Group } from "@mantine/core";
import { ArrowLeft, MapPin, Package2 } from "lucide-react";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { StatusTimeline } from "@/components/orders/status-timeline";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/orders/$orderId")({
	component: OrderDetailPage,
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({ to: "/login" });
		}
		return { session };
	},
	loader: async ({ params }) => {
		try {
			const response = await api.orders[":orderId"].$get({
				param: { orderId: params.orderId },
			});

			if (!response.ok) {
				console.error("Order detail API error:", response.status, response.statusText);
				if (response.status === 404) {
					throw redirect({ to: "/account/orders", search: { error: "not-found" } });
				}
				if (response.status === 403) {
					throw redirect({ to: "/account/orders", search: { error: "access-denied" } });
				}
				throw redirect({ to: "/account/orders", search: { error: "failed" } });
			}

			return response.json();
		} catch (error) {
			console.error("Failed to load order:", error);
			throw redirect({ to: "/account/orders" });
		}
	},
});

function OrderDetailPage() {
	const { t, language } = useTranslation();
	const navigate = useNavigate();
	const order = Route.useLoaderData();
	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [cancelling, setCancelling] = useState(false);

	const formatPrice = (paisa: number) => {
		const amount = paisa / 100;
		return language === "bn"
			? `৳${amount.toLocaleString("bn-BD")}`
			: `৳${amount.toLocaleString("en-BD")}`;
	};

	const handleCancelOrder = async () => {
		setCancelling(true);
		try {
			const response = await api.orders[":orderId"].cancel.$post({
				param: { orderId: order.id },
				json: { reason: cancelReason || undefined },
			});

			if (response.ok) {
				toast.success(t("order.detail.cancelled"));
				setCancelModalOpen(false);
				// Navigate back to orders list
				navigate({ to: "/account/orders" });
			} else {
				toast.error(t("order.detail.cancelError"));
			}
		} catch (error) {
			toast.error(t("order.detail.cancelError"));
		} finally {
			setCancelling(false);
		}
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
						shippedAt={order.shippedAt}
						deliveredAt={order.deliveredAt}
						cancelledAt={order.cancelledAt}
					/>

					{/* Order Items */}
					<Card className="p-6">
						<h3 className="text-lg font-semibold mb-4">{t("order.detail.items")}</h3>
						<Stack gap="md">
							{order.items.map((item) => (
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
									</div>
								</div>
							))}
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
		</div>
	);
}
