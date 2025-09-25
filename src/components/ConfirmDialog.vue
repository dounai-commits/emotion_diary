<template>
  <transition name="dialog-fade">
    <div v-if="open" class="dialog-backdrop" role="dialog" aria-modal="true">
      <div class="dialog-panel">
        <header class="dialog-header">
          <h3>{{ title }}</h3>
        </header>
        <p class="dialog-message">{{ message }}</p>
        <footer class="dialog-actions">
          <button type="button" class="dialog-button ghost" @click="$emit('cancel')">
            {{ cancelText }}
          </button>
          <button type="button" class="dialog-button danger" @click="$emit('confirm')">
            {{ confirmText }}
          </button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup>
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Are you sure?',
  },
  message: {
    type: String,
    default: '',
  },
  confirmText: {
    type: String,
    default: 'Confirm',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
});
</script>
