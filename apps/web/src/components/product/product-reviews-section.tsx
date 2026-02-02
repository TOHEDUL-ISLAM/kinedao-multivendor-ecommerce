"use client";

import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, Share2, Filter, ChevronDown, ChevronUp } from "lucide-react";
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

// Mock review data - will be replaced with real API data
interface Review {
  id: string;
  rating: number;
  title: string;
  content: string;
  author: {
    name: string;
    avatar: string | null;
  };
  date: string;
  likes: number;
  dislikes: number;
  hasMedia: boolean;
  isLiked: boolean;
  isDisliked: boolean;
}

interface ReviewStats {
  average: number;
  total: number;
  distribution: {
    stars: number;
    count: number;
  }[];
}

const mockReviewStats: ReviewStats = {
  average: 4.5,
  total: 1238,
  distribution: [
    { stars: 5, count: 2523 },
    { stars: 4, count: 456 },
    { stars: 3, count: 89 },
    { stars: 2, count: 12 },
    { stars: 1, count: 0 },
  ],
};

const mockReviews: Review[] = [
  {
    id: "1",
    rating: 5,
    title: "This is amazing product I have.",
    content: "My baby loves this product! The quality is excellent and it's very safe. Highly recommended for new parents.",
    author: { name: "Daniel Deward", avatar: null },
    date: "2024-01-15",
    likes: 178,
    dislikes: 2,
    hasMedia: false,
    isLiked: false,
    isDisliked: false,
  },
  {
    id: "2",
    rating: 5,
    title: "This is amazing product I have.",
    content: "Perfect for my 6-month old. The material is soft and the design is beautiful.",
    author: { name: "Darlene Robertson", avatar: null },
    date: "2024-01-10",
    likes: 87,
    dislikes: 1,
    hasMedia: true,
    isLiked: false,
    isDisliked: false,
  },
  {
    id: "3",
    rating: 5,
    title: "This is amazing product I have.",
    content: "Great value for money. Shipping was fast and the packaging was secure.",
    author: { name: "Kathryn Murphy", avatar: null },
    date: "2024-01-05",
    likes: 45,
    dislikes: 0,
    hasMedia: false,
    isLiked: false,
    isDisliked: false,
  },
  {
    id: "4",
    rating: 5,
    title: "This is amazing product I have.",
    content: "Exceeded my expectations. Will definitely buy again from this seller.",
    author: { name: "Ronald Richards", avatar: null },
    date: "2024-01-02",
    likes: 32,
    dislikes: 0,
    hasMedia: true,
    isLiked: false,
    isDisliked: false,
  },
];

interface ProductReviewsSectionProps {
  productId: string;
  className?: string;
}

