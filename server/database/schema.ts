import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
  time,
  uniqueIndex,
  index,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

// ─────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: ['customer', 'admin'] }).notNull().default('customer'),
  banned: boolean('banned').notNull().default(false),
  banReason: text('ban_reason'),
  bannedAt: timestamp('banned_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─────────────────────────────────────────────
// SESSIONS
// ─────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('sessions_user_id_idx').on(table.userId),
  index('sessions_expires_at_idx').on(table.expiresAt),
])

// ─────────────────────────────────────────────
// CARS
// ─────────────────────────────────────────────
export const cars = pgTable('cars', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  make: text('make').notNull(),
  model: text('model').notNull(),
  registrationNumber: text('registration_number'),
  category: text('category', { enum: ['passenger', 'crossover', 'minibus'] }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('cars_user_id_idx').on(table.userId),
])

// ─────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  nameLv: text('name_lv').notNull(),
  nameRu: text('name_ru'),
  nameEn: text('name_en'),
  type: text('type', { enum: ['main', 'additional'] }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─────────────────────────────────────────────
// SERVICE PRICES (per car category)
// ─────────────────────────────────────────────
export const servicePrices = pgTable('service_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'cascade' }),
  carCategory: text('car_category', { enum: ['passenger', 'crossover', 'minibus'] }).notNull(),
  priceCents: integer('price_cents').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => [
  uniqueIndex('service_prices_service_category_unique').on(table.serviceId, table.carCategory),
  check('price_cents_positive', sql`${table.priceCents} >= 0`),
])

// ─────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────
export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  carId: uuid('car_id').notNull().references(() => cars.id),
  mainServiceId: uuid('main_service_id').notNull().references(() => services.id),
  bookingDate: date('booking_date').notNull(),
  bookingTime: time('booking_time').notNull(),
  priceCents: integer('price_cents').notNull(),
  status: text('status', {
    enum: ['pending', 'confirmed', 'completed', 'cancelled_customer', 'cancelled_admin', 'no_show'],
  }).notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  // CRITICAL: only one active booking per slot
  uniqueIndex('bookings_active_slot_unique')
    .on(table.bookingDate, table.bookingTime)
    .where(sql`status IN ('pending', 'confirmed')`),
  index('bookings_user_id_idx').on(table.userId),
  index('bookings_date_idx').on(table.bookingDate),
  index('bookings_status_idx').on(table.status),
])

// ─────────────────────────────────────────────
// BOOKING SERVICES (main + additional with frozen prices)
// ─────────────────────────────────────────────
export const bookingServices = pgTable('booking_services', {
  bookingId: uuid('booking_id').notNull().references(() => bookings.id, { onDelete: 'cascade' }),
  serviceId: uuid('service_id').notNull().references(() => services.id),
  priceCents: integer('price_cents').notNull(),
}, (table) => [
  primaryKey({ columns: [table.bookingId, table.serviceId] }),
])

// ─────────────────────────────────────────────
// BLOCKED SLOTS
// ─────────────────────────────────────────────
export const blockedSlots = pgTable('blocked_slots', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingDate: date('booking_date').notNull(),
  bookingTime: time('booking_time'), // NULL = whole day blocked
  reason: text('reason'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('blocked_slots_date_idx').on(table.bookingDate),
])

// ─────────────────────────────────────────────
// HOLIDAYS
// ─────────────────────────────────────────────
export const holidays = pgTable('holidays', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: date('date').notNull().unique(),
  name: text('name').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ─────────────────────────────────────────────
// AUDIT LOGS
// ─────────────────────────────────────────────
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  actorId: uuid('actor_id').references(() => users.id),
  action: text('action').notNull(),
  targetId: uuid('target_id'),
  metadata: text('metadata'), // JSON string
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('audit_logs_actor_id_idx').on(table.actorId),
  index('audit_logs_action_idx').on(table.action),
  index('audit_logs_created_at_idx').on(table.createdAt),
])

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Car = typeof cars.$inferSelect
export type NewCar = typeof cars.$inferInsert
export type Service = typeof services.$inferSelect
export type Booking = typeof bookings.$inferSelect
export type NewBooking = typeof bookings.$inferInsert
export type BlockedSlot = typeof blockedSlots.$inferSelect
export type Holiday = typeof holidays.$inferSelect
