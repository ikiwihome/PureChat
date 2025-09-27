// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from "@tailwindcss/vite";
import pkg from './package.json';

export default defineNuxtConfig({
  devServer: {
    host: '0.0.0.0',
    port: 8001
  },
  compatibilityDate: '2025-05-22',
  devtools: { enabled: false },
  css: ['./src/assets/css/tailwind.css'],

  // SSR must be turned off
  // 如果您希望完全是SPA（前端），并且后端API由Nuxt服务器提供，可以保留 ssr: false
  // 如果您希望利用Nuxt的SSR能力，请注释掉 ssr: false
  ssr: false,
  srcDir: "src/",

  modules: ['shadcn-nuxt', '@nuxtjs/color-mode', 'vue-sonner/nuxt'],
  colorMode: {
    classSuffix: ''
  },
  nitro: {
    // 移除或注释掉 preset: 'static'，这样Nitro会默认构建一个Node.js服务器预设
    // preset: 'static',
    compressPublicAssets: false,
    prerender: {
      routes: ['/']
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
      title: 'ChatBot',
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
    },
    baseURL: './',
    buildAssetsDir: '_nuxt/'
  },

  // 运行时配置
  runtimeConfig: {
    // 公共配置（前端可访问）
    public: {
      appName: 'PureChat',
      appVersion: pkg.version
    }
  }
});
