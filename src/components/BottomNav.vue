<template>
  <nav class="bottom-nav" aria-label="主导航">
    <RouterLink
      to="/"
      class="bottom-nav-item"
      :class="{ active: route.name === 'home' }"
      aria-label="查看心情日志列表"
    >
      <span class="bottom-nav-icon" aria-hidden="true">📒</span>
      <span class="bottom-nav-label">列表</span>
    </RouterLink>

    <RouterLink
      to="/new"
      class="bottom-nav-item bottom-nav-item--primary"
      :class="{ active: route.name === 'newDiary' }"
      aria-label="新建心情日志"
    >
      <span class="bottom-nav-icon" aria-hidden="true">✏️</span>
      <span class="bottom-nav-label">新建</span>
    </RouterLink>

    <RouterLink
      to="/insights"
      class="bottom-nav-item"
      :class="{ active: route.name === 'insights' }"
      aria-label="查看趋势分析"
    >
      <span class="bottom-nav-icon" aria-hidden="true">📈</span>
      <span class="bottom-nav-label">分析</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();
</script>
