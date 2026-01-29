import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { env } from "@/lib/env";
import { useTranslation } from "@/hooks/use-translation";

// Components
import { HeroSection } from "@/components/home/hero-section";
import { CategoriesSection, CategoriesSectionSkeleton } from "@/components/home/categories-section";
import { ProductBlock, ProductBlockSkeleton } from "@/components/home/product-block";
import { PopularBrands, PopularBrandsSkeleton } from "@/components/home/popular-brands";
import { TrustBadges, TrustBadgesSkeleton } from "@/components/home/trust-badges";

export const Route = createFileRoute("/")({
  component: HomePage,
});

interface HomePageData {
  heroCarouselCampaigns: any[];
  dealWallCampaigns: any[];
  flashDeals: any[];
  bestSellers: any[];
  newArrivals: any[];
  topCategories: any[];
  popularBrands: any[];
}

const EMPTY_HOME_DATA: HomePageData = {
  heroCarouselCampaigns: [],
  dealWallCampaigns: [],
  flashDeals: [],
  bestSellers: [],
  newArrivals: [],
  topCategories: [],
  popularBrands: [],
};

async function fetchHomeData(): Promise<HomePageData> {
  try {
    const response = await fetch(`${env.VITE_SERVER_URL}/api/home`);
    if (!response.ok) {
      console.error("[HOME] Failed to fetch home data:", response.status, response.statusText);
      return EMPTY_HOME_DATA;
    }
    return response.json();
  } catch (error) {
    console.error("[HOME] Failed to fetch home data:", error);
    return EMPTY_HOME_DATA;
  }
}

function HomePage() {
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["home"],
    queryFn: fetchHomeData,
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
      {/* Hero Section - New Design */}
      <HeroSection />

      {/* Trust Badges - Slim Info Bar */}
      {isLoading ? <TrustBadgesSkeleton /> : <TrustBadges />}

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

      {/* Popular Brands */}
      {(isLoading || (data?.popularBrands && data.popularBrands.length > 0)) && (
        <section className="bg-secondary/30 py-8 sm:py-10 lg:py-12">
          <div className="container mx-auto px-4">
            {isLoading ? (
              <PopularBrandsSkeleton />
            ) : (
              <PopularBrands brands={data!.popularBrands} />
            )}
          </div>
        </section>
      )}

      {/* Footer Spacer */}
      <div className="h-8 sm:h-12" />
    </div>
  );
}