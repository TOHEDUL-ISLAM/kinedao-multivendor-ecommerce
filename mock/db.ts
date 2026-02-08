import { faker } from '@faker-js/faker'
import { createDealProducts, createProducts } from './factories/product.factory'
import { getVendors } from './factories/vendor.factory'
import { getCategories, getCategoryById } from './factories/category.factory'
import { getCarouselSlides } from './factories/carousel.factory'
import { BENTO_CARDS, HERO_SLIDES } from './factories/hero.factory'
import type {
  BentoCard,
  CarouselSlide,
  Category,
  HeroSlide,
  PaginatedResponse,
  Product,
  ProductFilters,
  Vendor,
} from '@/types'

// ============================================
// Mock Database
// ============================================

class MockDatabase {
  private products: Array<Product> = []
  private vendors: Array<Vendor> = []
  private categories: Array<Category> = []
  private carouselSlides: Array<CarouselSlide> = []
  private heroSlides: Array<HeroSlide> = []
  private bentoCards: Array<BentoCard> = []
  private initialized = false

  // eslint-disable-next-line @typescript-eslint/require-await
  async init(): Promise<void> {
    if (this.initialized) return

    // Seed for reproducible data
    faker.seed(12345)

    // Generate data
    this.vendors = getVendors(50)
    this.categories = getCategories()
    this.carouselSlides = getCarouselSlides()
    this.heroSlides = HERO_SLIDES
    this.bentoCards = BENTO_CARDS
    this.products = createProducts(500, 0)

    this.initialized = true
  }

  // ============================================
  // Product Methods
  // ============================================

