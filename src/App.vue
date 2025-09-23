<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <RouterLink to="/" class="brand-link">
          <h1 class="brand">情绪日记</h1>
        </RouterLink>
        <RouterLink v-if="!isHome" to="/" class="header-back">
          <span aria-hidden="true">←</span>
          <span>返回列表</span>
        </RouterLink>
      </div>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

const route = useRoute();
const isHome = computed(() => route.name === 'home');
</script>
