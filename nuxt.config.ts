// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import pkg from './package.json';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  css: ['./app/assets/css/tailwind.css'],

  // SSR must be turned off
  // 如果您希望完全是SPA（前端），并且后端API由Nuxt服务器提供，可以保留 ssr: false
  // 如果您希望利用Nuxt的SSR能力，请注释掉 ssr: false
  ssr: false,

  modules: ['shadcn-nuxt', '@nuxtjs/color-mode', 'vue-sonner/nuxt'],

  colorMode: {
    classSuffix: ''
  },
  nitro: {
    // 移除或注释掉 preset: 'static'，这样Nitro会默认构建一个Node.js服务器预设
    preset: 'static',
    compressPublicAssets: false,
    prerender: {
      routes: ['/'],
      ignore: ['/200', '/404'],
      crawlLinks: false
    },
    routeRules: {
      '/**': {
        headers: {
          'X-Frame-Options': 'DENY',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
          'Permissions-Policy': 'geolocation=(), microphone=()'
        }
      }
    }
  },
  vite: {
    css: {
      devSourcemap: true
    },
    optimizeDeps: {
      exclude: ['@nuxt/nitro']
    },
    build: {
      // css/js compress
      minify: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          sourcemap: false
        }
      }
    },
    plugins: [
      tailwindcss(),
    ],
  },
  app: {
    head: {
      title: pkg.name,
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1.0, shrink-to-fit=no',
      htmlAttrs: {
        lang: 'zh-CN',
      },
      meta: [
        { name: 'keywords', content: pkg.keywords.join(', ') },
        { name: 'description', content: pkg.description }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ]
    }
  }
});
