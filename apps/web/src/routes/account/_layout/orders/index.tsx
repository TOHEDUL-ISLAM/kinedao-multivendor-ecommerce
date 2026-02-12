import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { getUser } from "@/functions/get-user";
import { useTranslation } from "@/hooks/use-translation";
import { api } from "@/lib/api-client";
import { z } from "zod";
import { Button, Pagination, Tabs, Select, Group } from "@mantine/core";
import { Package2, ShoppingBag, Store, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const ordersSearchSchema = z.object({
	status: z.enum(["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]).optional().default("all"),
	dateRange: z.enum(["30d", "6mo", "all"]).optional().default("all"),
	page: z.coerce.number().min(1).optional().default(1),
});

export const Route = createFileRoute("/account/_layout/orders/")({
	component: OrderHistoryPage,
	validateSearch: ordersSearchSchema,
	beforeLoad: async () => {
		const session = await getUser();
		if (!session) {
			throw redirect({ to: "/login", search: { redirect: "/account/orders" } });
		}
		return { session };
	},
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => {
		try {
			const response = await api.orders.$get({
				query: {
					status: deps.status || "all",
					dateRange: deps.dateRange || "all",
					page: String(deps.page || 1),
					limit: "10",
				},
			})

			if (!response.ok) {
				console.error("Orders API error:", response.status, response.statusText);
				return {
					orders: [],
					total: 0,
					page: deps.page || 1,
					totalPages: 0,
				}
			}

			const data = await response.json();
			return data;
		} catch (error) {
			console.error("Failed to load orders:", error);
			return {
				orders: [],
				total: 0,
				page: deps.page || 1,
				totalPages: 0,
			}
		}
	},
});

function OrderHistoryPage() {
	const { t, language } = useTranslation();
	const navigate = Route.useNavigate();
	const search = Route.useSearch();
	const data = Route.useLoaderData();

	if (!data || !data.orders) {
		return (
			<div className="container max-w-6xl mx-auto px-4 py-8">
				<div className="text-center">Loading...</div>
			</div>
		)
	}

	const formatPrice = (paisa: number) => {
		const amount = paisa / 100;
		return language === "bn"
			? `৳ ${amount.toLocaleString("bn-BD")}`
			: `৳ ${amount.toLocaleString("en-BD")}`;
	}

	const handleStatusChange = (value: string | null) => {
		if (value) {
			navigate({
				search: { ...search, status: value as any, page: 1 },
			})
		}
	}

	const handleDateRangeChange = (value: string | null) => {
		if (value) {
			navigate({
				search: { ...search, dateRange: value as any, page: 1 },
			})
		}
	}

	const handlePageChange = (page: number) => {
		navigate({
			search: { ...search, page },
		})
	}

	const getStatusBadge = (status: string) => {
		const badges: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
			pending: { label: t("order.detail.status.pending"), variant: "secondary" },
			confirmed: { label: t("order.detail.status.confirmed"), variant: "default" },
			processing: { label: t("order.detail.status.processing"), variant: "default" },
			shipped: { label: t("order.detail.status.shipped"), variant: "default" },
			delivered: { label: t("order.detail.status.delivered"), variant: "default" },
			cancelled: { label: t("order.detail.status.cancelled"), variant: "destructive" },
		}
		const badge = badges[status] || badges.pending;
		return <Badge variant={badge.variant}>{badge.label}</Badge>;
	}

	return (
		<div className="bg-gray-50 min-h-screen">
			<div className="container max-w-7xl mx-auto px-4 py-6">
				{/* Header */}
				<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<h1 className="text-2xl font-bold">{t("orders.title")}</h1>
					
					<Group>
						<Select
							leftSection={<Calendar size={16} />}
							placeholder="Date Range"
							value={search.dateRange || "all"}
							onChange={handleDateRangeChange}
							data={[
								{ value: "all", label: t("orders.filter.date.all") },
								{ value: "30d", label: t("orders.filter.date.30d") },
								{ value: "6mo", label: t("orders.filter.date.6mo") },
							]}
							className="w-48"
						/>
					</Group>
				</div>

				{/* Tabs */}
				<div className="mb-6">
					<Tabs value={search.status || "all"} onChange={handleStatusChange}>
						<Tabs.List className="bg-white border-b overflow-x-auto flex-nowrap">
							<Tabs.Tab value="all">{t("orders.filter.all")}</Tabs.Tab>
							<Tabs.Tab value="pending">{t("orders.filter.pending")}</Tabs.Tab>
							<Tabs.Tab value="shipped">{t("orders.filter.shipped")}</Tabs.Tab>
							<Tabs.Tab value="delivered">{t("orders.filter.delivered")}</Tabs.Tab>
						</Tabs.List>
					</Tabs>
				</div>

				{/* Search Bar */}
				<div className="mb-6">
					<Input
						placeholder={t("orders.orderNumber") + ", " + t("orders.viewDetails")}
						className="max-w-xl bg-white"
					/>
				</div>

				{/* Orders List or Empty State */}
				{data.orders.length === 0 ? (
					<Card className="p-12 text-center bg-white">
						<div className="flex flex-col items-center gap-4">
							<div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
								<ShoppingBag className="w-8 h-8 text-gray-400" />
							</div>
							<div>
								<h3 className="text-lg font-semibold mb-1">{t("orders.empty")}</h3>
								<p className="text-gray-500 mb-4">{t("orders.emptyDesc")}</p>
								<Button component={Link} to="/">
									{t("orders.startShopping")}
								</Button>
							</div>
						</div>
					</Card>
				) : (
					<>
						{/* Order Cards - Daraz Style */}
						<div className="space-y-4 mb-8">
							{data.orders.map((order) => (
								<Card key={order.id} className="bg-white p-0 overflow-hidden hover:shadow-lg transition-shadow border border-gray-200">
									{/* Vendor Header */}
									<div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
										<div className="flex items-center gap-2">
											<Store className="w-4 h-4 text-gray-600" />
											<span className="font-semibold text-sm">{order.vendorName}</span>
										</div>
										<div className="flex items-center gap-3">
											<span className="text-xs text-gray-500">
												{new Date(order.createdAt).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
													year: "numeric",
													month: "short",
													day: "numeric"
												})}
											</span>
											{getStatusBadge(order.status)}
										</div>
									</div>

									{/* Order Items */}
									{(order.items && order.items.length > 0) ? (
										<Link
											to="/account/orders/$orderId"
											params={{ orderId: order.id }}
											className="block hover:bg-gray-50 transition-colors"
										>
											{order.items.map((item, index) => (
												<div key={index} className="flex items-center gap-4 px-5 py-4 border-b last:border-b-0">
													{/* Product Image */}
													{item.productSnapshot?.image ? (
														<img
															src={item.productSnapshot.image}
															alt={item.productSnapshot.title}
															className="w-20 h-20 object-cover rounded border"
														/>
													) : (
														<div className="w-20 h-20 bg-gray-100 rounded border flex items-center justify-center">
															<Package2 className="w-8 h-8 text-gray-400" />
														</div>
													)}

													{/* Product Details */}
													<div className="flex-1 min-w-0">
														<h3 className="text-sm font-medium line-clamp-2 mb-1">
															{language === "bn" && item.productSnapshot?.titleBn
																? item.productSnapshot.titleBn
																: item.productSnapshot?.title || "Product"}
														</h3>
														{item.productSnapshot?.ageRange && (
															<Badge variant="outline" className="text-xs mb-1">
																{item.productSnapshot.ageRange}
															</Badge>
														)}
													</div>

													{/* Price & Quantity */}
													<div className="text-right">
														<div className="text-sm font-semibold mb-1">
															{formatPrice(item.lineTotal)}
														</div>
														<div className="text-xs text-gray-500">
															{t("checkout.qty")}: {item.quantity}
														</div>
													</div>
												</div>
											))}

											{/* Show more items indicator */}
											{order.itemCount > order.items.length && (
												<div className="px-5 py-2 text-sm text-gray-500 text-center border-t bg-gray-50">
													+{order.itemCount - order.items.length} {t("common.items")}
												</div>
											)}
										</Link>
									) : (
										<div className="px-5 py-4 text-center text-gray-500">
											No items in this order
										</div>
									)}

									{/* Order Footer */}
									<div className="px-5 py-3 border-t bg-white flex items-center justify-between">
										<div className="text-sm text-gray-600">
											{order.orderNumber}
										</div>
										<div className="flex items-center gap-4">
											<div className="text-right">
												<div className="text-xs text-gray-500 mb-1">{t("checkout.total")}</div>
												<div className="text-lg font-bold text-primary">
													{formatPrice(order.total)}
												</div>
											</div>
										</div>
									</div>
								</Card>
							))}
						</div>

						{/* Pagination */}
						{data.totalPages > 1 && (
							<div className="flex justify-center pb-10">
								<Pagination
									total={data.totalPages}
									value={search.page || 1}
									onChange={handlePageChange}
									color="teal"
									size="lg"
									radius="xl"
									withEdges
								/>
							</div>
						)}
					</>
				)}
			</div>
		</div>
	)
}
