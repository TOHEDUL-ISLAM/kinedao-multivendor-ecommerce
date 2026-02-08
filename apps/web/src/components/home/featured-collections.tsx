import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";
import { FadeInView, HoverLift } from "@/components/ui/motion-wrappers";
import { cn } from "@/lib/utils";

export interface FeaturedCollectionDTO {
  id: string;
  title: string;
  titleBn: string | null;
  description: string | null;
  descriptionBn: string | null;
  imageUrl: string;
  link: string;
  bgColor: string | null;
}

interface FeaturedCollectionsProps {
  collections?: FeaturedCollectionDTO[];
}

// Map bgColor values to Tailwind classes
const bgColorMap: Record<string, string> = {
  "baby-pink": "bg-baby-pink",
  "baby-blue": "bg-baby-blue",
  "baby-mint": "bg-baby-mint",
  "baby-lavender": "bg-baby-lavender",
  "baby-peach": "bg-baby-peach",
  "baby-yellow": "bg-baby-yellow",
};

export const FeaturedCollections = ({ collections = [] }: FeaturedCollectionsProps) => {
  const { language, t } = useTranslation();

  if (collections.length === 0) return null;

  return (
    <section className="mt-8 sm:mt-10 lg:mt-12">
      <FadeInView>
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-center">
          {t("home.featuredCollections")}
        </h3>
      </FadeInView>

      {/* Collections Grid: 1 col mobile, 3 cols md+ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {collections.map((collection, index) => (
          <FadeInView key={collection.id} delay={index * 0.1}>
            <CollectionCard collection={collection} language={language} />
          </FadeInView>
        ))}
      </div>
    </section>
  );
};

interface CollectionCardProps {
  collection: FeaturedCollectionDTO;
  language: string;
}

const CollectionCard = ({ collection, language }: CollectionCardProps) => {
  const { t } = useTranslation();
  const displayTitle =
    language === "bn" && collection.titleBn ? collection.titleBn : collection.title;
  const displayDescription =
    language === "bn" && collection.descriptionBn
      ? collection.descriptionBn
      : collection.description;

  const bgClass = collection.bgColor
    ? bgColorMap[collection.bgColor] || "bg-secondary/50"
    : "bg-secondary/50";

  return (
    <HoverLift y={-5}>
      <Link
        to={collection.link}
        className="block group relative overflow-hidden rounded-2xl aspect-[4/3]"
      >
        {/* Background Color */}
        <div className={cn("absolute inset-0", bgClass)} />

        {/* Image */}
        <img
          src={collection.imageUrl}
          alt={displayTitle}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-end">
          <h4 className="text-lg sm:text-xl font-bold text-white mb-1">
            {displayTitle}
          </h4>
          {displayDescription && (
            <p className="text-sm text-white/80 mb-3 line-clamp-2">
              {displayDescription}
            </p>
          )}
          <Button
            variant="secondary"
            size="sm"
            className="w-fit group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
          >
            {t("home.shopCollection")}
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </Link>
    </HoverLift>
  );
};

// Skeleton for loading state
export const FeaturedCollectionsSkeleton = () => {
  return (
    <section className="mt-8 sm:mt-10 lg:mt-12">
      <div className="h-7 w-48 bg-muted rounded animate-pulse mx-auto mb-4 sm:mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="aspect-[4/3] rounded-2xl bg-muted animate-pulse"
          />
        ))}
      </div>
    </section>
  );
};
