<template>
  <div class="min-h-screen px-4 py-10 max-w-xl mx-auto">
    <!-- Titre -->
    <div class="text-center mb-8">
      <p class="font-game text-slate-600 mb-2 text-pixel-sm">— POULPENTIN —</p>
      <h1
        class="font-game text-game-accent text-pixel-xl"
        style="text-shadow: 0 0 20px rgba(99, 102, 241, 0.8)"
      >
        PROFILE
      </h1>
    </div>

    <!-- Chargement -->
    <div v-if="loading" class="text-center py-20">
      <p class="font-game text-game-accent blink text-pixel-sm">LOADING...</p>
    </div>

    <div v-else class="flex flex-col gap-6">
      <!-- Carte identité -->
      <AppCard>
        <div class="flex items-center gap-6">
          <img
            v-if="auth.profile?.avatars?.path"
            :src="auth.profile.avatars.path"
            :alt="auth.profile.username"
            class="w-20 h-20 object-contain"
          />
          <div v-else class="w-20 h-20 bg-game-border" />

          <div class="flex flex-col gap-2">
            <p class="font-game text-white text-pixel-sm">
              {{ auth.profile?.username }}
            </p>
            <p class="font-game text-slate-500 text-pixel-sm">
              {{ auth.profile?.email }}
            </p>
            <p class="font-game text-slate-600 text-pixel-sm">
              Registered at {{ formatDate(auth.profile?.registration_date) }}
            </p>
          </div>
        </div>

        <div class="mt-4 flex justify-end">
          <AppButton variant="secondary" @click="router.push('/avatar')">
            Avatar change
          </AppButton>
        </div>
      </AppCard>

      <!-- Stats -->
      <div class="shadow-pixel-card bg-game-surface/60">
        <div class="px-4 py-2 border-b-2 border-game-accent/40 bg-game-bg/60">
          <p class="font-game text-game-accent text-pixel-sm">STATISTICS</p>
        </div>

        <div class="grid grid-cols-2 gap-px bg-game-border/20">
          <div class="bg-game-surface/80 p-4 flex flex-col items-center gap-2">
            <p class="font-game text-slate-500 uppercase text-pixel-sm">
              Games played
            </p>
            <p class="font-game text-white text-2xl">{{ stats.played }}</p>
          </div>

          <div class="bg-game-surface/80 p-4 flex flex-col items-center gap-2">
            <p class="font-game text-slate-500 uppercase text-pixel-sm">
              Best score
            </p>
            <p class="font-game text-game-accent text-2xl">{{ stats.best }}</p>
          </div>

          <div class="bg-game-surface/80 p-4 flex flex-col items-center gap-2">
            <p class="font-game text-slate-500 uppercase text-pixel-sm">
              Average score
            </p>
            <p class="font-game text-green-400 text-2xl">{{ stats.average }}</p>
          </div>

          <div class="bg-game-surface/80 p-4 flex flex-col items-center gap-2">
            <p class="font-game text-slate-500 uppercase text-pixel-sm">
              Total time
            </p>
            <p class="font-game text-cyan-400 text-2xl">
              {{ formatTotalDuration(stats.totalDuration) }}
            </p>
          </div>
        </div>

        <div v-if="stats.played === 0" class="text-center py-6">
          <p class="font-game text-slate-600 text-pixel-sm">NO GAMES YET</p>
        </div>
      </div>

      <!-- Historique -->
      <div class="shadow-pixel-card bg-game-surface/60">
        <div class="px-4 py-2 border-b-2 border-game-accent/40 bg-game-bg/60">
          <p class="font-game text-game-accent text-pixel-sm">HISTORY</p>
        </div>

        <div v-if="history.length === 0" class="text-center py-6">
          <p class="font-game text-slate-600 text-pixel-sm">NO GAMES YET</p>
        </div>

        <div
          v-for="(entry, i) in history.slice(0, 10)"
          :key="entry.id"
          class="flex items-center gap-4 px-4 py-3 border-b border-game-border/30"
        >
          <span class="font-game text-slate-600 w-6 shrink-0 text-pixel-sm">
            {{ String(i + 1).padStart(2, "0") }}
          </span>
          <p class="font-game text-white text-lg w-12">{{ entry.value }}</p>
          <span class="flex-1 font-game text-slate-500 text-pixel-sm">
            {{ formatDate(entry.registration_date) }}
          </span>
          <span class="font-game text-slate-600 text-pixel-sm">
            {{ entry.duration ? entry.duration + "s" : "--" }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/api";
import AppCard from "@/components/ui/AppCard.vue";
import AppButton from "@/components/ui/AppButton.vue";

const auth = useAuthStore();
const router = useRouter();
const loading = ref(true);

const stats = ref({ played: 0, best: 0, average: 0, totalDuration: 0 });
const history = ref([]);

onMounted(async () => {
  try {
    const [statsRes, historyRes] = await Promise.all([
      api.get("/scores/stats"),
      api.get("/scores/me"),
    ]);
    stats.value = statsRes.data;
    history.value = historyRes.data;
  } catch {
    // silencieux
  } finally {
    loading.value = false;
  }
});

function formatDate(dateStr) {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTotalDuration(seconds) {
  if (!seconds) return "0s";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h${String(m).padStart(2, "0")}`;
  if (m > 0) return `${m}m${String(s).padStart(2, "0")}`;
  return `${s}s`;
}
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
