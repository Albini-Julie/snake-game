<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8"
  >
    <GameHud
      :score="game.score.value"
      :best-score="game.bestScore.value"
      :level="game.level.value"
    />

    <div class="flex flex-col md:flex-row items-center gap-10">
      <div
        class="relative border-2 border-game-border overflow-hidden"
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

      <div v-if="!game.isDemo.value" class="grid grid-cols-3 gap-2 mt-2">
        <div />
        <AppButton variant="secondary" @click="emitKey('ArrowUp')">▲</AppButton>
        <div />
        <AppButton variant="secondary" @click="emitKey('ArrowLeft')"
          >◄</AppButton
        >
        <AppButton variant="secondary" @click="emitKey('ArrowDown')"
          >▼</AppButton
        >
        <AppButton variant="secondary" @click="emitKey('ArrowRight')"
          >►</AppButton
        >
      </div>
    </div>
    <p
      v-if="game.isDemo.value && game.state.value === 'playing'"
      class="font-game text-slate-600 text-center text-pixel-sm uppercase"
    >
      IA controls the octopus
    </p>

    <AchievementNotification
      :slugs="game.justUnlocked.value"
      :all-achievements="allAchievements"
    />

    <WorldRecordNotification
      :is-world-record="game.worldRecordBeaten.value"
      :score="game.score.value"
    />
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useGame } from "@/composables/useGame";
import { saveScore, getWorldRecordReplay } from "@/api/scores";
import { getGameAdvice } from "@/api/ai";
import { getAllAchievements, getMyAchievements } from "@/api/achievements";
import AppButton from "@/components/ui/AppButton.vue";
import GameHud from "@/components/game/GameHud.vue";
import GameOverlay from "@/components/game/GameOverlay.vue";
import AchievementNotification from "@/components/ui/AchievementNotification.vue";
import WorldRecordNotification from "@/components/ui/WorldRecordNotification.vue";

const CANVAS_W = window.innerWidth < 640 ? 320 : 400;
const CANVAS_H = window.innerWidth < 640 ? 320 : 400;

const router = useRouter();
const auth = useAuthStore();
const canvasRef = ref(null);

const AVATAR_COLORS = {
  "Blue Octopus": 210,
  "Red Octopus": 0,
  "Green Octopus": 140,
  "Gold Octopus": 40,
  "Purple Octopus": 270,
  "Dark Octopus": 300,
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
const allAchievements = ref([]);

onMounted(async () => {
  game.init(canvasRef.value);
  window.addEventListener("keydown", game.handleKey);
  try {
    const [allRes, myRes, replayRes] = await Promise.all([
      getAllAchievements(),
      getMyAchievements(),
      getWorldRecordReplay().catch(() => ({ data: null })),
    ]);
    allAchievements.value = allRes.data;
    const alreadyUnlocked = myRes.data
      .map((a) => a.achievements?.slug)
      .filter(Boolean);
    game.preloadUnlocked(alreadyUnlocked);
    game.setWorldRecord(replayRes.data?.value ?? 0);
  } catch {
    /* silencieux */
  }
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

watch(
  () => game.state.value,
  async (val) => {
    if (val !== "dead" || game.score.value === 0) return;
    if (game.isDemo.value) return;

    saving.value = true;
    adviceLoading.value = true;
    saveError.value = "";

    // Récupère les données de replay avant de sauvegarder
    const { seed, inputs } = game.getReplayData();

    const [scoreResult, adviceResult] = await Promise.allSettled([
      saveScore({
        score: game.score.value,
        duration: game.getDuration(),
        level: game.level.value,
        seed,
        inputs,
      }),
      getGameAdvice({
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
  },
);

function emitKey(key) {
  game.handleKey({ key, preventDefault: () => {} });
}
</script>
