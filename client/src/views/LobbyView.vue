<template>
  <div
    class="min-h-screen flex flex-col items-center justify-start md:justify-center gap-8 px-4 mt-10 md:mt-0"
  >
    <!-- Titre -->
    <div class="text-center">
      <p class="font-game text-slate-600 mb-2 text-pixel-sm">
        <span aria-hidden="true">—</span> POULPENTIN
        <span aria-hidden="true">—</span>
      </p>
      <h1
        class="font-game text-game-accent text-pixel-xl text-shadow-accent-glow"
      >
        PLAY
      </h1>
    </div>

    <!-- Choix du mode -->
    <div class="flex flex-col gap-4 w-full max-w-xs">
      <div class="shadow-pixel-card bg-game-surface/60 p-6 flex flex-col gap-6">
        <p class="font-game text-game-accent text-pixel-sm text-center">
          SELECT MODE
        </p>

        <!-- Solo -->
        <button
          @click="router.push('/game')"
          class="group flex flex-col items-center gap-3 p-4 border-2 border-game-border hover:border-game-accent bg-game-bg transition-all duration-75 hover:-translate-y-0.5"
        >
          <AppIcon name="octopus" size="lg" />
          <p
            class="font-game text-white text-pixel-sm group-hover:text-game-accent group-hover:text-shadow-accent-glow transition-colors"
          >
            1 PLAYER
          </p>
          <p class="font-game text-slate-600 text-pixel-sm uppercase">
            single-player mode
          </p>
        </button>

        <!-- Multijoueur -->
        <button
          @click="router.push('/multiplayer')"
          class="group flex flex-col items-center gap-3 p-4 border-2 border-game-border hover:border-game-accent bg-game-bg transition-all duration-75 hover:-translate-y-0.5"
        >
          <AppIcon name="sword" size="md" />
          <p
            class="font-game text-white text-pixel-sm group-hover:text-game-accent group-hover:text-shadow-accent-glow transition-colors"
          >
            2 PLAYERS
          </p>
          <p class="font-game text-slate-600 text-pixel-sm uppercase">
            multiplayer mode
          </p>
        </button>
      </div>

      <!-- Stats rapides -->
      <div
        v-if="stats"
        class="shadow-pixel-card bg-game-surface/60 p-4 flex justify-around"
      >
        <div class="flex flex-col items-center gap-1">
          <p class="font-game text-slate-500 text-pixel-sm uppercase">Games</p>
          <p class="font-game text-white text-2xl">{{ stats.played }}</p>
        </div>
        <div class="w-px bg-game-border" />
        <div class="flex flex-col items-center gap-1">
          <p class="font-game text-slate-500 text-pixel-sm uppercase">Best</p>
          <p class="font-game text-game-accent text-2xl">{{ stats.best }}</p>
        </div>
        <div class="w-px bg-game-border" />
        <div class="flex flex-col items-center gap-1">
          <p class="font-game text-slate-500 text-pixel-sm uppercase">Avg</p>
          <p class="font-game text-green-400 text-2xl">{{ stats.average }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { getMyStats } from "@/api/scores";
import AppIcon from "@/components/ui/AppIcon.vue";

const router = useRouter();
const stats = ref(null);

onMounted(async () => {
  try {
    const { data } = await getMyStats();
    stats.value = data;
  } catch {
    // silencieux — les stats sont optionnelles sur cette page
  }
});
</script>
