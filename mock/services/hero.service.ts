import { mockDb } from '../db'
import type { BentoCard, HeroSlide } from '@/types'
import { randomDelay } from '@/lib/utils'

// ============================================
// Hero Service
// ============================================

export const heroService = {
  /**
   * Get hero carousel slides
   * @returns Promise resolving to array of HeroSlide objects
   */
  async getHeroSlides(): Promise<Array<HeroSlide>> {
    await randomDelay(100, 200)
    return mockDb.getHeroSlides()
  },

  /**
   * Get bento grid category cards
   * @returns Promise resolving to array of BentoCard objects
   */
  async getBentoCards(): Promise<Array<BentoCard>> {
    await randomDelay(100, 200)
    return mockDb.getBentoCards()
  },
}
