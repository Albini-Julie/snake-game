<template>
  <div
    class="relative bg-game-surface p-6 shadow-pixel-card"
    :class="borderClass"
  >
    <!-- Inner border subtil -->
    <div
      class="absolute inset-1 border border-game-accent/10 pointer-events-none"
    />
    <slot />
  </div>
</template>

<script setup>
defineProps({
  borderClass: {
    type: String,
    default: "",
  },
});
</script>
