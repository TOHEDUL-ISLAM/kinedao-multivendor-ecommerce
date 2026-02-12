import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
	Badge,
	Button,
	Card,
	Group,
	Loader,
	Pagination,
	Paper,
	Progress,
	Select,
	SimpleGrid,
	Stack,
	Table,
	Text,
	Title,
} from "@mantine/core";
import { RefreshCw, Star } from "lucide-react";
import { api } from "@/lib/api-client";
import type {
	AdminReviewAnalyticsDTO,
	AdminReviewListResponseDTO,
} from "@kineDao.com/api-types/reviews";

export const Route = createFileRoute("/admin/_layout/reviews")({
	component: AdminReviewsPage,
});

function renderStars(rating: number) {
	return (
		<Group gap={2} wrap="nowrap">
			{[1, 2, 3, 4, 5].map((star) => (
				<Star
					key={star}
					size={14}
					style={{
						fill: star <= rating ? "#f59e0b" : "transparent",
						color: star <= rating ? "#f59e0b" : "#cbd5e1",
					}}
				/>
			))}
		</Group>
	);
}

async function fetchAnalytics(): Promise<AdminReviewAnalyticsDTO> {
	const response = await api.admin.reviews.analytics.$get({
		query: { days: "30" },
	});
	if (!response.ok) {
		throw new Error("Failed to fetch analytics");
	}
	return response.json();
}

async function fetchReviews(page: number, status: string): Promise<AdminReviewListResponseDTO> {
	const response = await api.admin.reviews.$get({
		query: {
			page: String(page),
			limit: "12",
			sort: "recent",
			status: status as "all" | "published" | "hidden" | "removed",
		},
	});
	if (!response.ok) {
		throw new Error("Failed to fetch reviews");
	}
	return response.json();
}

