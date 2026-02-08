import { faker } from '@faker-js/faker'
import type { CarouselSlide } from '@/types'

// ============================================
// Carousel Factory - Promotional Slides
// ============================================

const SLIDE_TEMPLATES = [
  {
    title: 'New Year Sale',
    subtitle: 'Up to 70% Off on Everything',
    ctaText: 'Shop Now',
    backgroundColor: '#1B5E20',
  },
  {
    title: 'Electronics Week',
    subtitle: 'Best Deals on Gadgets & Accessories',
    ctaText: 'Explore',
    backgroundColor: '#0D47A1',
  },
  {
    title: 'Fashion Festival',
    subtitle: 'Trendy Styles at Unbeatable Prices',
    ctaText: 'Shop Fashion',
    backgroundColor: '#C62828',
  },
  {
    title: '24-Hour Flash Deal',
    subtitle: 'Limited Time - ৳99 Items',
    ctaText: 'Grab Now',
    backgroundColor: '#E65100',
  },
  {
    title: 'Home Essentials',
    subtitle: 'Transform Your Living Space',
    ctaText: 'Shop Home',
    backgroundColor: '#4A148C',
  },
  {
    title: 'Free Shipping Week',
    subtitle: 'On Orders Above ৳500',
    ctaText: 'Start Shopping',
    backgroundColor: '#00695C',
  },
  {
    title: 'Beauty Bonanza',
    subtitle: 'Premium Skincare & Makeup',
    ctaText: 'Shop Beauty',
    backgroundColor: '#AD1457',
  },
  {
    title: 'Sports & Fitness',
    subtitle: 'Gear Up for Your Goals',
    ctaText: 'Shop Sports',
    backgroundColor: '#1565C0',
  },
]

export function createCarouselSlide(
  template: (typeof SLIDE_TEMPLATES)[0],
  index: number,
): CarouselSlide {
  const seed = 100 + index
  faker.seed(seed)

  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + faker.number.int({ min: 7, max: 30 }))

  return {
    slideId: faker.string.uuid(),
    title: template.title,
    subtitle: template.subtitle,
    imageUrl: `https://picsum.photos/seed/${seed}/1200/400`,
    mobileImageUrl: `https://picsum.photos/seed/${seed}/800/400`,
    ctaText: template.ctaText,
    ctaLink: '/products',
    backgroundColor: template.backgroundColor,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    priority: index + 1,
    targetAudience: ['BD'],
  }
}

export function createCarouselSlides(count: number = 6): Array<CarouselSlide> {
  const templates = SLIDE_TEMPLATES.slice(0, count)
  return templates.map((template, index) =>
    createCarouselSlide(template, index),
  )
}

// Pre-generated slides
let cachedSlides: Array<CarouselSlide> | null = null

export function getCarouselSlides(): Array<CarouselSlide> {
  if (!cachedSlides) {
    cachedSlides = createCarouselSlides(6)
  }
  return cachedSlides
}
