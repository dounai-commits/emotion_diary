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
    <RouterLink
      to="/new"
      class="floating-action"
      aria-label="添加新的情绪日记"
    >
      <span aria-hidden="true">＋</span>
      <span class="floating-action-text">记录新日记</span>
    </RouterLink>
  </div>
</template>

<script setup>
import { RouterLink, RouterView } from 'vue-router';
</script>
