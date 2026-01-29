import { faker } from '@faker-js/faker'
import type { Vendor, VendorLocation } from '@/types'

// ============================================
// Vendor Factory
// ============================================

const LOCATIONS: Array<VendorLocation> = [
  'Dhaka',
  'Chittagong',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Rangpur',
  'Mymensingh',
]

const VENDOR_PREFIXES = [
  'BD',
  'Dhaka',
  'Bengal',
  'Eastern',
  'Golden',
  'Royal',
  'Prime',
  'Super',
  'Mega',
  'Star',
  'Elite',
  'Top',
  'Best',
  'Trust',
  'Quality',
]

const VENDOR_SUFFIXES = [
  'Electronics',
  'Fashion',
  'Store',
  'Shop',
  'Mart',
  'Hub',
  'World',
  'Zone',
  'Plaza',
  'Gallery',
  'Traders',
  'Enterprise',
  'Collection',
  'Outlet',
  'Bazaar',
]

export function createVendor(seed?: number): Vendor {
  if (seed !== undefined) {
    faker.seed(seed)
  }

  const prefix = faker.helpers.arrayElement(VENDOR_PREFIXES)
  const suffix = faker.helpers.arrayElement(VENDOR_SUFFIXES)
  const name = `${prefix} ${suffix}`
  const slug = name.toLowerCase().replace(/\s+/g, '-')

  return {
    id: faker.string.uuid(),
    name,
    slug,
    isVerified: faker.datatype.boolean({ probability: 0.7 }),
    rating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
    productCount: faker.number.int({ min: 10, max: 500 }),
    location: faker.helpers.arrayElement(LOCATIONS),
  }
}

export function createVendors(
  count: number,
  startSeed: number = 1000,
): Array<Vendor> {
  return Array.from({ length: count }, (_, i) => createVendor(startSeed + i))
}

// Pre-generated vendors for consistent data
let cachedVendors: Array<Vendor> | null = null

export function getVendors(count: number = 50): Array<Vendor> {
  if (!cachedVendors || cachedVendors.length < count) {
    faker.seed(12345) // Seed for reproducibility
    cachedVendors = createVendors(count)
  }
  return cachedVendors.slice(0, count)
}

export function getRandomVendor(): Vendor {
  const vendors = getVendors()
  return faker.helpers.arrayElement(vendors)
}