export function ProductReviewsSection({ className }: ProductReviewsSectionProps) {
  const { t } = useTranslation();
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const reviewTopics = [
    { id: "quality", label: t("reviews.topics.quality") },
    { id: "service", label: t("reviews.topics.service") },
    { id: "price", label: t("reviews.topics.price") },
    { id: "shipping", label: t("reviews.topics.shipping") },
    { id: "description", label: t("reviews.topics.description") },
  ];

  const maxCount = Math.max(...mockReviewStats.distribution.map((d) => d.count));

  const handleRatingFilter = (rating: number) => {
    setSelectedRatings((prev) =>
      prev.includes(rating)
        ? prev.filter((r) => r !== rating)
        : [...prev, rating]
    );
  };

  const handleTopicFilter = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  const handleLike = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              likes: review.isLiked ? review.likes - 1 : review.likes + 1,
              isLiked: !review.isLiked,
              isDisliked: false,
              dislikes: review.isDisliked ? review.dislikes - 1 : review.dislikes,
            }
          : review
      )
    );
  };

  const handleDislike = (reviewId: string) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              dislikes: review.isDisliked ? review.dislikes - 1 : review.dislikes + 1,
              isDisliked: !review.isDisliked,
              isLiked: false,
              likes: review.isLiked ? review.likes - 1 : review.likes,
            }
          : review
      )
    );
  };

  const filteredReviews = reviews.filter((review) => {
    if (selectedRatings.length > 0 && !selectedRatings.includes(review.rating)) {
      return false;
    }
    return true;
  });

  return (
    <section className={cn("py-8", className)}>
      <h2 className="text-xl font-bold mb-6">{t("reviews.title")}</h2>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Left Side - Rating Summary & Filters */}
        <div className="space-y-6">
          {/* Rating Summary */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full border-4 border-warning bg-warning/10">
              <span className="text-2xl font-bold">{mockReviewStats.average}</span>
            </div>
            <div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-5 w-5",
                      i < Math.floor(mockReviewStats.average)
                        ? "fill-warning text-warning"
                        : i < mockReviewStats.average
                          ? "fill-warning/50 text-warning"
                          : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {t("reviews.fromReviews", { count: mockReviewStats.total })}
              </p>
            </div>
          </div>

          {/* Rating Distribution Bars */}
          <div className="space-y-2">
            {mockReviewStats.distribution.map((item) => (
              <div key={item.stars} className="flex items-center gap-2">
                <span className="text-sm w-8">{item.stars}.0</span>
                <Star className="h-4 w-4 fill-warning text-warning" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full transition-all"
                    style={{
                      width: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : "0%",
                    }}
                  />
                </div>
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>

          {/* Filters - Collapsible on Mobile */}
          <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between lg:hidden"
              >
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
                {/* Rating Filter */}
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
                                  : "text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Topic Filter */}
                <div>
                  <h3 className="font-medium mb-3">{t("reviews.reviewTopics")}</h3>
                  <div className="space-y-2">
                    {reviewTopics.map((topic) => (
                      <label
                        key={topic.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={selectedTopics.includes(topic.id)}
                          onCheckedChange={() => handleTopicFilter(topic.id)}
                        />
                        <span className="text-sm">{topic.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Right Side - Review Lists */}
        <div>
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                {t("reviews.allReviews")}
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                {t("reviews.withMedia")}
              </TabsTrigger>
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
              >
                {t("reviews.withDescription")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="pt-4">
              <ReviewList
                reviews={filteredReviews}
                onLike={handleLike}
                onDislike={handleDislike}
              />
            </TabsContent>

            <TabsContent value="media" className="pt-4">
              <ReviewList
                reviews={filteredReviews.filter((r) => r.hasMedia)}
                onLike={handleLike}
                onDislike={handleDislike}
              />
            </TabsContent>

            <TabsContent value="description" className="pt-4">
              <ReviewList
                reviews={filteredReviews.filter((r) => r.content.length > 50)}
                onLike={handleLike}
                onDislike={handleDislike}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

interface ReviewListProps {
  reviews: Review[];
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
}

function ReviewList({ reviews, onLike, onDislike }: ReviewListProps) {
  const { t } = useTranslation();

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t("reviews.noReviews")}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onLike={() => onLike(review.id)}
          onDislike={() => onDislike(review.id)}
        />
      ))}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  onLike: () => void;
  onDislike: () => void;
}

function ReviewCard({ review, onLike, onDislike }: ReviewCardProps) {
  return (
    <div className="border border-border rounded-lg p-4">
      {/* Stars */}
      <div className="flex items-center gap-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-4 w-4",
              i < review.rating
                ? "fill-warning text-warning"
                : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Title & Content */}
      <h4 className="font-medium mb-1">{review.title}</h4>
      <p className="text-sm text-muted-foreground mb-3">{review.content}</p>

      {/* Author & Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={review.author.avatar || undefined} />
            <AvatarFallback className="text-xs">
              {review.author.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium">{review.author.name}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onLike}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors",
              review.isLiked
                ? "bg-primary/10 text-primary"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{review.likes}</span>
          </button>
          <button
            onClick={onDislike}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-sm transition-colors",
              review.isDisliked
                ? "bg-destructive/10 text-destructive"
                : "hover:bg-muted text-muted-foreground"
            )}
          >
            <ThumbsDown className="h-4 w-4" />
          </button>
          <button className="p-1 rounded-md hover:bg-muted text-muted-foreground">
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
