<template>
  <div class="app-shell">
    <RouterView />
    <BottomNav v-if="route.meta.showBottomNav" />
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router';
import BottomNav from './components/BottomNav.vue';

const route = useRoute();
</script>
