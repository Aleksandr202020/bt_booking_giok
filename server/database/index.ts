import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

function getConnectionString(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.NUXT_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    ''

  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Add DATABASE_URL in Vercel Environment Variables (Production) and Redeploy.',
    )
  }

  return url
}

// Lazy init — do not connect at import time
let _db: ReturnType<typeof drizzle<typeof schema>> | null = null

function createDb() {
  const connectionString = getConnectionString()
  const client = postgres(connectionString, {
    prepare: false,
    max: 1, // serverless-friendly
    idle_timeout: 20,
    connect_timeout: 10,
  })
  return drizzle(client, { schema })
}

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop, receiver) {
    if (!_db) {
      _db = createDb()
    }
    return Reflect.get(_db, prop, receiver)
  },
})

export type Database = ReturnType<typeof createDb>
