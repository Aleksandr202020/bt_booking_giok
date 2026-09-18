// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    // Private keys (only available on server)
    sessionSecret: process.env.SESSION_SECRET || '',
    databaseUrl: process.env.DATABASE_URL || '',

    // Public keys (exposed to client)
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    },
  },

  // Nitro config for Vercel
  nitro: {
    preset: 'vercel',
  },

  typescript: {
    strict: true,
    typeCheck: false, // run via npm run typecheck
  },
})
