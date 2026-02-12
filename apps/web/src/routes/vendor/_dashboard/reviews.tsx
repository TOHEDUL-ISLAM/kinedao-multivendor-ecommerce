import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDebouncedValue } from "@mantine/hooks";
import {
	ActionIcon,
	Avatar,
	Badge,
	Box,
	Button,
	Group,
	Loader,
	Pagination,
	Paper,
	Progress,
	Select,
	SimpleGrid,
	Stack,
	Text,
	TextInput,
	Textarea,
	ThemeIcon,
	Title,
} from "@mantine/core";
import {
	MessageSquareText,
	RefreshCw,
	Search,
	Star,
	UserCheck,
	Users,
	UserPlus,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { format } from "date-fns";
import { toast } from "sonner";
import { useVendorTheme, vendorColors } from "@/lib/vendor-theme";
import type {
	VendorReviewListResponseDTO,
	VendorReviewOverviewDTO,
} from "@kineDao.com/api-types/reviews";

export const Route = createFileRoute("/vendor/_dashboard/reviews")({
	component: VendorReviewsPage,
});

type VendorReviewStatus = "all" | "published" | "hidden" | "removed";
type VendorReviewSort = "recent" | "highest" | "lowest" | "helpful";

function renderStars(rating: number, size = 14) {
	return (
		<Group gap={2} wrap="nowrap">
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					size={size}
					style={{
						fill: star <= rating ? "#f59e0b" : "transparent",
						color: star <= rating ? "#f59e0b" : "#cbd5e1",
					}}
				/>
			))}
		</Group>
	);
}

async function fetchOverview(): Promise<VendorReviewOverviewDTO> {
	const response = await api.vendorDashboard.reviews.overview.$get();
	if (!response.ok) {
		throw new Error("Failed to fetch review overview");
	}
	return response.json();
}

async function fetchReviews(params: {
	page: number;
	status: VendorReviewStatus;
	sort: VendorReviewSort;
	search?: string;
}): Promise<VendorReviewListResponseDTO> {
	const query: Record<string, string> = {
		page: String(params.page),
		limit: "10",
		sort: params.sort,
		status: params.status,
	};
	if (params.search) {
		query.search = params.search;
	}

	const response = await api.vendorDashboard.reviews.$get({
		query,
	});
	if (!response.ok) {
		throw new Error("Failed to fetch reviews");
	}
	return response.json();
}

