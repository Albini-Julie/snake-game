<template>
  <!-- Écran d'accueil -->
  <div
    v-if="state === 'idle'"
    class="absolute inset-0 flex flex-col items-center justify-center bg-game-bg/90 gap-8"
  >
    <p class="font-game text-game-accent text-xl tracking-wider">POULPENTIN</p>

    <!-- Texte clignotant -->
    <p lang="en" class="font-game text-white text-pixel-sm blink">
      PRESS START
    </p>

    <div class="flex gap-4 mt-2">
      <AppButton @click="$emit('start')">Play</AppButton>
      <AppButton variant="secondary" @click="$emit('demo')">Demo AI</AppButton>
    </div>
  </div>

  <!-- Écran Game Over -->
  <div
    v-else-if="state === 'dead'"
    class="absolute inset-0 flex flex-col items-center justify-center bg-game-bg/80 gap-4 px-6"
  >
    <p class="font-game text-red-400 text-lg">GAME OVER</p>
    <p class="text-slate-300 text-sm">
      Score : {{ score }}
      <span v-if="wasDemo" class="text-slate-500 ml-2">(demo AI)</span>
    </p>

    <!-- Conseil IA -->
    <div
      class="w-full max-w-xs text-center min-h-[48px] flex items-center justify-center"
    >
      <p v-if="adviceLoading" class="text-slate-500 italic">
        The sailing coach is thinking...
      </p>
      <p v-else-if="advice" class="text-slate-300 italic leading-relaxed">
        "{{ advice }}"
      </p>
    </div>

    <p v-if="saving" class="text-slate-400 text-pixel-sm">
      Saving the score...
    </p>
    <p v-if="saveError" class="text-red-400 text-pixel-sm">{{ saveError }}</p>
    <p v-if="saved" class="text-green-400 text-pixel-sm">Score saved !</p>

    <div class="flex gap-5 mt-2 flex-wrap justify-center">
      <AppButton @click="$emit('start')">Play again</AppButton>
      <AppButton variant="secondary" @click="$emit('demo')">Demo AI</AppButton>
      <AppButton variant="secondary" @click="$emit('leaderboard')"
        >Leaderboard</AppButton
      >
    </div>
  </div>
</template>

<script setup>
import AppButton from "@/components/ui/AppButton.vue";

defineProps({
  state: { type: String, required: true },
  score: { type: Number, required: true },
  saving: { type: Boolean, default: false },
  saved: { type: Boolean, default: false },
  saveError: { type: String, default: "" },
  advice: { type: String, default: "" },
  adviceLoading: { type: Boolean, default: false },
  wasDemo: { type: Boolean, default: false },
});

defineEmits(["start", "demo", "leaderboard"]);
</script>

<style scoped>
.blink {
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
