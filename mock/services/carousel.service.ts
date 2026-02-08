import { mockDb } from '../db'
import type { CarouselSlide } from '@/types'
import { randomDelay } from '@/lib/utils'

// ============================================
// Carousel Service
// ============================================

export const carouselService = {
  async getCarouselSlides(): Promise<Array<CarouselSlide>> {
    await randomDelay(100, 200)
    return mockDb.getCarouselSlides()
  },
}
