import { Instagram } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { FadeInView } from "@/components/ui/motion-wrappers";

export interface InstagramPostDTO {
  id: string;
  imageUrl: string;
  alt: string | null;
  link: string | null;
}

interface InstagramGalleryProps {
  posts?: InstagramPostDTO[];
}

export const InstagramGallery = ({ posts = [] }: InstagramGalleryProps) => {
  const { t } = useTranslation();

  if (posts.length === 0) return null;

  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <FadeInView>
        {/* Header */}
        <div className="container mx-auto px-4 mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-3">
            <Instagram className="w-6 h-6 text-pink-500" />
            <h2 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold">
              {t("home.instagram.title")}
            </h2>
          </div>
          <p className="text-center text-muted-foreground text-sm mt-1">
            {t("home.instagram.handle")}
          </p>
        </div>

        {/* Image Grid - Full width, no container */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 sm:gap-2">
          {posts.map((post) => (
            <InstagramPostCard key={post.id} post={post} />
          ))}
        </div>
      </FadeInView>
    </section>
  );
};

interface InstagramPostCardProps {
  post: InstagramPostDTO;
}

const InstagramPostCard = ({ post }: InstagramPostCardProps) => {
  const handleClick = () => {
    if (post.link) {
      window.open(post.link, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      onClick={handleClick}
      className="relative aspect-square overflow-hidden cursor-pointer group"
    >
      {/* Image */}
      <img
        src={post.imageUrl}
        alt={post.alt || "Instagram post"}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        loading="lazy"
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
        <Instagram className="w-8 h-8 text-white" />
      </div>
    </div>
  );
};

// Skeleton for loading state
export const InstagramGallerySkeleton = () => {
  return (
    <section className="py-8 sm:py-10 lg:py-12">
      <div className="container mx-auto px-4 mb-6 sm:mb-8">
        <div className="flex items-center justify-center gap-3">
          <div className="w-6 h-6 bg-muted rounded animate-pulse" />
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="h-4 w-24 bg-muted rounded animate-pulse mx-auto mt-2" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 sm:gap-2">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse" />
        ))}
      </div>
    </section>
  );
};
