<template>
  <div class="flex items-center gap-8">
    <div class="text-center">
      <p class="text-slate-500 text-xs mb-1">SCORE</p>
      <p class="font-game text-white text-2xl">{{ score }}</p>
    </div>
    <div class="text-center">
      <p class="text-slate-500 text-xs mb-1">MEILLEUR</p>
      <p class="font-game text-game-accent text-2xl">{{ bestScore }}</p>
    </div>
    <div class="text-center">
      <p class="text-slate-500 text-xs mb-1">NIVEAU</p>
      <p class="font-game text-white text-2xl">{{ level }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  score: { type: Number, required: true },
  bestScore: { type: Number, required: true },
  level: { type: Number, required: true },
});
</script>
