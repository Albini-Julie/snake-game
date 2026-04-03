<template>
  <!-- Écran d'accueil -->
  <div
    v-if="state === 'idle'"
    class="absolute inset-0 flex flex-col items-center justify-center bg-game-bg/90 gap-6"
  >
    <p class="font-game text-game-accent text-lg">POULPENTIN</p>
    <p class="text-slate-400 text-sm">
      Utilise les flèches pour diriger le poulpe
    </p>
    <AppButton @click="$emit('start')">Démarrer</AppButton>
  </div>

  <!-- Écran Game Over -->
  <div
    v-else-if="state === 'dead'"
    class="absolute inset-0 flex flex-col items-center justify-center bg-game-bg/80 gap-4 px-6"
  >
    <p class="font-game text-red-400 text-lg">GAME OVER</p>
    <p class="text-slate-300 text-sm">Score : {{ score }}</p>

    <!-- Conseil IA -->
    <div
      class="w-full max-w-xs text-center min-h-[48px] flex items-center justify-center"
    >
      <p v-if="adviceLoading" class="text-slate-500 text-lg italic">
        Le coach marin réfléchit...
      </p>
      <p
        v-else-if="advice"
        class="text-slate-300 text-lg italic leading-relaxed"
      >
        "{{ advice }}"
      </p>
    </div>

    <p v-if="saving" class="text-slate-400 text-xs">Sauvegarde du score...</p>
    <p v-if="saveError" class="text-red-400 text-xs">{{ saveError }}</p>
    <p v-if="saved" class="text-green-400 text-xs">Score sauvegardé !</p>

    <div class="flex gap-3 mt-2">
      <AppButton @click="$emit('start')">Rejouer</AppButton>
      <AppButton variant="secondary" @click="$emit('leaderboard')"
        >Classement</AppButton
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
});

defineEmits(["start", "leaderboard"]);
</script>
