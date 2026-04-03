<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      'px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed text-[13px]',
      variants[variant],
    ]"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: "primary",
    validator: (v) => ["primary", "secondary"].includes(v),
  },
  type: {
    type: String,
    default: "button",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const variants = {
  primary: "bg-game-accent hover:bg-indigo-500 text-white",
  secondary:
    "bg-game-surface hover:bg-game-border text-white border border-game-border",
};
</script>
