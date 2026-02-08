import { mockDb } from '../db'
import type { Vendor } from '@/types'
import { randomDelay } from '@/lib/utils'

// ============================================
// Vendor Service
// ============================================

export const vendorService = {
  async getVendors(): Promise<Array<Vendor>> {
    await randomDelay(150, 300)
    return mockDb.getVendors()
  },

  async getVendorById(id: string): Promise<Vendor | undefined> {
    await randomDelay(100, 200)
    return mockDb.getVendorById(id)
  },
}
