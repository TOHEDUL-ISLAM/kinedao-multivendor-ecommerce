import { mockDb } from '../db'
import type { Category } from '@/types'
import { randomDelay } from '@/lib/utils'

// ============================================
// Category Service
// ============================================

export const categoryService = {
  async getCategories(): Promise<Array<Category>> {
    await randomDelay(100, 200)
    return mockDb.getCategories()
  },

  async getCategoryById(id: string): Promise<Category | undefined> {
    await randomDelay(50, 150)
    return mockDb.getCategoryById(id)
  },
}
