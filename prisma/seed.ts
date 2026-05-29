import pg from 'pg'
import { randomInt } from 'crypto'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'
import {
  generateName,
  generateAddress,
  generatePhoneNumber,
  generateEmail,
  generateNotificationPrefs,
  pickRandom,
} from './generators'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting French dataset seed...')

  await prisma.$transaction(async (tx) => {
    // Deletion order (respects FK constraints - delete from leaf tables first)
    console.log('Deleting existing data...')
    await tx.moderation_actions.deleteMany()
    await tx.fee_tier_changelog.deleteMany()
    await tx.agreement_signatures.deleteMany()
    await tx.agreements.deleteMany()
    await tx.item_price_offers.deleteMany()
    await tx.item_document_requests.deleteMany()
    await tx.item_documents.deleteMany()
    await tx.reviews.deleteMany()
    await tx.transactions.deleteMany()
    await tx.meetings.deleteMany()
    await tx.messages.deleteMany()
    await tx.notifications.deleteMany()
    await tx.items.deleteMany()
    await tx.requests.deleteMany()
    await tx.profiles.deleteMany()
    await tx.sessions.deleteMany()
    await tx.users.deleteMany()

    // Create fee tiers (Tier 1, 2, 3 with Sellzy commission splits)
    console.log('Creating fee_tiers (3)...')
    const tiers = await tx.fee_tiers.createMany({
      data: [
        {
          label: 'Tier 1: €0-150',
          min_price: new Decimal('0'),
          max_price: new Decimal('150'),
          seller_percent: new Decimal('50'),
          reseller_percent: new Decimal('40'),
          platform_percent: new Decimal('10'),
          currency_note: 'EUR/CHF',
          is_active: true,
        },
        {
          label: 'Tier 2: €151-500',
          min_price: new Decimal('151'),
          max_price: new Decimal('500'),
          seller_percent: new Decimal('55'),
          reseller_percent: new Decimal('35'),
          platform_percent: new Decimal('10'),
          currency_note: 'EUR/CHF',
          is_active: true,
        },
        {
          label: 'Tier 3: €501+',
          min_price: new Decimal('501'),
          max_price: null,
          seller_percent: new Decimal('60'),
          reseller_percent: new Decimal('30'),
          platform_percent: new Decimal('10'),
          currency_note: 'EUR/CHF',
          is_active: true,
        },
      ],
    })

    // Create admin users (3)
    console.log('Creating admin users (3)...')
    const adminUsers = await Promise.all([
      tx.users.create({
        data: {
          email: 'admin.moreau@example.fr',
          first_name: 'André',
          last_name: 'Moreau',
          profile_image_url: 'https://example.com/avatars/admin-1.jpg',
        },
      }),
      tx.users.create({
        data: {
          email: 'admin.lefevre@example.fr',
          first_name: 'Isabelle',
          last_name: 'Lefebvre',
          profile_image_url: 'https://example.com/avatars/admin-2.jpg',
        },
      }),
      tx.users.create({
        data: {
          email: 'admin.renard@example.fr',
          first_name: 'Claude',
          last_name: 'Renard',
          profile_image_url: 'https://example.com/avatars/admin-3.jpg',
        },
      }),
    ])

    // Create admin profiles
    await tx.profiles.createMany({
      data: adminUsers.map((user) => ({
        user_id: user.id,
        role: 'admin',
        status: 'approved',
        phone: generatePhoneNumber(),
        notification_prefs: generateNotificationPrefs(),
      })),
    })

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
        tx.users.create({
          data: {
            email: data.email,
            first_name: data.first,
            last_name: data.last,
            profile_image_url: `https://example.com/avatars/seller-${data.last.toLowerCase()}.jpg`,
          },
        }),
      ),
    )

    // Create seller profiles
    await tx.profiles.createMany({
      data: sellerUsers.map((user, index) => {
        const addr = generateAddress()
        return {
          user_id: user.id,
          role: 'seller',
          status: 'approved',
          phone: generatePhoneNumber(),
          address: addr.address,
          city: addr.city,
          postal_code: addr.postalCode,
          department: addr.department,
          bio: `Professional seller specializing in quality items. ${index === 0 ? 'Sells high-end fashion.' : index === 1 ? 'Specializes in electronics.' : 'General merchandise seller.'}`,
          experience: `${randomInt(2, 10)} years of selling experience`,
          notification_prefs: generateNotificationPrefs(),
        }
      }),
    })

    // Create marchand users (3: 1 approved+active, 1 approved+inactive, 1 pending)
    console.log('Creating marchand users (3)...')
    const marchands = [
      {
        email: 'marchand.bernard@example.fr',
        first: 'Thomas',
        last: 'Bernard',
        status: 'approved',
        bio: 'Experienced reseller with 8 years in the market. Focus on quality items and customer service.',
      },
      {
        email: 'marchand.simon@example.fr',
        first: 'Émilie',
        last: 'Simon',
        status: 'approved',
        bio: 'Secondary reseller (minimal activity)',
      },
      {
        email: 'marchand.rousseau@example.fr',
        first: 'Nicolas',
        last: 'Rousseau',
        status: 'pending',
        bio: 'New reseller applying to the platform. Under review.',
      },
    ]

    const marchantUsers = await Promise.all(
      marchands.map((data) =>
        tx.users.create({
          data: {
            email: data.email,
            first_name: data.first,
            last_name: data.last,
            profile_image_url: `https://example.com/avatars/marchand-${data.last.toLowerCase()}.jpg`,
          },
        }),
      ),
    )

    // Create marchand profiles
    await tx.profiles.createMany({
      data: marchantUsers.map((user, index) => {
        const addr = generateAddress()
        const marchData = marchands[index]
        return {
          user_id: user.id,
          role: 'marchand',
          status: marchData.status as 'approved' | 'pending',
          phone: generatePhoneNumber(),
          address: addr.address,
          city: addr.city,
          postal_code: addr.postalCode,
          department: addr.department,
          bio: marchData.bio,
          experience: index === 2 ? null : `${randomInt(5, 15)} years of reselling experience`,
          siret_number: `${addr.postalCode.substring(0, 2)}123${randomInt(10000000, 99999999)}`,
          notification_prefs: generateNotificationPrefs(),
        }
      }),
    })

    // Create requests & items (basic version for MVP seed)
    console.log('Creating requests & items...')

    // Request 1: Pending (no marchand assigned yet)
    const request1 = await tx.requests.create({
      data: {
        seller_id: sellerUsers[0].id,
        service_type: 'resale',
        status: 'pending',
        item_count: 3,
        categories: ['fashion', 'accessories'],
        item_condition: 'excellent',
        meeting_location: 'Paris, France',
        notes: 'High-end designer items, must be handled carefully',
      },
    })

    // Add items to request 1
    await tx.items.createMany({
      data: [
        {
          request_id: request1.id,
          seller_id: sellerUsers[0].id,
          title: 'Vintage Leather Handbag',
          description: 'Authentic designer handbag, excellent condition',
          brand: 'Hermès',
          category: 'fashion',
          subcategory: 'handbags',
          condition: 'excellent',
          status: 'pending_approval',
          min_price: new Decimal('150'),
          max_price: new Decimal('200'),
          photos: [
            'https://example.com/marketplace/item-1-photo-1.jpg',
            'https://example.com/marketplace/item-1-photo-2.jpg',
          ],
        },
        {
          request_id: request1.id,
          seller_id: sellerUsers[0].id,
          title: 'Silk Scarf',
          description: 'Classic silk scarf from luxury brand',
          brand: 'Hermès',
          category: 'accessories',
          condition: 'excellent',
          status: 'pending_approval',
          min_price: new Decimal('50'),
          max_price: new Decimal('80'),
          photos: ['https://example.com/marketplace/item-2-photo-1.jpg'],
        },
        {
          request_id: request1.id,
          seller_id: sellerUsers[0].id,
          title: 'Sunglasses',
          description: 'Designer sunglasses with original case',
          brand: 'Chanel',
          category: 'accessories',
          condition: 'like-new',
          status: 'pending_approval',
          min_price: new Decimal('120'),
          max_price: new Decimal('150'),
          photos: ['https://example.com/marketplace/item-3-photo-1.jpg'],
        },
      ],
    })

    // Request 2: In progress with some approved items
    const request2 = await tx.requests.create({
      data: {
        seller_id: sellerUsers[1].id,
        service_type: 'resale',
        status: 'in_progress',
        item_count: 2,
        categories: ['electronics'],
        meeting_location: 'Marseille, France',
      },
    })

    await tx.items.createMany({
      data: [
        {
          request_id: request2.id,
          seller_id: sellerUsers[1].id,
          title: 'Apple AirPods Pro',
          description: 'Wireless earbuds, original packaging',
          brand: 'Apple',
          category: 'electronics',
          subcategory: 'audio',
          condition: 'excellent',
          status: 'approved',
          min_price: new Decimal('180'),
          max_price: new Decimal('220'),
          approved_price: new Decimal('200'),
          photos: ['https://example.com/marketplace/item-4-photo-1.jpg'],
          model: 'AirPods Pro 2',
        },
        {
          request_id: request2.id,
          seller_id: sellerUsers[1].id,
          title: 'USB-C Cable',
          description: 'High-quality charging cable',
          brand: 'Apple',
          category: 'electronics',
          condition: 'new',
          status: 'approved',
          min_price: new Decimal('15'),
          max_price: new Decimal('25'),
          approved_price: new Decimal('20'),
          photos: ['https://example.com/marketplace/item-5-photo-1.jpg'],
        },
      ],
    })

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
    await prisma.$disconnect()
    await pool.end()
  })
