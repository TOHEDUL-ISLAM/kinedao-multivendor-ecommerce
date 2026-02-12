"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	BadgeCheck,
	ChevronDown,
	ChevronUp,
	Filter,
	Share2,
	Star,
	ThumbsDown,
	ThumbsUp,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface ProductReviewsSectionProps {
	productId: string;
	className?: string;
}

export function ProductReviewsSection({ productId, className }: ProductReviewsSectionProps) {
	const { t } = useTranslation();
	const queryClient = useQueryClient();

	const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
	const [isFilterOpen, setIsFilterOpen] = useState(true);
	const [newRating, setNewRating] = useState(5);
	const [newTitle, setNewTitle] = useState("");
	const [newContent, setNewContent] = useState("");
	const [sort, setSort] = useState<"recent" | "highest" | "lowest" | "helpful">("recent");

	const summaryQuery = useQuery({
		queryKey: ["reviews-summary", productId],
		queryFn: async () => {
			const response = await api.reviews.products[":productId"].summary.$get({
				param: { productId },
			});
			if (!response.ok) {
				throw new Error("Failed to load review summary");
			}
			return response.json();
		},
	});

	const reviewsQuery = useQuery({
		queryKey: ["reviews-list", productId, sort],
		queryFn: async () => {
			const response = await api.reviews.products[":productId"].$get({
				param: { productId },
				query: {
					page: "1",
					limit: "30",
					sort,
				},
			});
			if (!response.ok) {
				throw new Error("Failed to load reviews");
			}
			return response.json();
		},
	});

	const eligibilityQuery = useQuery({
		queryKey: ["review-eligibility", productId],
		queryFn: async () => {
			const response = await api.reviews.products[":productId"].eligibility.$get({
				param: { productId },
			});
			if (!response.ok) {
				throw new Error("Failed to load eligibility");
			}
			return response.json();
		},
	});

	const createReviewMutation = useMutation({
		mutationFn: async () => {
			const response = await api.reviews.$post({
				json: {
					productId,
					rating: newRating,
					title: newTitle || undefined,
					content: newContent,
				},
			});
			if (!response.ok) {
				const body = await response.json().catch(() => ({ error: "Failed to submit review" }));
				throw new Error(body.error || "Failed to submit review");
			}
			return response.json();
		},
		onSuccess: () => {
			toast.success("Review submitted");
			setNewTitle("");
			setNewContent("");
			queryClient.invalidateQueries({ queryKey: ["reviews-summary", productId] });
			queryClient.invalidateQueries({ queryKey: ["reviews-list", productId] });
			queryClient.invalidateQueries({ queryKey: ["review-eligibility", productId] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const voteMutation = useMutation({
		mutationFn: async ({ reviewId, voteType }: { reviewId: string; voteType: "helpful" | "not_helpful" }) => {
			const response = await api.reviews[":reviewId"].vote.$post({
				param: { reviewId },
				json: { voteType },
			});
			if (!response.ok) {
				const body = await response.json().catch(() => ({ error: "Failed to submit vote" }));
				throw new Error(body.error || "Failed to submit vote");
			}
			return response.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["reviews-list", productId] });
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const summary = summaryQuery.data;
	const reviews = reviewsQuery.data?.items ?? [];

	const filteredReviews = useMemo(() => {
		if (selectedRatings.length === 0) return reviews;
		return reviews.filter((review) => selectedRatings.includes(review.rating));
	}, [reviews, selectedRatings]);

	const maxCount = Math.max(...(summary?.distribution.map((d) => d.count) ?? [1]));
	const eligibility = eligibilityQuery.data;
	const canReview = eligibility?.canReview ?? false;

	const handleRatingFilter = (rating: number) => {
		setSelectedRatings((prev) =>
			prev.includes(rating)
				? prev.filter((r) => r !== rating)
				: [...prev, rating],
		);
	};

	return (
		<section className={cn("py-8", className)}>
			<h2 className="text-xl font-bold mb-6">{t("reviews.title")}</h2>

			<div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
				<div className="space-y-6">
					<div className="flex items-center gap-4">
						<div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-warning bg-warning/10">
							<span className="text-2xl font-bold">
								{(summary?.averageRating ?? 0).toFixed(1)}
							</span>
						</div>
						<div>
							<div className="flex items-center gap-1">
								{[...Array(5)].map((_, i) => (
									<Star
										key={i}
										className={cn(
											"h-5 w-5",
											i < Math.round(summary?.averageRating ?? 0)
												? "fill-warning text-warning"
												: "text-muted-foreground/30",
										)}
									/>
								))}
							</div>
							<p className="text-sm text-muted-foreground mt-1">
								{t("reviews.fromReviews", { count: summary?.totalReviews ?? 0 })}
							</p>
						</div>
					</div>

					<div className="space-y-2">
						{summary?.distribution.map((item) => (
							<div key={item.stars} className="flex items-center gap-2">
								<span className="text-sm w-8">{item.stars}.0</span>
								<Star className="h-4 w-4 fill-warning text-warning" />
								<div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
									<div
										className="h-full bg-warning rounded-full transition-all"
										style={{
											width:
												maxCount > 0
													? `${(item.count / maxCount) * 100}%`
													: "0%",
										}}
									/>
								</div>
								<span className="text-sm text-muted-foreground w-12 text-right">
									{item.count}
								</span>
							</div>
						))}
					</div>

					<Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
						<CollapsibleTrigger asChild>
							<Button variant="ghost" className="w-full justify-between lg:hidden">
								<span className="flex items-center gap-2">
									<Filter className="h-4 w-4" />
									{t("reviews.filters")}
								</span>
								{isFilterOpen ? (
									<ChevronUp className="h-4 w-4" />
								) : (
									<ChevronDown className="h-4 w-4" />
								)}
							</Button>
						</CollapsibleTrigger>

						<CollapsibleContent className="lg:block">
							<div className="space-y-6 pt-4 lg:pt-0">
								<div>
									<h3 className="font-medium mb-3">{t("reviews.filterByRating")}</h3>
									<div className="space-y-2">
										{[5, 4, 3, 2, 1].map((rating) => (
											<label
												key={rating}
												className="flex items-center gap-2 cursor-pointer"
											>
												<Checkbox
													checked={selectedRatings.includes(rating)}
													onCheckedChange={() => handleRatingFilter(rating)}
												/>
												<div className="flex items-center gap-1">
													{[...Array(5)].map((_, i) => (
														<Star
															key={i}
															className={cn(
																"h-4 w-4",
																i < rating
																	? "fill-warning text-warning"
																	: "text-muted-foreground/30",
															)}
														/>
													))}
												</div>
											</label>
										))}
									</div>
								</div>

								<div>
									<h3 className="font-medium mb-3">Sort</h3>
									<div className="flex flex-wrap gap-2">
										{[
											{ value: "recent", label: "Recent" },
											{ value: "highest", label: "Highest" },
											{ value: "lowest", label: "Lowest" },
											{ value: "helpful", label: "Helpful" },
										].map((item) => (
											<Button
												key={item.value}
												size="sm"
												variant={sort === item.value ? "default" : "outline"}
												onClick={() => setSort(item.value as typeof sort)}
											>
												{item.label}
											</Button>
										))}
									</div>
								</div>
							</div>
						</CollapsibleContent>
					</Collapsible>
				</div>

				<div>
					<Tabs defaultValue="all" className="w-full">
						<div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
							<TabsList className="w-max min-w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
								<TabsTrigger
									value="all"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 text-sm whitespace-nowrap"
								>
									{t("reviews.allReviews")}
								</TabsTrigger>
								<TabsTrigger
									value="media"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 text-sm whitespace-nowrap"
								>
									{t("reviews.withMedia")}
								</TabsTrigger>
								<TabsTrigger
									value="description"
									className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 sm:px-4 py-2 text-sm whitespace-nowrap"
								>
									{t("reviews.withDescription")}
								</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value="all" className="pt-4 space-y-6">
							{eligibility && (
								<div className="border rounded-lg p-4">
									<div className="flex items-center justify-between mb-3">
										<h3 className="font-semibold">{t("reviews.writeReview")}</h3>
										<span className="text-xs text-muted-foreground">
											{canReview
												? `Eligible (${eligibility.remainingReviewSlots} left)`
												: eligibility.reason.replaceAll("_", " ")}
										</span>
									</div>
									<div className="space-y-3">
										<div className="flex items-center gap-2">
											<span className="text-sm">Rating</span>
											{[1, 2, 3, 4, 5].map((rating) => (
												<button
													key={rating}
													type="button"
													onClick={() => setNewRating(rating)}
												>
													<Star
														className={cn(
															"h-5 w-5",
															rating <= newRating
																? "fill-warning text-warning"
																: "text-muted-foreground/40",
														)}
													/>
												</button>
											))}
										</div>
										<Input
											placeholder="Review title (optional)"
											value={newTitle}
											onChange={(event) => setNewTitle(event.target.value)}
										/>
										<Textarea
											placeholder="Write your review"
											value={newContent}
											onChange={(event) => setNewContent(event.target.value)}
											rows={4}
										/>
										<Button
											onClick={() => createReviewMutation.mutate()}
											disabled={!canReview || newContent.trim().length < 8}
										>
											{createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
										</Button>
									</div>
								</div>
							)}

							<ReviewList
								reviews={filteredReviews}
								onHelpful={(reviewId) =>
									voteMutation.mutate({ reviewId, voteType: "helpful" })
								}
								onNotHelpful={(reviewId) =>
									voteMutation.mutate({ reviewId, voteType: "not_helpful" })
								}
							/>
						</TabsContent>

						<TabsContent value="media" className="pt-4">
							<ReviewList reviews={[]} onHelpful={() => {}} onNotHelpful={() => {}} />
						</TabsContent>

						<TabsContent value="description" className="pt-4">
							<ReviewList
								reviews={filteredReviews.filter((review) => review.content.length > 50)}
								onHelpful={(reviewId) =>
									voteMutation.mutate({ reviewId, voteType: "helpful" })
								}
								onNotHelpful={(reviewId) =>
									voteMutation.mutate({ reviewId, voteType: "not_helpful" })
								}
							/>
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</section>
	);
}

interface ReviewListProps {
	reviews: Array<{
		id: string;
		rating: number;
		title: string | null;
		content: string;
		createdAt: string;
		isVerifiedPurchase: boolean;
		author: {
			name: string;
			avatar: string | null;
		};
		helpfulCount: number;
		notHelpfulCount: number;
		viewerVote: "helpful" | "not_helpful" | null;
		reply: {
			content: string;
			vendorName: string;
		} | null;
	}>;
	onHelpful: (id: string) => void;
	onNotHelpful: (id: string) => void;
}

function ReviewList({ reviews, onHelpful, onNotHelpful }: ReviewListProps) {
	const { t } = useTranslation();

	if (reviews.length === 0) {
		return (
			<div className="text-center py-8 text-muted-foreground">
				{t("reviews.noReviews")}
			</div>
		);
	}

	return (
		<div className="space-y-5">
			{reviews.map((review) => (
				<div
					key={review.id}
					className="rounded-2xl border border-emerald-100/70 bg-gradient-to-b from-white to-emerald-50/30 p-5 shadow-sm"
				>
					<div className="flex items-start gap-4">
						<Avatar className="h-12 w-12 ring-2 ring-emerald-100">
							<AvatarImage src={review.author.avatar || undefined} />
							<AvatarFallback className="text-sm font-semibold text-emerald-700 bg-emerald-100">
								{review.author.name
									.split(" ")
									.map((n) => n[0])
									.join("")}
							</AvatarFallback>
						</Avatar>

						<div className="flex-1 space-y-3">
							<div className="flex items-start justify-between gap-4">
								<div className="space-y-1">
									<div className="flex items-center gap-1">
										{[...Array(5)].map((_, i) => (
											<Star
												key={i}
												className={cn(
													"h-4 w-4",
													i < review.rating
														? "fill-warning text-warning"
														: "text-muted-foreground/30",
												)}
											/>
										))}
										<span className="ml-1 text-sm font-semibold text-foreground">
											{review.rating.toFixed(1)}
										</span>
									</div>
									<div className="flex flex-wrap items-center gap-2">
										<span className="text-lg font-semibold text-foreground">
											{review.author.name}
										</span>
										{review.isVerifiedPurchase && (
											<span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
												<BadgeCheck className="h-3.5 w-3.5 fill-emerald-100 text-emerald-600" />
												{t("reviews.verifiedPurchase")}
											</span>
										)}
									</div>
								</div>

								<span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
									{formatDistanceToNow(new Date(review.createdAt), {
										addSuffix: true,
									})}
								</span>
							</div>

							{review.title ? (
								<p className="text-sm font-semibold text-foreground">{review.title}</p>
							) : null}

							<p className="text-[15px] leading-7 text-foreground/90">
								{review.content}
							</p>

							{review.reply && (
								<div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
									<p className="text-xs font-semibold mb-1 text-emerald-700">
										{t("reviews.replyFrom", { vendor: review.reply.vendorName })}
									</p>
									<p className="text-sm text-emerald-900/90">{review.reply.content}</p>
								</div>
							)}

							<div className="flex items-center gap-2 pt-1">
								<button
									onClick={() => onHelpful(review.id)}
									className={cn(
										"flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors",
										review.viewerVote === "helpful"
											? "bg-emerald-100 text-emerald-700"
											: "bg-white/70 hover:bg-muted text-muted-foreground border border-border/70",
									)}
								>
									<ThumbsUp className="h-4 w-4" />
									<span>{review.helpfulCount}</span>
								</button>
								<button
									onClick={() => onNotHelpful(review.id)}
									className={cn(
										"flex items-center gap-1 rounded-full px-3 py-1.5 text-sm transition-colors",
										review.viewerVote === "not_helpful"
											? "bg-rose-100 text-rose-700"
											: "bg-white/70 hover:bg-muted text-muted-foreground border border-border/70",
									)}
								>
									<ThumbsDown className="h-4 w-4" />
									<span>{review.notHelpfulCount}</span>
								</button>
								<button className="p-2 rounded-full border border-border/70 bg-white/70 hover:bg-muted text-muted-foreground">
									<Share2 className="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				</div>
			))}
		</div>
	);
}
