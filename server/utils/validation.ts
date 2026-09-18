import { z } from 'zod'
import { CAR_CATEGORIES, SERVICE_TYPES } from './constants'

export const registerSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  phone: z.string().min(5).max(30).trim().optional(),
  password: z.string().min(8).max(128),
})

export const loginSchema = z.object({
  email: z.string().email().max(255).toLowerCase().trim(),
  password: z.string().min(1).max(128),
})

export const carSchema = z.object({
  make: z.string().min(1).max(100).trim(),
  model: z.string().min(1).max(100).trim(),
  registrationNumber: z.string().max(20).trim().optional().nullable(),
  category: z.enum(CAR_CATEGORIES),
})

export const carUpdateSchema = carSchema.partial()

export const serviceSchema = z.object({
  nameLv: z.string().min(1).max(200).trim(),
  nameRu: z.string().max(200).trim().optional().nullable(),
  nameEn: z.string().max(200).trim().optional().nullable(),
  type: z.enum(SERVICE_TYPES),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).optional().default(0),
})

export const serviceUpdateSchema = serviceSchema.partial()

export const servicePriceSchema = z.object({
  serviceId: z.string().uuid(),
  carCategory: z.enum(CAR_CATEGORIES),
  priceCents: z.number().int().min(0),
})

export const servicePricesUpdateSchema = z.object({
  prices: z.array(
    z.object({
      serviceId: z.string().uuid(),
      carCategory: z.enum(CAR_CATEGORIES),
      priceCents: z.number().int().min(0),
    }),
  ),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CarInput = z.infer<typeof carSchema>
export type ServiceInput = z.infer<typeof serviceSchema>
