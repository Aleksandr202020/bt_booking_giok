import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz'
import { addDays, isBefore } from 'date-fns'
import {
  TIMEZONE,
  WORKING_SLOTS,
  CUSTOMER_BOOKING_WINDOW_DAYS,
  CANCEL_MIN_HOURS_BEFORE,
  type WorkingSlot,
} from './constants'

export function nowInRiga(): Date {
  return toZonedTime(new Date(), TIMEZONE)
}

export function formatDateRiga(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd')
}

export function formatTime(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'HH:mm')
}

export function parseDateRiga(dateStr: string): Date {
  return fromZonedTime(`${dateStr}T00:00:00`, TIMEZONE)
}

export function isValidWorkingSlot(time: string): time is WorkingSlot {
  return (WORKING_SLOTS as readonly string[]).includes(time)
}

export function isWithinCustomerBookingWindow(dateStr: string): boolean {
  const today = formatDateRiga(nowInRiga())
  const maxDate = formatDateRiga(addDays(nowInRiga(), CUSTOMER_BOOKING_WINDOW_DAYS))
  return dateStr >= today && dateStr <= maxDate
}

export function isSlotPast(dateStr: string, timeStr: string): boolean {
  const now = nowInRiga()
  const slotDateTime = fromZonedTime(`${dateStr}T${timeStr}:00`, TIMEZONE)
  return isBefore(slotDateTime, now)
}

export function canCustomerCancel(dateStr: string, timeStr: string): boolean {
  const now = nowInRiga()
  const slotDateTime = fromZonedTime(`${dateStr}T${timeStr}:00`, TIMEZONE)
  const hoursUntil = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60)
  return hoursUntil >= CANCEL_MIN_HOURS_BEFORE
}

export function todayRiga(): string {
  return formatDateRiga(nowInRiga())
}
