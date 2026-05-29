import { randomInt } from 'crypto'
import { db, pool } from '../server/db'
import * as schema from '../shared/schema'
import { eq, isNull } from 'drizzle-orm'
import {
  generateName,
  generateAddress,
  generatePhoneNumber,
  generateEmail,
  generateNotificationPrefs,
  pickRandom,
  generateSIRET,
} from './generators'
import { hashPassword } from '../server/auth'
import 'dotenv/config'

/**
 * DRIZZLE ORM SEED PATTERN REFERENCE
 *
 * This seed uses Drizzle ORM for all database operations:
 *
 * 1. CREATE pattern:
 *    const [created] = await db.insert(schema.users).values(data).returning()
 *
 * 2. SELECT pattern:
 *    const [row] = await db.select().from(schema.users).where(eq(schema.users.id, id))
 *
 * 3. TRANSACTION pattern:
 *    await db.transaction(async (tx) => { ... use tx.insert/select/update ... })
 *
 * 4. BATCH INSERT (createMany):
 *    await db.insert(schema.table).values([{...}, {...}])
 *
 * All operations use schema.* table references from '@shared/schema'
 */

async function main() {
  console.log('🌱 Starting French dataset seed with Drizzle ORM...')

  const testPassword = 'TestPassword123'
  const passwordHash = await hashPassword(testPassword)
  console.log(`📝 Using test password: ${testPassword}`)

  await db.transaction(async (tx) => {
    // Deletion order (respects FK constraints - delete from leaf tables first)
    console.log('Deleting existing data...')
    await tx.delete(schema.moderationActions)
    await tx.delete(schema.feeTierChangelog)
    await tx.delete(schema.agreementSignatures)
    await tx.delete(schema.agreements)
    await tx.delete(schema.itemPriceOffers)
    await tx.delete(schema.itemDocumentRequests)
    await tx.delete(schema.itemDocuments)
    await tx.delete(schema.reviews)
    await tx.delete(schema.transactions)
    await tx.delete(schema.meetings)
    await tx.delete(schema.messages)
    await tx.delete(schema.notifications)
    await tx.delete(schema.items)
    await tx.delete(schema.requests)
    await tx.delete(schema.profiles)
    await tx.delete(schema.sessions)
    await tx.delete(schema.users)

    // Create fee tiers (Tier 1, 2, 3 with Sellzy commission splits)
    console.log('Creating fee_tiers (3)...')
    await tx.insert(schema.feeTiers).values([
      {
        label: 'Tier 1: €0-150',
        minPrice: 0,
        maxPrice: 150,
        sellerPercent: 50,
        resellerPercent: 40,
        platformPercent: 10,
        currencyNote: 'EUR/CHF',
        isActive: true,
      },
      {
        label: 'Tier 2: €151-500',
        minPrice: 151,
        maxPrice: 500,
        sellerPercent: 55,
        resellerPercent: 35,
        platformPercent: 10,
        currencyNote: 'EUR/CHF',
        isActive: true,
      },
      {
        label: 'Tier 3: €501+',
        minPrice: 501,
        maxPrice: null,
        sellerPercent: 60,
        resellerPercent: 30,
        platformPercent: 10,
        currencyNote: 'EUR/CHF',
        isActive: true,
      },
    ])

    // Create admin users (3)
    console.log('Creating admin users (3)...')
    const adminUsers = await Promise.all([
      tx
        .insert(schema.users)
        .values({
          email: 'admin.moreau@example.fr',
          firstName: 'André',
          lastName: 'Moreau',
          profileImageUrl: 'https://example.com/avatars/admin-1.jpg',
          passwordHash,
        })
        .returning(),
      tx
        .insert(schema.users)
        .values({
          email: 'admin.lefevre@example.fr',
          firstName: 'Isabelle',
          lastName: 'Lefebvre',
          profileImageUrl: 'https://example.com/avatars/admin-2.jpg',
          passwordHash,
        })
        .returning(),
      tx
        .insert(schema.users)
        .values({
          email: 'admin.renard@example.fr',
          firstName: 'Claude',
          lastName: 'Renard',
          profileImageUrl: 'https://example.com/avatars/admin-3.jpg',
          passwordHash,
        })
        .returning(),
    ])

    // Extract first result from each Promise (returning() returns array)
    const adminUserIds = adminUsers.map((result) => result[0].id)

    // Create admin profiles
    await tx.insert(schema.profiles).values(
      adminUserIds.map((userId) => ({
        userId,
        role: 'admin',
        status: 'approved',
        phone: generatePhoneNumber(),
        notificationPrefs: generateNotificationPrefs(),
      })),
    )

    // Create seller users (5)
    console.log('Creating seller users (5)...')
    const sellerData = [
      { email: 'seller.dupont@example.fr', first: 'Pierre', last: 'Dupont' },
      { email: 'seller.martin@example.fr', first: 'Marie', last: 'Martin' },
      { email: 'seller.bernard@example.fr', first: 'Jean', last: 'Bernard' },
      { email: 'seller.laurent@example.fr', first: 'Sophie', last: 'Laurent' },
      { email: 'seller.leclerc@example.fr', first: 'Marc', last: 'Leclerc' },
    ]

    const sellerUsers = await Promise.all(
      sellerData.map((data) =>
        tx
          .insert(schema.users)
          .values({
            email: data.email,
            firstName: data.first,
            lastName: data.last,
            profileImageUrl: `https://example.com/avatars/seller-${data.last.toLowerCase()}.jpg`,
            passwordHash,
          })
          .returning(),
      ),
    )

    const sellerUserIds = sellerUsers.map((result) => result[0].id)

    // Create seller profiles
    await tx.insert(schema.profiles).values(
      sellerUserIds.map((userId, index) => {
        const addr = generateAddress()
        return {
          userId,
          role: 'seller',
          status: 'approved',
          phone: generatePhoneNumber(),
          address: addr.address,
          city: addr.city,
          postalCode: addr.postalCode,
          department: addr.department,
          bio:
            index === 0
              ? 'Professional seller specializing in quality items. Sells high-end fashion.'
              : index === 1
                ? 'Professional seller specializing in quality items. Specializes in electronics.'
                : 'Professional seller specializing in quality items. General merchandise seller.',
          experience: `${randomInt(2, 10)} years of selling experience`,
          notificationPrefs: generateNotificationPrefs(),
        }
      }),
    )

    // Create marchand users (3: 1 approved+active, 1 approved+inactive, 1 pending)
    console.log('Creating marchand users (3)...')
    const marchands = [
      {
        email: 'marchand.bernard@example.fr',
        first: 'Thomas',
        last: 'Bernard',
        status: 'approved' as const,
        bio: 'Experienced reseller with 8 years in the market. Focus on quality items and customer service.',
      },
      {
        email: 'marchand.simon@example.fr',
        first: 'Émilie',
        last: 'Simon',
        status: 'approved' as const,
        bio: 'Secondary reseller (minimal activity)',
      },
      {
        email: 'marchand.rousseau@example.fr',
        first: 'Nicolas',
        last: 'Rousseau',
        status: 'pending' as const,
        bio: 'New reseller applying to the platform. Under review.',
      },
    ]

    const marchantUsers = await Promise.all(
      marchands.map((data) =>
        tx
          .insert(schema.users)
          .values({
            email: data.email,
            firstName: data.first,
            lastName: data.last,
            profileImageUrl: `https://example.com/avatars/marchand-${data.last.toLowerCase()}.jpg`,
            passwordHash,
          })
          .returning(),
      ),
    )

    const marchantUserIds = marchantUsers.map((result) => result[0].id)

    // Create marchand profiles
    await tx.insert(schema.profiles).values(
      marchantUserIds.map((userId, index) => {
        const addr = generateAddress()
        const marchData = marchands[index]
        return {
          userId,
          role: 'marchand',
          status: marchData.status,
          phone: generatePhoneNumber(),
          address: addr.address,
          city: addr.city,
          postalCode: addr.postalCode,
          department: addr.department,
          bio: marchData.bio,
          experience:
            index === 2
              ? null
              : `${randomInt(5, 15)} years of reselling experience`,
          siretNumber: `${addr.postalCode.substring(0, 2)}123${randomInt(10000000, 99999999)}`,
          notificationPrefs: generateNotificationPrefs(),
        }
      }),
    )

    // Create requests & items (basic version for MVP seed)
    console.log('Creating requests & items...')

    // Request 1: Pending (no marchand assigned yet)
    const [request1] = await tx
      .insert(schema.requests)
      .values({
        sellerId: sellerUserIds[0],
        serviceType: 'resale',
        status: 'pending',
        itemCount: 3,
        categories: ['fashion', 'accessories'],
        itemCondition: 'excellent',
        meetingLocation: 'Paris, France',
        notes: 'High-end designer items, must be handled carefully',
      })
      .returning()

    // Add items to request 1
    await tx.insert(schema.items).values([
      {
        requestId: request1.id,
        sellerId: sellerUserIds[0],
        title: 'Vintage Leather Handbag',
        description: 'Authentic designer handbag, excellent condition',
        brand: 'Hermès',
        category: 'fashion',
        subcategory: 'handbags',
        condition: 'excellent',
        status: 'pending_approval',
        minPrice: 150,
        maxPrice: 200,
        photos: [
          'https://example.com/marketplace/item-1-photo-1.jpg',
          'https://example.com/marketplace/item-1-photo-2.jpg',
        ],
      },
      {
        requestId: request1.id,
        sellerId: sellerUserIds[0],
        title: 'Silk Scarf',
        description: 'Classic silk scarf from luxury brand',
        brand: 'Hermès',
        category: 'accessories',
        condition: 'excellent',
        status: 'pending_approval',
        minPrice: 50,
        maxPrice: 80,
        photos: ['https://example.com/marketplace/item-2-photo-1.jpg'],
      },
      {
        requestId: request1.id,
        sellerId: sellerUserIds[0],
        title: 'Sunglasses',
        description: 'Designer sunglasses with original case',
        brand: 'Chanel',
        category: 'accessories',
        condition: 'like-new',
        status: 'pending_approval',
        minPrice: 120,
        maxPrice: 150,
        photos: ['https://example.com/marketplace/item-3-photo-1.jpg'],
      },
    ])

    // Request 2: In progress with some approved items
    const [request2] = await tx
      .insert(schema.requests)
      .values({
        sellerId: sellerUserIds[1],
        serviceType: 'resale',
        status: 'in_progress',
        itemCount: 2,
        categories: ['electronics'],
        meetingLocation: 'Marseille, France',
      })
      .returning()

    await tx.insert(schema.items).values([
      {
        requestId: request2.id,
        sellerId: sellerUserIds[1],
        title: 'Apple AirPods Pro',
        description: 'Wireless earbuds, original packaging',
        brand: 'Apple',
        category: 'electronics',
        subcategory: 'audio',
        condition: 'excellent',
        status: 'approved',
        minPrice: 180,
        maxPrice: 220,
        approvedPrice: 200,
        photos: ['https://example.com/marketplace/item-4-photo-1.jpg'],
        model: 'AirPods Pro 2',
      },
      {
        requestId: request2.id,
        sellerId: sellerUserIds[1],
        title: 'USB-C Cable',
        description: 'High-quality charging cable',
        brand: 'Apple',
        category: 'electronics',
        condition: 'new',
        status: 'approved',
        minPrice: 15,
        maxPrice: 25,
        approvedPrice: 20,
        photos: ['https://example.com/marketplace/item-5-photo-1.jpg'],
      },
    ])

    console.log('✅ Seed complete.')
    console.log('Database ready for testing.')
  })
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
