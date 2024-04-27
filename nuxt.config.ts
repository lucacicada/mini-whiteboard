// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss',
  ],

  app: {
    rootId: 'app',
    head: {
      title: 'Mini Whiteboard',
    },
  },

  devtools: {
    enabled: true,
  },
})
