<template>
  <Teleport to="body">
    <transition name="action-sheet-fade">
      <div v-if="props.open" class="action-sheet-overlay" @click.self="handleClose">
        <div class="action-sheet-panel">
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

function handleClose() {
  emit('close');
}
</script>
