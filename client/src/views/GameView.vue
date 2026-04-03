<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8"
  >
    <GameHud
      :score="game.score.value"
      :best-score="game.bestScore.value"
      :level="game.level.value"
    />

    <div
      class="relative border-2 border-game-border rounded-xl overflow-hidden"
      :style="{ width: CANVAS_W + 'px', height: CANVAS_H + 'px' }"
    >
      <canvas
        ref="canvasRef"
        :width="CANVAS_W"
        :height="CANVAS_H"
        class="block"
      />

      <GameOverlay
        :state="game.state.value"
        :score="game.score.value"
        :saving="saving"
        :saved="saved"
        :save-error="saveError"
        @start="startGame"
        @leaderboard="router.push('/leaderboard')"
      />
    </div>

    <!-- Contrôles mobile -->
    <div class="grid grid-cols-3 gap-2 mt-2 sm:hidden">
      <div />
      <AppButton
        variant="secondary"
        @click="emitKey('ArrowUp')"
        class="py-4 text-lg"
        >↑</AppButton
      >
      <div />
      <AppButton
        variant="secondary"
        @click="emitKey('ArrowLeft')"
        class="py-4 text-lg"
        >←</AppButton
      >
      <AppButton
        variant="secondary"
        @click="emitKey('ArrowDown')"
        class="py-4 text-lg"
        >↓</AppButton
      >
      <AppButton
        variant="secondary"
        @click="emitKey('ArrowRight')"
        class="py-4 text-lg"
        >→</AppButton
      >
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { useRouter } from "vue-router";
import { useGame } from "@/composables/useGame";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/api";
import AppButton from "@/components/ui/AppButton.vue";
import GameHud from "@/components/game/GameHud.vue";
import GameOverlay from "@/components/game/GameOverlay.vue";

const CANVAS_W = 400;
const CANVAS_H = 400;

const router = useRouter();
const canvasRef = ref(null);

const saving = ref(false);
const saved = ref(false);
const saveError = ref("");

const auth = useAuthStore();

const AVATAR_COLORS = {
  "Poulpe bleu": 210,
  "Poulpe rouge": 0,
  "Poulpe vert": 140,
  "Poulpe doré": 40,
  "Poulpe violet": 270,
  "Poulpe noir": 300,
};

const avatarColor = computed(
  () => AVATAR_COLORS[auth.profile?.avatars?.name] ?? 240,
);

const game = useGame(canvasRef, avatarColor);

onMounted(() => {
  game.init(canvasRef.value);
  window.addEventListener("keydown", game.handleKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", game.handleKey);
});

async function startGame() {
  saved.value = false;
  saveError.value = "";
  game.start();
}

watch(game.state, async (val) => {
  if (val !== "dead" || game.score.value === 0) return;
  saving.value = true;
  saveError.value = "";
  try {
    await api.post("/scores", {
      score: game.score.value,
      duration: game.getDuration(),
    });
    saved.value = true;
  } catch {
    saveError.value = "Score non sauvegardé.";
  } finally {
    saving.value = false;
  }
});

function emitKey(key) {
  game.handleKey({ key, preventDefault: () => {} });
}
</script>
