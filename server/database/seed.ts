/**
 * Development seed.
 * NEVER run this in production with real credentials.
 *
 * Usage: npm run db:seed
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = postgres(connectionString, { prepare: false })
const db = drizzle(client, { schema })

async function seed() {
  console.log('🌱 Seeding database...')

  // ── Admin ──────────────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const [admin] = await db
    .insert(schema.users)
    .values({
      name: 'Admin',
      email: 'admin@bt-automazgatava.lv',
      phone: '+37120000000',
      passwordHash: adminPassword,
      role: 'admin',
    })
    .onConflictDoNothing()
    .returning()

  console.log('✓ Admin:', admin?.email ?? 'already exists')

  // ── Test customer ──────────────────────────
  const customerPassword = await bcrypt.hash('Customer123!', 12)
  const [customer] = await db
    .insert(schema.users)
    .values({
      name: 'Jānis Bērziņš',
      email: 'customer@example.com',
      phone: '+37121111111',
      passwordHash: customerPassword,
      role: 'customer',
    })
    .onConflictDoNothing()
    .returning()

  console.log('✓ Customer:', customer?.email ?? 'already exists')

  // ── Cars for customer ──────────────────────
  if (customer) {
    await db.insert(schema.cars).values([
      {
        userId: customer.id,
        make: 'Volkswagen',
        model: 'Golf',
        registrationNumber: 'AB-1234',
        category: 'passenger',
      },
      {
        userId: customer.id,
        make: 'Toyota',
        model: 'RAV4',
        registrationNumber: 'CD-5678',
        category: 'crossover',
      },
    ]).onConflictDoNothing()
    console.log('✓ Test cars created')
  }

  // ── Services ───────────────────────────────
  const mainServices = [
    { nameLv: 'Standarta mazgāšana', nameRu: 'Стандартная мойка', nameEn: 'Standard wash', type: 'main' as const, sortOrder: 1 },
    { nameLv: 'Kompleksā mazgāšana', nameRu: 'Комплексная мойка', nameEn: 'Complex wash', type: 'main' as const, sortOrder: 2 },
    { nameLv: 'Virsbūves mazgāšana', nameRu: 'Мойка кузова', nameEn: 'Body wash', type: 'main' as const, sortOrder: 3 },
    { nameLv: 'Salona tīrīšana', nameRu: 'Чистка салона', nameEn: 'Interior cleaning', type: 'main' as const, sortOrder: 4 },
  ]

  const additionalServices = [
    { nameLv: 'Motora mazgāšana', nameRu: 'Мойка двигателя', nameEn: 'Engine wash', type: 'additional' as const, sortOrder: 10 },
    { nameLv: 'Stiklu mazgāšana iekšpusē', nameRu: 'Мойка стёкол внутри', nameEn: 'Interior glass wash', type: 'additional' as const, sortOrder: 11 },
    { nameLv: 'Ādas apstrāde ar kondicionieri', nameRu: 'Обработка кожи кондиционером', nameEn: 'Leather conditioning', type: 'additional' as const, sortOrder: 12 },
    { nameLv: 'Pretlietus uz priekšējā stikla', nameRu: 'Антидождь на лобовое стекло', nameEn: 'Anti-rain on windshield', type: 'additional' as const, sortOrder: 13 },
    { nameLv: 'Riepu melnināšana', nameRu: 'Чернение резины', nameEn: 'Tire blackening', type: 'additional' as const, sortOrder: 14 },
  ]

  const allServices = [...mainServices, ...additionalServices]

  const insertedServices = await db
    .insert(schema.services)
    .values(allServices)
    .onConflictDoNothing()
    .returning()

  console.log(`✓ Services: ${insertedServices.length} created`)

  // ── Prices (default) ───────────────────────
  const categories = ['passenger', 'crossover', 'minibus'] as const
  const priceMap: Record<string, Record<string, number>> = {
    'Standarta mazgāšana': { passenger: 2500, crossover: 3000, minibus: 3500 },
    'Kompleksā mazgāšana': { passenger: 3500, crossover: 4000, minibus: 4500 },
    'Virsbūves mazgāšana': { passenger: 2000, crossover: 2500, minibus: 3000 },
    'Salona tīrīšana': { passenger: 3000, crossover: 3500, minibus: 4000 },
    'Motora mazgāšana': { passenger: 1500, crossover: 1500, minibus: 2000 },
    'Stiklu mazgāšana iekšpusē': { passenger: 800, crossover: 800, minibus: 1000 },
    'Ādas apstrāde ar kondicionieri': { passenger: 1200, crossover: 1200, minibus: 1500 },
    'Pretlietus uz priekšējā stikla': { passenger: 1000, crossover: 1000, minibus: 1200 },
    'Riepu melnināšana': { passenger: 500, crossover: 500, minibus: 700 },
  }

  const services = await db.select().from(schema.services)

  for (const service of services) {
    const prices = priceMap[service.nameLv]
    if (!prices) continue

    for (const category of categories) {
      await db
        .insert(schema.servicePrices)
        .values({
          serviceId: service.id,
          carCategory: category,
          priceCents: prices[category],
        })
        .onConflictDoNothing()
    }
  }

  console.log('✓ Service prices set')

  // ── Sample holiday ─────────────────────────
  await db
    .insert(schema.holidays)
    .values({
      date: '2026-12-25',
      name: 'Ziemassvētki',
      active: true,
    })
    .onConflictDoNothing()

  console.log('✓ Sample holiday created')

  console.log('\n✅ Seed completed')
  console.log('────────────────────────────')
  console.log('Admin:    admin@bt-automazgatava.lv / Admin123!')
  console.log('Customer: customer@example.com / Customer123!')
  console.log('────────────────────────────')
  console.log('⚠️  These credentials are for DEVELOPMENT only.')

  await client.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
