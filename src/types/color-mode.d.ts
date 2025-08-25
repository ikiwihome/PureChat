declare module '@nuxtjs/color-mode' {
  interface ColorMode {
    value: 'light' | 'dark' | 'system'
    preference: 'light' | 'dark' | 'system'
    unknown: boolean
    forced: boolean
  }

  export function useColorMode(): ColorMode
}
