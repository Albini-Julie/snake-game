<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8"
  >
    <!-- HUD -->
    <div class="flex items-center gap-8">
      <div class="text-center">
        <p class="text-slate-500 text-xs mb-1">SCORE</p>
        <p class="font-game text-white text-2xl">{{ game.score.value }}</p>
      </div>
      <div class="text-center">
        <p class="text-slate-500 text-xs mb-1">MEILLEUR</p>
        <p class="font-game text-game-accent text-2xl">
          {{ game.bestScore.value }}
        </p>
      </div>
      <div class="text-center">
        <p class="text-slate-500 text-xs mb-1">NIVEAU</p>
        <p class="font-game text-white text-2xl">{{ game.level.value }}</p>
      </div>
    </div>

    <!-- Canvas -->
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

      <!-- Écran d'accueil -->
      <div
        v-if="game.state.value === 'idle'"
        class="absolute inset-0 flex flex-col items-center justify-center bg-game-bg/90 gap-6"
      >
        <p class="font-game text-game-accent text-lg">POULPENTIN</p>
        <p class="text-slate-400 text-sm">
          Utilise les flèches pour diriger le poulpe
        </p>
        <button @click="startGame" class="btn-primary text-sm">Démarrer</button>
      </div>

      <!-- Écran Game Over -->
      <div
        v-if="game.state.value === 'dead'"
        class="absolute inset-0 flex flex-col items-center justify-center bg-game-bg/80 gap-5"
      >
        <p class="font-game text-red-400 text-lg">GAME OVER</p>
        <p class="text-slate-300 text-sm">Score : {{ game.score.value }}</p>

        <p v-if="saving" class="text-slate-400 text-xs">
          Sauvegarde du score...
        </p>
        <p v-if="saveError" class="text-red-400 text-xs">{{ saveError }}</p>
        <p v-if="saved" class="text-green-400 text-xs">Score sauvegardé !</p>

        <div class="flex gap-3 mt-2">
          <button @click="startGame" class="btn-primary text-sm">
            Rejouer
          </button>
          <RouterLink to="/leaderboard" class="btn-secondary text-sm"
            >Classement</RouterLink
          >
        </div>
      </div>
    </div>

    <!-- Contrôles mobile -->
    <div class="grid grid-cols-3 gap-2 mt-2 sm:hidden">
      <div />
      <button @click="emitKey('ArrowUp')" class="btn-secondary py-4 text-lg">
        ↑
      </button>
      <div />
      <button @click="emitKey('ArrowLeft')" class="btn-secondary py-4 text-lg">
        ←
      </button>
      <button @click="emitKey('ArrowDown')" class="btn-secondary py-4 text-lg">
        ↓
      </button>
      <button @click="emitKey('ArrowRight')" class="btn-secondary py-4 text-lg">
        →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useGame } from "@/composables/useGame";
import api from "@/lib/api";

const CANVAS_W = 400;
const CANVAS_H = 400;

const canvasRef = ref(null);
const game = useGame(canvasRef);

const saving = ref(false);
const saved = ref(false);
const saveError = ref("");

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

// Surveille la fin de partie pour sauvegarder le score
import { watch } from "vue";
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
  } catch (e) {
    saveError.value = "Score non sauvegardé.";
  } finally {
    saving.value = false;
  }
});

// Contrôles mobiles
function emitKey(key) {
  game.handleKey({ key, preventDefault: () => {} });
}
</script>