function VendorReviewsPage() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [status, setStatus] = useState<VendorReviewStatus>("published");
	const [sort, setSort] = useState<VendorReviewSort>("recent");
	const [lastRefreshAt, setLastRefreshAt] = useState(() => new Date());
	const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const { isDark } = useVendorTheme();
	const queryClient = useQueryClient();

	const overviewQuery = useQuery({
		queryKey: ["vendor-reviews-overview"],
		queryFn: fetchOverview,
	});

	const reviewsQuery = useQuery({
		queryKey: ["vendor-reviews", page, status, sort, debouncedSearch],
		queryFn: () =>
			fetchReviews({
				page,
				status,
				sort,
				search: debouncedSearch || undefined,
			}),
	});

	const replyMutation = useMutation({
		mutationFn: async ({ reviewId, content }: { reviewId: string; content: string }) => {
			const response = await api.vendorDashboard.reviews[":reviewId"].reply.$post({
				param: { reviewId },
				json: { content },
			});
			if (!response.ok) {
				throw new Error("Failed to submit reply");
			}
			return response.json();
		},
		onSuccess: (_data, variables) => {
			toast.success("Reply posted successfully");
			setReplyDrafts((prev) => ({ ...prev, [variables.reviewId]: "" }));
			queryClient.invalidateQueries({ queryKey: ["vendor-reviews"] });
		},
		onError: (error) => {
			toast.error(error instanceof Error ? error.message : "Failed to submit reply");
		},
	});

	const overview = overviewQuery.data;
	const reviews = reviewsQuery.data;
	const reviewItems = reviews?.reviews ?? [];
	const distribution = overview?.distribution ?? [
		{ stars: 5, count: 0, percentage: 0 },
		{ stars: 4, count: 0, percentage: 0 },
		{ stars: 3, count: 0, percentage: 0 },
		{ stars: 2, count: 0, percentage: 0 },
		{ stars: 1, count: 0, percentage: 0 },
	];

	const handleRefresh = () => {
		setLastRefreshAt(new Date());
		void Promise.all([overviewQuery.refetch(), reviewsQuery.refetch()]);
	};

	return (
		<Stack gap="xl">
			<Paper
				withBorder
				radius="lg"
				p="lg"
				style={{
					background: vendorColors.card(isDark).background,
					border: vendorColors.card(isDark).border,
					boxShadow: vendorColors.card(isDark).boxShadow,
				}}
			>
				<Group justify="space-between" align="center" wrap="wrap" gap="md">
					<Title order={2} style={{ color: vendorColors.text.primary(isDark) }}>
						Reviews
					</Title>
					<Group gap="xs" wrap="wrap">
						<Group gap={6}>
							<Text size="sm" c={vendorColors.text.secondary(isDark)}>
								Data Refresh
							</Text>
							<ActionIcon
								variant="light"
								color="teal"
								onClick={handleRefresh}
								loading={overviewQuery.isFetching || reviewsQuery.isFetching}
							>
								<RefreshCw size={16} />
							</ActionIcon>
						</Group>
						<Badge variant="light" size="lg" color="gray">
							{format(lastRefreshAt, "MMMM d, yyyy hh:mm a")}
						</Badge>
					</Group>
				</Group>
			</Paper>

			{overviewQuery.isLoading ? (
				<Paper
					p="xl"
					radius="md"
					withBorder
					style={{
						background: vendorColors.card(isDark).background,
						border: vendorColors.card(isDark).border,
					}}
				>
					<Group justify="center">
						<Loader size="sm" />
					</Group>
				</Paper>
			) : overviewQuery.isError ? (
				<Paper
					p="xl"
					radius="md"
					withBorder
					style={{
						background: vendorColors.card(isDark).background,
						border: vendorColors.card(isDark).border,
					}}
				>
					<Text c="red">Failed to load review analytics.</Text>
				</Paper>
			) : (
				<>
					<SimpleGrid cols={{ base: 1, sm: 2, lg: 5 }} spacing="md">
						<Paper
							withBorder
							radius="md"
							p="lg"
							style={{
								background: vendorColors.card(isDark).background,
								border: vendorColors.card(isDark).border,
								boxShadow: vendorColors.card(isDark).boxShadow,
							}}
						>
							<Group justify="space-between" align="flex-start">
								<Box>
									<Text size="sm" c={vendorColors.text.secondary(isDark)}>
										Review Score
									</Text>
									<Title order={2} mt={8} style={{ color: vendorColors.text.primary(isDark) }}>
										{overview?.reviewScore.toFixed(1) ?? "0.0"}
									</Title>
								</Box>
								<ThemeIcon radius="md" size="lg" variant="light" color="yellow">
									<Star size={18} />
								</ThemeIcon>
							</Group>
							<Box mt="xs">{renderStars(Math.round(overview?.reviewScore ?? 0))}</Box>
						</Paper>

						<Paper
							withBorder
							radius="md"
							p="lg"
							style={{
								background: vendorColors.card(isDark).background,
								border: vendorColors.card(isDark).border,
								boxShadow: vendorColors.card(isDark).boxShadow,
							}}
						>
							<Group justify="space-between" align="flex-start">
								<Box>
									<Text size="sm" c={vendorColors.text.secondary(isDark)}>
										Total Customers
									</Text>
									<Title order={2} mt={8} style={{ color: vendorColors.text.primary(isDark) }}>
										{overview?.totalCustomers ?? 0}
									</Title>
								</Box>
								<ThemeIcon radius="md" size="lg" variant="light" color="teal">
									<Users size={18} />
								</ThemeIcon>
							</Group>
						</Paper>

						<Paper
							withBorder
							radius="md"
							p="lg"
							style={{
								background: vendorColors.card(isDark).background,
								border: vendorColors.card(isDark).border,
								boxShadow: vendorColors.card(isDark).boxShadow,
							}}
						>
							<Group justify="space-between" align="flex-start">
								<Box>
									<Text size="sm" c={vendorColors.text.secondary(isDark)}>
										New Customers
									</Text>
									<Title order={2} mt={8} style={{ color: vendorColors.text.primary(isDark) }}>
										{overview?.newCustomersPercent ?? 0}%
									</Title>
								</Box>
								<ThemeIcon radius="md" size="lg" variant="light" color="blue">
									<UserPlus size={18} />
								</ThemeIcon>
							</Group>
						</Paper>

						<Paper
							withBorder
							radius="md"
							p="lg"
							style={{
								background: vendorColors.card(isDark).background,
								border: vendorColors.card(isDark).border,
								boxShadow: vendorColors.card(isDark).boxShadow,
							}}
						>
							<Group justify="space-between" align="flex-start">
								<Box>
									<Text size="sm" c={vendorColors.text.secondary(isDark)}>
										Regular Customers
									</Text>
									<Title order={2} mt={8} style={{ color: vendorColors.text.primary(isDark) }}>
										{overview?.regularCustomersPercent ?? 0}%
									</Title>
								</Box>
								<ThemeIcon radius="md" size="lg" variant="light" color="pink">
									<UserCheck size={18} />
								</ThemeIcon>
							</Group>
						</Paper>

						<Paper
							withBorder
							radius="md"
							p="lg"
							style={{
								background: vendorColors.card(isDark).background,
								border: vendorColors.card(isDark).border,
								boxShadow: vendorColors.card(isDark).boxShadow,
							}}
						>
							<Stack gap={8}>
								{distribution.map((row) => (
									<Group key={row.stars} gap="xs" wrap="nowrap">
										<Text size="sm" w={16} c={vendorColors.text.secondary(isDark)}>
											{row.stars}
										</Text>
										<Star
											size={13}
											style={{ fill: "#f59e0b", color: "#f59e0b" }}
										/>
										<Progress value={row.percentage} style={{ flex: 1 }} color="yellow" />
										<Text size="sm" w={34} ta="right" c={vendorColors.text.primary(isDark)}>
											{row.percentage}%
										</Text>
									</Group>
								))}
							</Stack>
						</Paper>
					</SimpleGrid>

					<Paper
						withBorder
						radius="md"
						p="lg"
						style={{
							background: vendorColors.card(isDark).background,
							border: vendorColors.card(isDark).border,
							boxShadow: vendorColors.card(isDark).boxShadow,
						}}
					>
						<Stack gap="md">
							<Group justify="space-between" align="center" wrap="wrap">
								<Title order={4} style={{ color: vendorColors.text.primary(isDark) }}>
									Latest Accepted Reviews
								</Title>
								<Badge variant="light" color="teal">
									Recent
								</Badge>
							</Group>

							<Group gap="md" wrap="wrap" align="flex-end">
								<TextInput
									placeholder="Search customer, product, or review text"
									leftSection={<Search size={16} />}
									value={search}
									onChange={(event) => {
										setSearch(event.currentTarget.value);
										setPage(1);
									}}
									style={{ minWidth: 260, flex: 2 }}
									styles={{
										input: {
											backgroundColor: vendorColors.input(isDark).background,
											color: vendorColors.input(isDark).color,
											borderColor: isDark ? "oklch(0.3 0.02 260 / 0.4)" : undefined,
										},
									}}
								/>
								<Select
									label="Sort"
									value={sort}
									onChange={(value) => {
										setSort((value as VendorReviewSort) || "recent");
										setPage(1);
									}}
									data={[
										{ value: "recent", label: "Recent" },
										{ value: "highest", label: "Highest Rating" },
										{ value: "lowest", label: "Lowest Rating" },
										{ value: "helpful", label: "Most Helpful" },
									]}
									allowDeselect={false}
									style={{ minWidth: 180 }}
									styles={{
										input: {
											backgroundColor: vendorColors.input(isDark).background,
											color: vendorColors.input(isDark).color,
											borderColor: isDark ? "oklch(0.3 0.02 260 / 0.4)" : undefined,
										},
									}}
								/>
								<Select
									label="Status"
									value={status}
									onChange={(value) => {
										setStatus((value as VendorReviewStatus) || "published");
										setPage(1);
									}}
									data={[
										{ value: "published", label: "Published" },
										{ value: "all", label: "All" },
										{ value: "hidden", label: "Hidden" },
										{ value: "removed", label: "Removed" },
									]}
									allowDeselect={false}
									style={{ minWidth: 160 }}
									styles={{
										input: {
											backgroundColor: vendorColors.input(isDark).background,
											color: vendorColors.input(isDark).color,
											borderColor: isDark ? "oklch(0.3 0.02 260 / 0.4)" : undefined,
										},
									}}
								/>
							</Group>

							{reviewsQuery.isLoading ? (
								<Group justify="center" py="xl">
									<Loader size="sm" />
								</Group>
							) : reviewItems.length === 0 ? (
								<Paper
									withBorder
									radius="md"
									p="xl"
									style={{
										background: isDark ? "oklch(0.2 0.02 260)" : "oklch(0.99 0.005 120)",
										border: isDark
											? "1px dashed oklch(0.35 0.02 260 / 0.8)"
											: "1px dashed oklch(0.85 0.01 260 / 0.8)",
									}}
								>
									<Group justify="center" gap="xs">
										<MessageSquareText size={16} />
										<Text c={vendorColors.text.secondary(isDark)}>
											No reviews found for the selected filters.
										</Text>
									</Group>
								</Paper>
							) : (
								<Stack gap="sm">
									{reviewItems.map((review) => {
										const reviewDate = new Date(review.createdAt);
										const replyDraft = replyDrafts[review.id] || "";
										const replyLoading =
											replyMutation.isPending &&
											replyMutation.variables?.reviewId === review.id;

										return (
											<Paper
												key={review.id}
												withBorder
												radius="md"
												p="md"
												style={{
													background: isDark
														? "oklch(0.22 0.02 260 / 0.9)"
														: "oklch(1 0 0 / 0.75)",
													border: isDark
														? "1px solid oklch(0.3 0.02 260 / 0.55)"
														: "1px solid oklch(0.92 0.01 260 / 0.65)",
													transition: "all 160ms ease",
												}}
											>
												<Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
													<Group
														align="flex-start"
														wrap="nowrap"
														gap="md"
														style={{ flex: "1 1 620px", minWidth: 260 }}
													>
														<Avatar src={review.author.avatar ?? undefined} radius="md" size={44}>
															{review.author.name.charAt(0).toUpperCase()}
														</Avatar>

														<Stack gap={6} style={{ minWidth: 150 }}>
															<Text fw={700} style={{ color: vendorColors.text.primary(isDark) }}>
																{review.author.name}
															</Text>
															<Text size="xs" c={vendorColors.text.secondary(isDark)}>
																{review.author.email}
															</Text>
															<Group gap={6}>
																{renderStars(review.rating, 15)}
																<Text
																	size="sm"
																	fw={600}
																	style={{ color: vendorColors.text.primary(isDark) }}
																>
																	{review.rating.toFixed(1)}
																</Text>
															</Group>
														</Stack>

														<Stack gap={8} style={{ flex: 1, minWidth: 220 }}>
															<Text size="xs" c={vendorColors.text.secondary(isDark)}>
																Product: {review.productTitle}
															</Text>

															<Paper
																withBorder
																radius="sm"
																p="sm"
																style={{
																	background: isDark
																		? "oklch(0.2 0.02 250)"
																		: "oklch(0.995 0.003 140)",
																	border: isDark
																		? "1px solid oklch(0.32 0.02 250 / 0.6)"
																		: "1px solid oklch(0.92 0.01 260 / 0.65)",
																}}
															>
																<Text size="sm" style={{ color: vendorColors.text.primary(isDark) }}>
																	{review.content}
																</Text>
															</Paper>

															{review.reply ? (
																<Paper
																	radius="sm"
																	p="sm"
																	style={{
																		background: isDark
																			? "oklch(0.26 0.04 170 / 0.35)"
																			: "oklch(0.97 0.03 170 / 0.55)",
																		border: isDark
																			? "1px solid oklch(0.45 0.08 170 / 0.4)"
																			: "1px solid oklch(0.8 0.06 170 / 0.5)",
																	}}
																>
																	<Group gap={6} mb={4}>
																		<Badge size="xs" color="teal" variant="light">
																			Replied
																		</Badge>
																		<Text size="xs" c={vendorColors.text.secondary(isDark)}>
																			{review.reply.createdAt
																				? format(new Date(review.reply.createdAt), "dd MMM, hh:mm a")
																				: ""}
																		</Text>
																	</Group>
																	<Text size="sm" style={{ color: vendorColors.text.primary(isDark) }}>
																		{review.reply.content}
																	</Text>
																</Paper>
															) : (
																<Group align="flex-start" wrap="nowrap">
																	<Textarea
																		size="xs"
																		placeholder="Write a public reply to this customer"
																		minRows={2}
																		maxRows={4}
																		value={replyDraft}
																		onChange={(event) => {
																			const value = event.currentTarget.value ?? "";
																			setReplyDrafts((prev) => ({
																				...prev,
																				[review.id]: value,
																			}));
																		}}
																		style={{ flex: 1 }}
																		styles={{
																			input: {
																				backgroundColor: isDark
																					? "oklch(0.2 0.02 260)"
																					: "oklch(1 0 0)",
																				color: vendorColors.text.primary(isDark),
																				borderColor: isDark
																					? "oklch(0.32 0.02 260 / 0.8)"
																					: undefined,
																			},
																		}}
																	/>
																	<Button
																		size="xs"
																		variant="light"
																		loading={replyLoading}
																		disabled={replyDraft.trim().length < 2}
																		onClick={() =>
																			replyMutation.mutate({
																				reviewId: review.id,
																				content: replyDraft.trim(),
																			})
																		}
																	>
																		Reply
																	</Button>
																</Group>
															)}
														</Stack>
													</Group>

													<Stack
														gap={2}
														align="flex-end"
														style={{ minWidth: 120, marginLeft: "auto" }}
													>
														<Text size="sm" fw={700} style={{ color: vendorColors.text.primary(isDark) }}>
															{format(reviewDate, "dd/MM/yyyy")}
														</Text>
														<Text size="xs" c={vendorColors.text.secondary(isDark)}>
															{format(reviewDate, "hh:mm a")}
														</Text>
													</Stack>
												</Group>
											</Paper>
										);
									})}
								</Stack>
							)}

							<Group justify="flex-end" mt="sm">
								<Pagination
									value={page}
									onChange={setPage}
									total={Math.max(1, reviews?.totalPages ?? 1)}
								/>
							</Group>
						</Stack>
					</Paper>
				</>
			)}
		</Stack>
	);
}