  async getProducts(
    filters: ProductFilters = {},
  ): Promise<PaginatedResponse<Product>> {
    await this.init()

    let filtered = [...this.products]

    // Apply category filter (single or multi-select)
    const categoryIds =
      filters.categories && filters.categories.length > 0
        ? filters.categories
        : filters.category
          ? [filters.category]
          : []

    if (categoryIds.length > 0) {
      filtered = filtered.filter((p) => categoryIds.includes(p.categoryId))
    }

    // Apply subcategory filter (would need subcategoryId on products - for now skip)
    // This would require extending the Product type with subcategoryId

    if (filters.minPrice !== null && filters.minPrice !== undefined) {
      filtered = filtered.filter(
        (p) => p.pricing.currentPrice >= filters.minPrice!,
      )
    }

    if (filters.maxPrice !== null && filters.maxPrice !== undefined) {
      filtered = filtered.filter(
        (p) => p.pricing.currentPrice <= filters.maxPrice!,
      )
    }

    if (filters.minRating !== null && filters.minRating !== undefined) {
      filtered = filtered.filter((p) => p.rating.average >= filters.minRating!)
    }

    if (filters.freeShipping) {
      filtered = filtered.filter((p) => p.shipping.freeShipping)
    }

    if (filters.inStock) {
      filtered = filtered.filter((p) => p.stockStatus !== 'out_of_stock')
    }

    if (filters.onSale) {
      filtered = filtered.filter((p) => p.pricing.discountPercentage > 0)
    }

    // Vendor filters
    if (filters.vendors && filters.vendors.length > 0) {
      filtered = filtered.filter((p) => filters.vendors!.includes(p.vendor.id))
    }

    if (filters.verifiedVendorsOnly) {
      filtered = filtered.filter((p) => p.vendor.isVerified)
    }

    // Location filter
    if (filters.locations && filters.locations.length > 0) {
      filtered = filtered.filter((p) =>
        filters.locations!.includes(p.vendor.location),
      )
    }

    // Color filter (check variants)
    if (filters.colors && filters.colors.length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.variants) return false
        const productColors = p.variants
          .filter((v) => v.type === 'color')
          .map((v) => v.value.toLowerCase())
        return filters.colors!.some((color) =>
          productColors.includes(color.toLowerCase()),
        )
      })
    }

    // Size filter (check variants)
    if (filters.sizes && filters.sizes.length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.variants) return false
        const productSizes = p.variants
          .filter((v) => v.type === 'size')
          .map((v) => v.value.toUpperCase())
        return filters.sizes!.some((size) =>
          productSizes.includes(size.toUpperCase()),
        )
      })
    }

    // Material filter (check variants)
    if (filters.materials && filters.materials.length > 0) {
      filtered = filtered.filter((p) => {
        if (!p.variants) return false
        const productMaterials = p.variants
          .filter((v) => v.type === 'material')
          .map((v) => v.value.toLowerCase())
        return filters.materials!.some((material) =>
          productMaterials.includes(material.toLowerCase()),
        )
      })
    }

    // Discount range filter
    if (filters.discountRange) {
      const discountRanges: Record<
        string,
        { min: number; max: number } | undefined
      > = {
        '0-10': { min: 0, max: 10 },
        '10-25': { min: 10, max: 25 },
        '25-40': { min: 25, max: 40 },
        '40-60': { min: 40, max: 60 },
        '60+': { min: 60, max: 100 },
      }
      const range = discountRanges[filters.discountRange]
      if (range) {
        filtered = filtered.filter(
          (p) =>
            p.pricing.discountPercentage >= range.min &&
            p.pricing.discountPercentage <= range.max,
        )
      }
    }

    // Badge filter
    if (filters.badge) {
      filtered = filtered.filter((p) => p.badges.includes(filters.badge!))
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower),
      )
    }

    // Apply sorting
    switch (filters.sort) {
      case 'price_asc':
        filtered.sort((a, b) => a.pricing.currentPrice - b.pricing.currentPrice)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.pricing.currentPrice - a.pricing.currentPrice)
        break
      case 'rating_desc':
        filtered.sort((a, b) => b.rating.average - a.rating.average)
        break
      case 'created_desc':
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        break
      case 'discount_desc':
        filtered.sort(
          (a, b) => b.pricing.discountPercentage - a.pricing.discountPercentage,
        )
        break
      case 'sales_desc':
        // Simulate by rating count (as proxy for sales)
        filtered.sort((a, b) => b.rating.count - a.rating.count)
        break
      default:
        // Relevance - mix of rating and recency
        break
    }

    // Pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedData = filtered.slice(startIndex, endIndex)

    return {
      data: paginatedData,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
      hasMore: endIndex < filtered.length,
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    await this.init()
    return this.products.find((p) => p.id === id)
  }

  async getTodayDeals(limit: number = 12): Promise<Array<Product>> {
    await this.init()

    // Get products with 30%+ discount
    const deals = this.products
      .filter((p) => p.pricing.discountPercentage >= 30)
      .sort(
        (a, b) => b.pricing.discountPercentage - a.pricing.discountPercentage,
      )
      .slice(0, limit)

    // If not enough deals, generate some
    if (deals.length < limit) {
      const additionalDeals = createDealProducts(limit - deals.length)
      return [...deals, ...additionalDeals].slice(0, limit)
    }

    return deals
  }

  async searchProducts(
    query: string,
    limit: number = 10,
  ): Promise<Array<Product>> {
    await this.init()

    if (!query.trim()) return []

    const queryLower = query.toLowerCase()
    return this.products
      .filter(
        (p) =>
          p.title.toLowerCase().includes(queryLower) ||
          p.description.toLowerCase().includes(queryLower),
      )
      .slice(0, limit)
  }

  // ============================================
  // Category Methods
  // ============================================

  async getCategories(): Promise<Array<Category>> {
    await this.init()
    return this.categories
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    await this.init()
    return getCategoryById(id)
  }

  // ============================================
  // Vendor Methods
  // ============================================

  async getVendors(): Promise<Array<Vendor>> {
    await this.init()
    return this.vendors
  }

  async getVendorById(id: string): Promise<Vendor | undefined> {
    await this.init()
    return this.vendors.find((v) => v.id === id)
  }

  // ============================================
  // Carousel Methods
  // ============================================

  async getCarouselSlides(): Promise<Array<CarouselSlide>> {
    await this.init()
    return this.carouselSlides
  }

  // ============================================
  // Hero Section Methods
  // ============================================

  async getHeroSlides(): Promise<Array<HeroSlide>> {
    await this.init()
    return this.heroSlides
  }

  async getBentoCards(): Promise<Array<BentoCard>> {
    await this.init()
    return this.bentoCards
  }
}

// Singleton instance
export const mockDb = new MockDatabase()
