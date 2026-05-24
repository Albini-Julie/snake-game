<template>
  <div class="flex flex-col items-center gap-3">
    <!-- Scores -->
    <div class="flex items-center gap-8">
      <div class="text-center">
        <p class="text-slate-500 text-pixel-md mb-1 uppercase">SCORE</p>
        <p class="font-game text-white text-2xl">{{ score }}</p>
      </div>
      <div class="text-center">
        <p class="text-slate-500 text-pixel-md mb-1 uppercase">BEST</p>
        <p class="font-game text-game-accent text-2xl">{{ bestScore }}</p>
      </div>
      <div class="text-center">
        <p class="text-slate-500 text-pixel-md mb-1 uppercase">LEVEL</p>
        <p class="font-game text-white text-2xl">{{ level }}</p>
      </div>
    </div>

    <!-- Barre de progression vers le niveau suivant -->
    <div class="flex items-center gap-3 w-full max-w-xs">
      <p class="font-game text-slate-600 shrink-0 text-pixel-sm uppercase">
        LVL {{ level }}
      </p>

      <div
        class="flex-1 h-2 bg-game-bg shadow-pixel-input relative overflow-hidden"
      >
        <!-- 5 segments pixel -->
        <div class="flex h-full gap-px">
          <div
            v-for="i in 5"
            :key="i"
            :class="[
              'flex-1 transition-all duration-150',
              i <= progressSegments ? levelColor : 'bg-game-border/30',
            ]"
          />
        </div>
        <!-- Flash de brillance au nouveau fruit -->
        <div
          v-if="progressSegments > 0"
          class="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent shimmer"
          :style="{ transform: `translateX(${shimmerX}%)` }"
        />
      </div>

      <p class="font-game text-slate-600 shrink-0 text-pixel-sm">
        {{ level < 5 ? `LVL ${level + 1}` : "MAX" }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  score: { type: Number, required: true },
  bestScore: { type: Number, required: true },
  level: { type: Number, required: true },
});

// Progression dans le niveau actuel (0-5 fruits sur 5)
const progressSegments = computed(() => {
  if (props.level >= 5) return 5;
  return props.score % 5;
});

// Couleur selon le niveau
const levelColor = computed(
  () =>
    ({
      1: "bg-green-500",
      2: "bg-cyan-500",
      3: "bg-yellow-500",
      4: "bg-orange-500",
      5: "bg-red-500",
    })[props.level] ?? "bg-game-accent",
);

// Flash qui traverse la barre à chaque nouveau fruit
const shimmerX = ref(-100);
watch(
  () => props.score,
  () => {
    shimmerX.value = -100;
    setTimeout(() => {
      shimmerX.value = 100;
    }, 10);
  },
);
</script>

<style scoped>
.shimmer {
  transition: transform 0.4s ease;
}
</style>
