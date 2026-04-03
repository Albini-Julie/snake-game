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
        :advice="advice"
        :advice-loading="adviceLoading"
        :was-demo="game.isDemo.value"
        @start="startGame"
        @demo="startDemo"
        @leaderboard="router.push('/leaderboard')"
      />
    </div>

    <!-- Contrôles mobile (masqués en mode démo) -->
    <div
      v-if="!game.isDemo.value"
      class="grid grid-cols-3 gap-2 mt-2 sm:hidden"
    >
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

    <!-- Info mode démo -->
    <p
      v-if="game.isDemo.value && game.state.value === 'playing'"
      class="text-slate-500 text-xs"
    >
      L'IA contrôle le poulpe — appuie sur une flèche pour reprendre la main
    </p>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useGame } from "@/composables/useGame";
import api from "@/lib/api";
import AppButton from "@/components/ui/AppButton.vue";
import GameHud from "@/components/game/GameHud.vue";
import GameOverlay from "@/components/game/GameOverlay.vue";

const CANVAS_W = 400;
const CANVAS_H = 400;

const router = useRouter();
const auth = useAuthStore();
const canvasRef = ref(null);

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

const saving = ref(false);
const saved = ref(false);
const saveError = ref("");
const advice = ref("");
const adviceLoading = ref(false);

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
  advice.value = "";
  adviceLoading.value = false;
  game.start(false);
}

async function startDemo() {
  saved.value = false;
  saveError.value = "";
  advice.value = "";
  adviceLoading.value = false;
  game.start(true);
}

watch(game.state, async (val) => {
  if (val !== "dead" || game.score.value === 0) return;

  // En mode démo, pas de sauvegarde du score
  if (game.isDemo.value) return;

  saving.value = true;
  adviceLoading.value = true;
  saveError.value = "";

  const [scoreResult, adviceResult] = await Promise.allSettled([
    api.post("/scores", {
      score: game.score.value,
      duration: game.getDuration(),
    }),
    api.post("/ai/advice", {
      score: game.score.value,
      duration: game.getDuration(),
      level: game.level.value,
    }),
  ]);

  if (scoreResult.status === "fulfilled") {
    saved.value = true;
  } else {
    saveError.value = "Score non sauvegardé.";
  }
  saving.value = false;

  if (adviceResult.status === "fulfilled") {
    advice.value = adviceResult.value.data.advice;
  }
  adviceLoading.value = false;
});

function emitKey(key) {
  game.handleKey({ key, preventDefault: () => {} });
}
</script>