function AdminReviewsPage() {
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<string>("all");
	const queryClient = useQueryClient();

	const analyticsQuery = useQuery({
		queryKey: ["admin-reviews-analytics"],
		queryFn: fetchAnalytics,
	});

	const reviewsQuery = useQuery({
		queryKey: ["admin-reviews", page, status],
		queryFn: () => fetchReviews(page, status),
	});

	const moderateMutation = useMutation({
		mutationFn: async ({ reviewId, nextStatus }: { reviewId: string; nextStatus: "published" | "hidden" | "removed" }) => {
			const response = await api.admin.reviews[":reviewId"].moderate.$patch({
				param: { reviewId },
				json: {
					status: nextStatus,
					moderationReason: `Status changed to ${nextStatus} by admin`,
				},
			});
			if (!response.ok) {
				throw new Error("Failed to moderate review");
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
			queryClient.invalidateQueries({ queryKey: ["admin-reviews-analytics"] });
		},
	});

	const analytics = analyticsQuery.data;
	const reviewList = reviewsQuery.data;

	return (
		<Stack gap="xl">
			<Group justify="space-between" align="center">
				<Title order={2}>Reviews Analytics</Title>
				<Button
					leftSection={<RefreshCw size={16} />}
					variant="light"
					onClick={() => {
						analyticsQuery.refetch();
						reviewsQuery.refetch();
					}}
				>
					Refresh
				</Button>
			</Group>

			{analyticsQuery.isLoading ? (
				<Paper withBorder radius="md" p="xl">
					<Group justify="center">
						<Loader size="sm" />
					</Group>
				</Paper>
			) : (
				<SimpleGrid cols={{ base: 1, md: 2, lg: 5 }} spacing="md">
					<Card withBorder radius="md" p="lg">
						<Text c="dimmed" size="sm">
							Total Reviews
						</Text>
						<Title order={2} mt={8}>
							{analytics?.totalReviews ?? 0}
						</Title>
					</Card>
					<Card withBorder radius="md" p="lg">
						<Text c="dimmed" size="sm">
							Published
						</Text>
						<Title order={2} mt={8}>
							{analytics?.publishedReviews ?? 0}
						</Title>
					</Card>
					<Card withBorder radius="md" p="lg">
						<Text c="dimmed" size="sm">
							Hidden/Removed
						</Text>
						<Title order={2} mt={8}>
							{analytics?.hiddenOrRemovedReviews ?? 0}
						</Title>
					</Card>
					<Card withBorder radius="md" p="lg">
						<Text c="dimmed" size="sm">
							Average Rating
						</Text>
						<Title order={2} mt={8}>
							{analytics?.averageRating.toFixed(2) ?? "0.00"}
						</Title>
						{renderStars(Math.round(analytics?.averageRating ?? 0))}
					</Card>
					<Card withBorder radius="md" p="lg">
						<Stack gap={6}>
							{analytics?.distribution.map((row) => (
								<Group key={row.stars} gap="xs" wrap="nowrap">
									<Text size="sm" w={20}>
										{row.stars}
									</Text>
									<Progress value={row.percentage} style={{ flex: 1 }} color="yellow" />
									<Text size="sm" w={36} ta="right">
										{row.percentage}%
									</Text>
								</Group>
							))}
						</Stack>
					</Card>
				</SimpleGrid>
			)}

			<Card withBorder radius="md" p="lg">
				<Group justify="space-between" mb="md">
					<Title order={4}>All Reviews</Title>
					<Select
						value={status}
						onChange={(value) => {
							setPage(1);
							setStatus(value || "all");
						}}
						data={[
							{ value: "all", label: "All" },
							{ value: "published", label: "Published" },
							{ value: "hidden", label: "Hidden" },
							{ value: "removed", label: "Removed" },
						]}
						w={160}
					/>
				</Group>

				{reviewsQuery.isLoading ? (
					<Group justify="center" py="xl">
						<Loader size="sm" />
					</Group>
				) : (
					<>
						<Table striped highlightOnHover withTableBorder>
							<Table.Thead>
								<Table.Tr>
									<Table.Th>Product</Table.Th>
									<Table.Th>Customer</Table.Th>
									<Table.Th>Rating</Table.Th>
									<Table.Th>Status</Table.Th>
									<Table.Th>Review</Table.Th>
									<Table.Th>Action</Table.Th>
								</Table.Tr>
							</Table.Thead>
							<Table.Tbody>
								{reviewList?.reviews.map((review) => (
									<Table.Tr key={review.id}>
										<Table.Td>
											<Stack gap={2}>
												<Text fw={600}>{review.productTitle}</Text>
												<Text size="xs" c="dimmed">
													{review.vendorName}
												</Text>
											</Stack>
										</Table.Td>
										<Table.Td>
											<Stack gap={2}>
												<Text fw={500}>{review.author.name}</Text>
												<Text size="xs" c="dimmed">
													{review.author.email}
												</Text>
											</Stack>
										</Table.Td>
										<Table.Td>{renderStars(review.rating)}</Table.Td>
										<Table.Td>
											<Badge
												color={
													review.status === "published"
														? "green"
														: review.status === "hidden"
															? "yellow"
															: "red"
												}
											>
												{review.status}
											</Badge>
										</Table.Td>
										<Table.Td>
											<Text lineClamp={2}>{review.content}</Text>
										</Table.Td>
										<Table.Td>
											<Group gap={6}>
												<Button
													size="xs"
													variant="light"
													onClick={() =>
														moderateMutation.mutate({
															reviewId: review.id,
															nextStatus: "published",
														})
													}
												>
													Publish
												</Button>
												<Button
													size="xs"
													variant="outline"
													color="orange"
													onClick={() =>
														moderateMutation.mutate({
															reviewId: review.id,
															nextStatus: "hidden",
														})
													}
												>
													Hide
												</Button>
											</Group>
										</Table.Td>
									</Table.Tr>
								))}
							</Table.Tbody>
						</Table>
						<Group justify="flex-end" mt="md">
							<Pagination
								value={page}
								onChange={setPage}
								total={Math.max(1, reviewList?.totalPages ?? 1)}
							/>
						</Group>
					</>
				)}
			</Card>
		</Stack>
	);
}
