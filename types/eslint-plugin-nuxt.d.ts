declare module 'eslint-plugin-nuxt' {
  const plugin: {
    configs: {
      recommended: {
        rules: Record<string, any>
      }
    }
  }
  export default plugin
}
