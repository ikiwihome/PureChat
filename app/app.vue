<template>
  <div class="h-screen flex flex-col" :class="colorMode.value">
    <NuxtPage />
  </div>
</template>

<script setup>
// 获取颜色模式的响应式引用，useColorMode 会被自动导入
const colorMode = useColorMode();

// 在应用启动时加载主题偏好设置
if (typeof window !== 'undefined') {
  try {
    const storedPreference = localStorage.getItem('theme_preference');
    if (storedPreference && (storedPreference === 'light' || storedPreference === 'dark')) {
      colorMode.preference = storedPreference;
    } else {
      // 如果没有保存的主题偏好，设置默认主题为浅色模式
      colorMode.preference = 'light';
    }
  } catch (error) {
    console.error('Failed to load theme preference from localStorage:', error);
    // 如果加载失败，设置默认主题为浅色模式
    colorMode.preference = 'light';
  }
}
</script>

<style scoped></style>
