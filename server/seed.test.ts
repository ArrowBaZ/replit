import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { db, pool } from './db'
import * as schema from '@shared/schema'
import { eq, count } from 'drizzle-orm'

/**
 * Seed Test Suite
 *
 * Verifies that the seed script creates correct test data:
 * - Exact user counts (3 admins, 5 sellers, 3 marchands)
 * - Fee tier calculations (commission splits = 100%)
 * - Item counts and statuses
 * - French data validation (postal codes, names)
 * - Foreign key relationships intact
 *
 * Requires DATABASE_URL to be set and PostgreSQL running.
 * Run with: npm run test:server -- seed.test.ts
 */

describe('Seed Data Integrity', () => {
  beforeAll(async () => {
    // Unmock the database to use real connection
    vi.unmock('../db')
  })

  afterAll(async () => {
    // Close pool after tests
    await pool.end()
  })

  describe('User Counts', () => {
    it('should have exactly 3 admin users', async () => {
      const [result] = await db
        .select({ count: count() })
        .from(schema.users)
        .innerJoin(
          schema.profiles,
          eq(schema.users.id, schema.profiles.userId)
        )
        .where(eq(schema.profiles.role, 'admin'))

      expect(result.count).toBe(3)
    })

    it('should have exactly 5 seller users', async () => {
      const [result] = await db
        .select({ count: count() })
        .from(schema.users)
        .innerJoin(
          schema.profiles,
          eq(schema.users.id, schema.profiles.userId)
        )
        .where(eq(schema.profiles.role, 'seller'))

      expect(result.count).toBe(5)
    })

    it('should have exactly 3 marchand users', async () => {
      const [result] = await db
        .select({ count: count() })
        .from(schema.users)
        .innerJoin(
          schema.profiles,
          eq(schema.users.id, schema.profiles.userId)
        )
        .where(eq(schema.profiles.role, 'marchand'))

      expect(result.count).toBe(3)
    })
  })

  describe('Fee Tiers', () => {
    it('should have exactly 3 fee tiers', async () => {
      const tiers = await db.select().from(schema.feeTiers)
      expect(tiers).toHaveLength(3)
    })

    it('should have Tier 1 with 50/40/10 split', async () => {
      const [tier] = await db
        .select()
        .from(schema.feeTiers)
        .where(eq(schema.feeTiers.label, 'Tier 1: €0-150'))

      expect(tier).toBeDefined()
      expect(tier.sellerPercent).toBe(50)
      expect(tier.resellerPercent).toBe(40)
      expect(tier.platformPercent).toBe(10)
      expect(tier.sellerPercent + tier.resellerPercent + tier.platformPercent).toBe(
        100
      )
    })

    it('should have Tier 2 with 55/35/10 split', async () => {
      const [tier] = await db
        .select()
        .from(schema.feeTiers)
        .where(eq(schema.feeTiers.label, 'Tier 2: €151-500'))

      expect(tier).toBeDefined()
      expect(tier.sellerPercent).toBe(55)
      expect(tier.resellerPercent).toBe(35)
      expect(tier.platformPercent).toBe(10)
      expect(tier.sellerPercent + tier.resellerPercent + tier.platformPercent).toBe(
        100
      )
    })

    it('should have Tier 3 with 60/30/10 split', async () => {
      const [tier] = await db
        .select()
        .from(schema.feeTiers)
        .where(eq(schema.feeTiers.label, 'Tier 3: €501+'))

      expect(tier).toBeDefined()
      expect(tier.sellerPercent).toBe(60)
      expect(tier.resellerPercent).toBe(30)
      expect(tier.platformPercent).toBe(10)
      expect(tier.sellerPercent + tier.resellerPercent + tier.platformPercent).toBe(
        100
      )
    })

    it('commission splits should all equal 100%', async () => {
      const tiers = await db.select().from(schema.feeTiers)

      for (const tier of tiers) {
        const total = tier.sellerPercent + tier.resellerPercent + tier.platformPercent
        expect(total).toBe(100)
      }
    })
  })

  describe('Requests and Items', () => {
    it('should have at least 2 requests', async () => {
      const [result] = await db.select({ count: count() }).from(schema.requests)
      expect(result.count).toBeGreaterThanOrEqual(2)
    })

    it('should have at least 5 items', async () => {
      const [result] = await db.select({ count: count() }).from(schema.items)
      expect(result.count).toBeGreaterThanOrEqual(5)
    })

    it('all items should reference valid requests', async () => {
      const orphanedItems = await db
        .select({ id: schema.items.id })
        .from(schema.items)
        .leftJoin(
          schema.requests,
          eq(schema.items.requestId, schema.requests.id)
        )
        .where(eq(schema.requests.id, null as any))

      expect(orphanedItems).toHaveLength(0)
    })
  })

  describe('French Data Validation', () => {
    it('all profiles should have valid French postal codes', async () => {
      const profiles = await db
        .select({ postalCode: schema.profiles.postalCode })
        .from(schema.profiles)
        .where(eq(schema.profiles.role, 'seller'))

      for (const profile of profiles) {
        if (profile.postalCode) {
          // Valid French postal code: 5 digits starting with valid department code
          expect(profile.postalCode).toMatch(/^\d{5}$/)
          const deptCode = profile.postalCode.substring(0, 2)
          // Check against known French departments in seed
          const validDepts = ['75', '13', '59', '31', '06', '69', '33']
          expect(validDepts).toContain(deptCode)
        }
      }
    })

    it('sellers should have non-empty names', async () => {
      const sellers = await db
        .select({
          firstName: schema.users.firstName,
          lastName: schema.users.lastName,
        })
        .from(schema.users)
        .innerJoin(
          schema.profiles,
          eq(schema.users.id, schema.profiles.userId)
        )
        .where(eq(schema.profiles.role, 'seller'))

      expect(sellers.length).toBeGreaterThan(0)
      for (const seller of sellers) {
        expect(seller.firstName).toBeTruthy()
        expect(seller.lastName).toBeTruthy()
      }
    })

    it('all users should have unique email addresses', async () => {
      const users = await db.select({ email: schema.users.email }).from(schema.users)
      const emails = users.map((u) => u.email)
      const uniqueEmails = new Set(emails)

      expect(uniqueEmails.size).toBe(emails.length)
    })
  })

  describe('Data Relationships', () => {
    it('all profiles should reference valid users', async () => {
      const orphanedProfiles = await db
        .select({ id: schema.profiles.id })
        .from(schema.profiles)
        .leftJoin(schema.users, eq(schema.profiles.userId, schema.users.id))
        .where(eq(schema.users.id, null as any))

      expect(orphanedProfiles).toHaveLength(0)
    })

    it('all requests should reference valid sellers', async () => {
      const orphanedRequests = await db
        .select({ id: schema.requests.id })
        .from(schema.requests)
        .leftJoin(schema.users, eq(schema.requests.sellerId, schema.users.id))
        .where(eq(schema.users.id, null as any))

      expect(orphanedRequests).toHaveLength(0)
    })

    it('requests should have consistent item counts', async () => {
      const requests = await db.select().from(schema.requests)

      for (const request of requests) {
        const items = await db
          .select({ count: count() })
          .from(schema.items)
          .where(eq(schema.items.requestId, request.id))

        const [result] = items
        expect(result.count).toBe(request.itemCount)
      }
    })
  })

  describe('Item Statuses', () => {
    it('items should have valid status values', async () => {
      const items = await db
        .select({ status: schema.items.status })
        .from(schema.items)

      const validStatuses = [
        'pending_approval',
        'approved',
        'listed',
        'sold',
        'rejected',
      ]

      for (const item of items) {
        expect(validStatuses).toContain(item.status)
      }
    })

    it('should have items in pending_approval status', async () => {
      const [result] = await db
        .select({ count: count() })
        .from(schema.items)
        .where(eq(schema.items.status, 'pending_approval'))

      expect(result.count).toBeGreaterThan(0)
    })

    it('should have items in approved status', async () => {
      const [result] = await db
        .select({ count: count() })
        .from(schema.items)
        .where(eq(schema.items.status, 'approved'))

      expect(result.count).toBeGreaterThan(0)
    })
  })
})
