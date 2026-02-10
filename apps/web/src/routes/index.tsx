import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { useTranslation } from "@/hooks/use-translation";
import type { HomePageResponse } from "@kineDao.com/api-types/catalog";

// Components
import { HeroSection } from "@/components/home/hero-section";
import { CategoriesSection, CategoriesSectionSkeleton } from "@/components/home/categories-section";
import { ProductBlock, ProductBlockSkeleton } from "@/components/home/product-block";
import { PopularBrands, PopularBrandsSkeleton } from "@/components/home/popular-brands";
import { TrustBadges, TrustBadgesSkeleton } from "@/components/home/trust-badges";
import { AgeGroupSection, AgeGroupSectionSkeleton } from "@/components/home/age-group-section";
import { TestimonialsSection, TestimonialsSectionSkeleton } from "@/components/home/testimonials-section";
import { InstagramGallery, InstagramGallerySkeleton } from "@/components/home/instagram-gallery";
import { FeaturedCollections, FeaturedCollectionsSkeleton } from "@/components/home/featured-collections";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { HeroBanners } from "@/components/homepage/hero-banners";
import { PromotionalBanners } from "@/components/homepage/promotional-banners";
import type { BannerDTO } from "@kineDao.com/api-types/catalog";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const EMPTY_HOME_DATA: HomePageResponse = {
  heroCarouselCampaigns: [],
  dealWallCampaigns: [],
  flashDeals: [],
  bestSellers: [],
  newArrivals: [],
  topCategories: [],
  popularBrands: [],
  testimonials: [],
  featuredCollections: [],
  instagramPosts: [],
};

async function fetchHomeData(): Promise<HomePageResponse> {
  try {
    const response = await api.home.$get();
    if (!response.ok) {
      console.error("[HOME] Failed to fetch home data:", response.status, response.statusText);
      return EMPTY_HOME_DATA;
    }
    return await response.json();
  } catch (error) {
    console.error("[HOME] Failed to fetch home data:", error);
    return EMPTY_HOME_DATA;
  }
}

async function fetchBanners(placement: string): Promise<BannerDTO[]> {
  try {
    const response = await api.banners["/"].$get({
      query: { placement },
    });
    if (!response.ok) {
      console.error("[BANNERS] Failed to fetch banners:", response.status, response.statusText);
      return [];
    }
    return await response.json();
  } catch (error) {
    console.error("[BANNERS] Failed to fetch banners:", error);
    return [];
  }
}

function HomePage() {
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHomeData,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch hero carousel banners
  const { data: heroBanners = [] } = useQuery({
    queryKey: ["banners", "hero_carousel"],
    queryFn: () => fetchBanners("hero_carousel"),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch promotional card banners
  const { data: promoBanners = [] } = useQuery({
    queryKey: ["banners", "promotional_card"],
    queryFn: () => fetchBanners("promotional_card"),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (error) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-destructive mb-4">{t("common.error")}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-primary hover:underline"
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background min-h-screen">
      {/* Hero Section - Banner Management System */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero Carousel - 2/3 width on desktop */}
          <div className="lg:col-span-2">
            <HeroBanners banners={heroBanners} />
          </div>

          {/* Promotional Cards - 1/3 width on desktop */}
          <div className="lg:col-span-1">
            <PromotionalBanners banners={promoBanners} />
          </div>
        </div>
      </section>

      {/* Trust Badges - Slim Info Bar */}
      {isLoading ? <TrustBadgesSkeleton /> : <TrustBadges />}

      {/* Shop by Age Section */}
      {isLoading ? <AgeGroupSectionSkeleton /> : <AgeGroupSection />}

      {/* Categories Section - Database Driven */}
      {isLoading ? (
        <CategoriesSectionSkeleton />
      ) : (
        <CategoriesSection categories={data?.topCategories} />
      )}

      {/* Flash Deals */}
      {(isLoading || (data?.flashDeals && data.flashDeals.length > 0)) && (
        <section className="container mx-auto px-4 pb-8 sm:pb-10 lg:pb-12">
          {isLoading ? (
            <ProductBlockSkeleton />
          ) : (
            <ProductBlock
              title={t("home.flashDeals")}
              products={data!.flashDeals}
              viewAllLink="/catalog"
              viewAllParams={{ sort: "price_asc" }}
            />
          )}
        </section>
      )}

      {/* Best Sellers */}
      {(isLoading || (data?.bestSellers && data.bestSellers.length > 0)) && (
        <section className="bg-secondary/30 py-8 sm:py-10 lg:py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <ProductBlockSkeleton />
            ) : (
              <ProductBlock
                title={t("home.bestSellers")}
                products={data!.bestSellers}
                viewAllLink="/catalog"
                viewAllParams={{ sort: "bestseller" }}
              />
            )}
          </div>
        </section>
      )}

      {/* New Arrivals */}
      {(isLoading || (data?.newArrivals && data.newArrivals.length > 0)) && (
        <section className="container mx-auto px-4 py-8 sm:py-10 lg:py-12">
          {isLoading ? (
            <ProductBlockSkeleton />
          ) : (
            <ProductBlock
              title={t("home.newArrivals")}
              products={data!.newArrivals}
              viewAllLink="/catalog"
              viewAllParams={{ sort: "newest" }}
            />
          )}
        </section>
      )}

      {/* Featured Collections */}
      {(isLoading || (data?.featuredCollections && data.featuredCollections.length > 0)) && (
        <section className="bg-secondary/30 py-8 sm:py-10 lg:py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <FeaturedCollectionsSkeleton />
            ) : (
              <FeaturedCollections collections={data?.featuredCollections} />
            )}
          </div>
        </section>
      )}

      {/* Testimonials */}
      {(isLoading || (data?.testimonials && data.testimonials.length > 0)) && (
        <>
          {isLoading ? (
            <TestimonialsSectionSkeleton />
          ) : (
            <TestimonialsSection testimonials={data?.testimonials} />
          )}
        </>
      )}

      {/* Instagram Gallery */}
      {(isLoading || (data?.instagramPosts && data.instagramPosts.length > 0)) && (
        <>
          {isLoading ? (
            <InstagramGallerySkeleton />
          ) : (
            <InstagramGallery posts={data?.instagramPosts} />
          )}
        </>
      )}

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* Footer Spacer */}
      <div className="h-8 sm:h-12" />
    </div>
  );
}