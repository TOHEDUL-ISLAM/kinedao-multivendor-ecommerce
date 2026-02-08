import { mockDb } from '../db'
import type {
  PaginatedResponse,
  Product,
  ProductFilters,
  SearchSuggestion,
} from '@/types'
import { randomDelay } from '@/lib/utils'

// ============================================
// Product Service
// ============================================

export const productService = {
  async getProducts(
    filters: ProductFilters = {},
  ): Promise<PaginatedResponse<Product>> {
    await randomDelay(200, 500)
    return mockDb.getProducts(filters)
  },

  async getProductById(id: string): Promise<Product | undefined> {
    await randomDelay(150, 300)
    return mockDb.getProductById(id)
  },

  async getTodayDeals(limit: number = 12): Promise<Array<Product>> {
    await randomDelay(200, 400)
    return mockDb.getTodayDeals(limit)
  },

  async searchProducts(
    query: string,
    limit: number = 10,
  ): Promise<Array<Product>> {
    await randomDelay(100, 250)
    return mockDb.searchProducts(query, limit)
  },

  async getSearchSuggestions(query: string): Promise<Array<SearchSuggestion>> {
    await randomDelay(50, 150)

    if (!query.trim()) return []

    const products = await mockDb.searchProducts(query, 5)
    const categories = await mockDb.getCategories()

    const suggestions: Array<SearchSuggestion> = []

    // Add matching products
    products.forEach((product) => {
      suggestions.push({
        type: 'product',
        id: product.id,
        title: product.title,
        imageUrl: product.images[0]?.url,
      })
    })

    // Add matching categories
    const queryLower = query.toLowerCase()
    categories.forEach((category) => {
      if (category.name.toLowerCase().includes(queryLower)) {
        suggestions.push({
          type: 'category',
          id: category.id,
          title: category.name,
        })
      }
    })

    return suggestions.slice(0, 8)
  },

  async getInfiniteProducts(
    filters: ProductFilters,
    pageParam: number = 1,
  ): Promise<PaginatedResponse<Product>> {
    return this.getProducts({ ...filters, page: pageParam })
  },
}
