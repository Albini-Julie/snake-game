<template>
  <div class="min-h-screen px-4 py-12 max-w-2xl mx-auto">
    <div class="text-center mb-10">
      <h1 class="font-game text-game-accent text-xl mb-3">CLASSEMENT</h1>
      <p class="text-slate-400 text-sm">Les meilleurs poulpentins</p>
    </div>

    <div v-if="loading" class="text-center text-slate-400 py-20">
      Chargement...
    </div>

    <div v-else-if="error" class="text-red-400 text-center py-10">
      {{ error }}
    </div>

    <div
      v-else-if="scores.length === 0"
      class="text-center text-slate-500 py-20"
    >
      <p class="mb-2">Aucun score enregistré.</p>
      <RouterLink to="/game" class="text-game-accent text-sm hover:underline">
        Sois le premier à jouer !
      </RouterLink>
    </div>

    <div v-else class="flex flex-col gap-3">
      <!-- Top 3 -->
      <div class="grid grid-cols-3 gap-3 mb-6">
        <div
          v-for="(entry, i) in scores.slice(0, 3)"
          :key="entry.id"
          :class="[
            'bg-game-surface border rounded-xl p-6 flex flex-col items-center gap-3 text-center',
            i === 0
              ? 'border-yellow-400/60'
              : i === 1
                ? 'border-slate-400/60'
                : 'border-amber-600/60',
          ]"
        >
          <span class="text-2xl">{{ MEDALS[i] }}</span>
          <img
            v-if="entry.users?.avatars?.path"
            :src="entry.users.avatars.path"
            :alt="entry.users?.username"
            class="w-12 h-12 object-contain"
            @error="(e) => (e.target.style.display = 'none')"
          />
          <div>
            <p class="font-semibold text-white text-sm truncate max-w-[100px]">
              {{ entry.users?.username ?? "Anonyme" }}
            </p>
            <p
              class="font-game text-lg mt-1"
              :class="i === 0 ? 'text-yellow-400' : 'text-white'"
            >
              {{ entry.value }}
            </p>
            <p class="text-slate-500 text-xs mt-1">
              {{ formatDuration(entry.duration) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Rangs 4-10 -->
      <div
        v-for="(entry, i) in scores.slice(3)"
        :key="entry.id"
        class="bg-game-surface border border-game-border rounded-xl flex items-center gap-4 py-3 px-5"
      >
        <span class="font-game text-slate-500 text-sm w-6">{{ i + 4 }}</span>
        <img
          v-if="entry.users?.avatars?.path"
          :src="entry.users.avatars.path"
          :alt="entry.users?.username"
          class="w-8 h-8 object-contain"
          @error="(e) => (e.target.style.display = 'none')"
        />
        <span class="flex-1 text-white text-sm truncate">
          {{ entry.users?.username ?? "Anonyme" }}
        </span>
        <span class="font-game text-white text-sm">{{ entry.value }}</span>
        <span class="text-slate-500 text-xs w-16 text-right">{{
          formatDuration(entry.duration)
        }}</span>
      </div>

      <!-- Score du joueur hors top 10 -->
      <div v-if="myBestOutside" class="mt-4 border-t border-game-border pt-4">
        <p class="text-slate-500 text-xs text-center mb-3">
          Ton meilleur score
        </p>
        <div
          class="bg-game-surface border border-game-accent/40 rounded-xl flex items-center gap-4 py-3 px-5"
        >
          <span class="font-game text-game-accent text-sm w-6">{{
            myBestOutside.rank
          }}</span>
          <img
            v-if="auth.profile?.avatars?.path"
            :src="auth.profile.avatars.path"
            class="w-8 h-8 object-contain"
          />
          <span class="flex-1 text-white text-sm">{{
            auth.profile?.username ?? "Toi"
          }}</span>
          <span class="font-game text-game-accent text-sm">{{
            myBestOutside.value
          }}</span>
          <span class="text-slate-500 text-xs w-16 text-right">{{
            formatDuration(myBestOutside.duration)
          }}</span>
        </div>
      </div>
    </div>

    <div class="flex justify-center gap-3 mt-10">
      <RouterLink
        to="/game"
        class="px-6 py-3 rounded-lg font-semibold bg-game-accent hover:bg-indigo-500 text-white transition-all text-sm"
      >
        Jouer
      </RouterLink>
      <button
        @click="load"
        class="px-6 py-3 rounded-lg font-semibold bg-game-surface hover:bg-game-border text-white border border-game-border transition-all text-sm"
      >
        Actualiser
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/api";

const MEDALS = ["🥇", "🥈", "🥉"];

const auth = useAuthStore();
const scores = ref([]);
const loading = ref(true);
const error = ref("");
const myScore = ref(null);

const myBestOutside = computed(() => {
  if (!auth.user) return null;
  const inTop = scores.value.some((s) => s.users?.id === auth.user.id);
  if (inTop) return null;
  return myScore.value;
});

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const [lbRes, myRes] = await Promise.all([
      api.get("/scores/leaderboard"),
      api.get("/scores/me"),
    ]);
    scores.value = lbRes.data;
    if (myRes.data.length > 0) {
      const best = myRes.data[0];
      const rank = scores.value.filter((s) => s.value > best.value).length + 1;
      myScore.value = { ...best, rank };
    }
  } catch {
    error.value = "Impossible de charger le classement.";
  } finally {
    loading.value = false;
  }
}

function formatDuration(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m${s.toString().padStart(2, "0")}s` : `${s}s`;
}

onMounted(load);
</script>
