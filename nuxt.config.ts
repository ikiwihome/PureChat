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

  // 运行时配置 - 用于服务器端API
  runtimeConfig: {
    // 服务器端可用的私有配置
    // 使用 NUXT_ 前缀使这些环境变量可以在运行时被覆盖
    defaultBaseUrl: process.env.NUXT_DEFAULT_BASE_URL || process.env.DEFAULT_BASE_URL || 'https://openrouter.ai/api/v1',
    defaultApiKey: process.env.NUXT_DEFAULT_API_KEY || process.env.DEFAULT_API_KEY || '',
  },

  modules: ['shadcn-nuxt', '@nuxtjs/color-mode', 'vue-sonner/nuxt'],

  colorMode: {
    classSuffix: ''
  },
  nitro: {
    // 使用默认的 node-server preset 以生成完整的服务器应用
    // preset: 'node-server', // 默认值，可以省略
    compressPublicAssets: false,
    prerender: {
      routes: ['/'],
      ignore: ['/200', '/404'],
      crawlLinks: false
    },
    routeRules: {
      '/': { ssr: true },
      '/**': {
        ssr: true,
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
      title: pkg.title,
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
