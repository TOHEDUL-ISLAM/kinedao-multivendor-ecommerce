import type { BentoCard, HeroSlide } from '@/types'

// ============================================
// Hero Carousel Slides Data
// ============================================

export const HERO_SLIDES: Array<HeroSlide> = [
  {
    slideId: '1',
    categoryLabel: 'ELECTRONICS',
    title: 'Smart Gadgets For Your Home',
    subtitle: 'Latest flagship models with premium features',
    priceText: 'From ৳2,999',
    imageUrl:
      'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=1200&h=600&fit=crop',
    mobileImageUrl:
      'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=800&h=400&fit=crop',
    ctaText: 'Shop Now',
    ctaLink: '/products?category=electronics',
    backgroundColor: '#f0f4f8',
    overlayPosition: 'left',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    priority: 1,
    targetAudience: ['BD'],
  },
  {
    slideId: '2',
    categoryLabel: 'FASHION',
    title: 'Premium Leather Bags',
    subtitle: 'Handcrafted luxury accessories for every occasion',
    priceText: 'From ৳4,500',
    imageUrl:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200&h=600&fit=crop',
    mobileImageUrl:
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=400&fit=crop',
    ctaText: 'View Products',
    ctaLink: '/products?category=fashion',
    backgroundColor: '#fff5e6',
    overlayPosition: 'left',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    priority: 2,
    targetAudience: ['BD'],
  },
  {
    slideId: '3',
    categoryLabel: 'HOME & LIVING',
    title: 'Kitchen Appliances',
    subtitle: 'Make cooking easier with modern kitchen essentials',
    priceText: 'From ৳1,999',
    imageUrl:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200&h=600&fit=crop',
    mobileImageUrl:
      'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=400&fit=crop',
    ctaText: 'Explore',
    ctaLink: '/products?category=home-living',
    backgroundColor: '#f3e8ff',
    overlayPosition: 'left',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    priority: 3,
    targetAudience: ['BD'],
  },
  {
    slideId: '4',
    categoryLabel: 'BEAUTY',
    title: 'Premium Skincare Collection',
    subtitle: 'Natural beauty products for glowing skin',
    priceText: 'From ৳899',
    imageUrl:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=600&fit=crop',
    mobileImageUrl:
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=400&fit=crop',
    ctaText: 'Shop Now',
    ctaLink: '/products?category=beauty',
    backgroundColor: '#ffe4e6',
    overlayPosition: 'left',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    priority: 4,
    targetAudience: ['BD'],
  },
  {
    slideId: '5',
    categoryLabel: 'SPORTS',
    title: 'Fitness Equipment Sale',
    subtitle: 'Get fit with premium sports and fitness gear',
    priceText: 'From ৳1,500',
    imageUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=600&fit=crop',
    mobileImageUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop',
    ctaText: 'View Deals',
    ctaLink: '/products?category=sports',
    backgroundColor: '#e0f2fe',
    overlayPosition: 'left',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    priority: 5,
    targetAudience: ['BD'],
  },
]

// ============================================
// Bento Grid Category Cards Data
// ============================================

export const BENTO_CARDS: Array<BentoCard> = [
  {
    id: 'smartwatch',
    categoryName: 'Smart Watch',
    categorySlug: 'electronics',
    backgroundColor: 'bg-slate-100',
    imageUrl:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&h=900&fit=crop',
    ctaLink: '/products?category=electronics&subcategory=smartwatch',
    subcategoryId: 'smartwatch',
    discountPercentage: 50,
  },
  {
    id: 'headphones',
    categoryName: 'Headphones',
    categorySlug: 'electronics',
    backgroundColor: 'bg-amber-100',
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900&h=900&fit=crop',
    ctaLink: '/products?category=electronics&subcategory=audio',
    subcategoryId: 'audio',
    discountPercentage: 30,
  },
  {
    id: 'camera',
    categoryName: 'Camera',
    categorySlug: 'electronics',
    backgroundColor: 'bg-blue-100',
    imageUrl:
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=900&h=900&fit=crop',
    ctaLink: '/products?category=electronics&subcategory=cameras',
    subcategoryId: 'cameras',
    discountPercentage: 15,
  },
  {
    id: 'skincare',
    categoryName: 'Skincare',
    categorySlug: 'beauty',
    backgroundColor: 'bg-rose-100',
    imageUrl:
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=900&h=900&fit=crop',
    ctaLink: '/products?category=beauty&subcategory=skincare',
    subcategoryId: 'skincare',
    discountPercentage: 25,
  },
]
