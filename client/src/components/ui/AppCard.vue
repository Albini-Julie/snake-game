<template>
  <div :class="['bg-game-surface border rounded-xl p-6', borderClass]">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  borderClass: {
    type: String,
    default: "border-game-border",
  },
});
</script>
