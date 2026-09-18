// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  // Defaults only. On Vercel override with:
  //   NUXT_DATABASE_URL or DATABASE_URL
  //   NUXT_SESSION_SECRET or SESSION_SECRET
  //   NUXT_PUBLIC_APP_URL or APP_URL
  runtimeConfig: {
    sessionSecret: '',
    databaseUrl: '',
    public: {
      appUrl: 'http://localhost:3000',
    },
  },

  nitro: {
    preset: 'vercel',
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },
})
