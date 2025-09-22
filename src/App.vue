<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="brand">情绪日记</h1>
        <nav class="nav-links">
          <RouterLink to="/" class="nav-link">日记列表</RouterLink>
          <RouterLink to="/new" class="nav-link primary">新建日记</RouterLink>
        </nav>
      </div>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>
