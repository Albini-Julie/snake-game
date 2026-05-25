<template>
  <div
    :class="[
      'flex flex-col items-center gap-2 p-3 border-2 transition-all',
      unlocked
        ? [
            colorMap[color].border,
            colorMap[color].bg,
            'shadow-[0_0_10px_rgba(0,0,0,0.3)]',
          ]
        : 'border-game-border bg-game-bg opacity-40 grayscale',
    ]"
  >
    <div
      class="w-6 h-6 flex items-center justify-center border-2"
      :class="
        unlocked
          ? [colorMap[color].border, colorMap[color].text]
          : 'border-game-border text-white'
      "
    >
      <span class="font-game text-pixel-sm">{{ unlocked ? "★" : "?" }}</span>
    </div>

    <p
      class="font-game text-center leading-tight text-pixel-sm"
      :class="unlocked ? colorMap[color].text : 'text-white'"
    >
      {{ name }}
    </p>

    <p class="font-game text-white text-center leading-tight text-pixel-sm">
      {{ description }}
    </p>

    <p v-if="unlocked && unlockedAt" class="font-game text-white text-pixel-sm">
      {{ formatDate(unlockedAt) }}
    </p>
  </div>
</template>

<script setup>
const props = defineProps({
  name: { type: String, required: true },
  description: { type: String, required: true },
  color: { type: String, default: "indigo" },
  unlocked: { type: Boolean, default: false },
  unlockedAt: { type: String, default: null },
});

// Map couleur → classe Tailwind
const colorMap = {
  indigo: {
    border: "border-indigo-400",
    text: "text-indigo-400",
    bg: "bg-indigo-400/5",
  },
  cyan: {
    border: "border-cyan-400",
    text: "text-cyan-400",
    bg: "bg-cyan-400/5",
  },
  green: {
    border: "border-green-400",
    text: "text-green-400",
    bg: "bg-green-400/5",
  },
  blue: {
    border: "border-blue-400",
    text: "text-blue-400",
    bg: "bg-blue-400/5",
  },
  yellow: {
    border: "border-yellow-400",
    text: "text-yellow-400",
    bg: "bg-yellow-400/5",
  },
  orange: {
    border: "border-orange-400",
    text: "text-orange-400",
    bg: "bg-orange-400/5",
  },
  red: { border: "border-red-400", text: "text-red-400", bg: "bg-red-400/5" },
  purple: {
    border: "border-purple-400",
    text: "text-purple-400",
    bg: "bg-purple-400/5",
  },
};

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr)
    .toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    .toUpperCase();
}
</script>
