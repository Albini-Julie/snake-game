<template>
  <div class="min-h-screen px-4 py-10 max-w-2xl mx-auto">
    <!-- Titre -->
    <div class="text-center mb-8">
      <p class="font-game text-slate-600 mb-2 text-pixel-sm">
        <span aria-hidden="true">—</span> POULPENTIN
        <span aria-hidden="true">—</span>
      </p>
      <h1
        class="text-shadow-accent-glow font-game text-game-accent text-pixel-xl"
      >
        HIGH SCORES
      </h1>
    </div>

    <!-- Chargement -->
    <div v-if="loading" class="text-center py-20">
      <p class="font-game text-game-accent blink text-pixel-sm">LOADING...</p>
    </div>

    <!-- Erreur -->
    <div v-else-if="error" class="text-center py-10">
      <p class="font-game text-game-danger text-pixel-sm">
        {{ error }}
      </p>
    </div>

    <!-- Vide -->
    <div v-else-if="scores.length === 0" class="text-center py-20">
      <p class="font-game text-slate-500 mb-6 text-pixel-sm">NO SCORES YET</p>
      <AppButton @click="router.push('/game')">Play</AppButton>
    </div>

    <!-- Tableau -->
    <div v-else class="flex flex-col gap-6">
      <!-- Tableau arcade -->
      <div class="shadow-pixel-card bg-game-surface/60">
        <!-- Header -->
        <div
          class="flex items-center gap-4 px-4 py-2 border-b-2 border-game-accent/40 bg-game-bg/60"
        >
          <span
            class="font-game text-game-accent w-8 text-center shrink-0 text-pixel-sm uppercase"
            >RK</span
          >
          <span class="w-7 shrink-0" />
          <span
            class="font-game text-game-accent flex-1 text-pixel-sm uppercase"
            >PLAYER</span
          >
          <span class="font-game text-game-accent text-pixel-sm uppercase"
            >SCORE</span
          >
          <span
            class="font-game text-game-accent w-12 text-right shrink-0 text-pixel-sm uppercase"
            >TIME</span
          >
        </div>

        <!-- Top 3 -->
        <LeaderboardTop3
          v-if="scores.length >= 3"
          :entries="scores.slice(0, 3)"
        />

        <!-- Rangs 4-10 -->
        <LeaderboardRow
          v-for="(entry, i) in scores.slice(3)"
          :key="entry.id"
          :rank="i + 4"
          :username="entry.users?.username"
          :avatar-path="entry.users?.avatars?.path"
          :score="entry.value"
          :duration="entry.duration"
        />

        <!-- Score du joueur hors top 10 -->
        <div v-if="myBestOutside" class="border-t-2 border-game-accent/40 mt-1">
          <div class="px-4 py-1">
            <p class="font-game text-game-accent text-center text-pixel-sm">
              <span aria-hidden="true">—</span> YOUR BEST
              <span aria-hidden="true">—</span>
            </p>
          </div>
          <LeaderboardRow
            :rank="myBestOutside.rank"
            :username="auth.profile?.username"
            :avatar-path="auth.profile?.avatars?.path"
            :score="myBestOutside.value"
            :duration="myBestOutside.duration"
            :highlighted="true"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-center gap-4">
        <AppButton @click="router.push('/game')">Play</AppButton>
        <AppButton variant="secondary" @click="load">Refresh</AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/api";
import AppButton from "@/components/ui/AppButton.vue";
import LeaderboardTop3 from "@/components/leaderboard/LeaderboardTop3.vue";
import LeaderboardRow from "@/components/leaderboard/LeaderboardRow.vue";

const auth = useAuthStore();
const router = useRouter();
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
    error.value = "LOADING ERROR";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
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
