import FAQ from '../models/FAQ.js'
import type { IFAQ } from '../models/FAQ.js'

export async function getFAQsByBusiness(businessId: string): Promise<IFAQ[]> {
  const results = await FAQ.find({ businessId, isActive: true }).lean().sort({ createdAt: -1 })
  return results as unknown as IFAQ[]
}
