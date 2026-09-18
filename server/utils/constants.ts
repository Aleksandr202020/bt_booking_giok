/**
 * Business constants for BT Automazgātava
 * Timezone: Europe/Riga
 */

export const TIMEZONE = 'Europe/Riga'

/** Working slots (hours) */
export const WORKING_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
] as const

export type WorkingSlot = (typeof WORKING_SLOTS)[number]

/** Customer can book today + next N days */
export const CUSTOMER_BOOKING_WINDOW_DAYS = 14

/** Max active bookings per customer in the window */
export const MAX_CUSTOMER_BOOKINGS_IN_WINDOW = 3

/** Max active bookings per car in the window */
export const MAX_CUSTOMER_BOOKINGS_PER_CAR_IN_WINDOW = 2

/** Customer can cancel not later than N hours before slot */
export const CANCEL_MIN_HOURS_BEFORE = 2

/** Car categories */
export const CAR_CATEGORIES = ['passenger', 'crossover', 'minibus'] as const
export type CarCategory = (typeof CAR_CATEGORIES)[number]

/** Booking statuses that block a slot */
export const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'] as const

/** All booking statuses */
export const BOOKING_STATUSES = [
  'pending',
  'confirmed',
  'completed',
  'cancelled_customer',
  'cancelled_admin',
  'no_show',
] as const

export type BookingStatus = (typeof BOOKING_STATUSES)[number]

/** Service types */
export const SERVICE_TYPES = ['main', 'additional'] as const
export type ServiceType = (typeof SERVICE_TYPES)[number]

/** Slot availability statuses returned by the engine */
export const SLOT_STATUSES = [
  'available',
  'booked',
  'blocked',
  'past',
  'holiday',
  'outside_booking_window',
] as const

export type SlotStatus = (typeof SLOT_STATUSES)[number]

/** Default prices in cents (used only for seed) */
export const DEFAULT_PRICES: Record<CarCategory, number> = {
  passenger: 2500,
  crossover: 3000,
  minibus: 3500,
}
