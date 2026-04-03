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
      <LeaderboardTop3 :entries="scores.slice(0, 3)" />

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
      <div v-if="myBestOutside" class="mt-4 border-t border-game-border pt-4">
        <p class="text-slate-500 text-xs text-center mb-3">
          Ton meilleur score
        </p>
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

    <div class="flex justify-center gap-3 mt-10">
      <AppButton @click="router.push('/game')">Jouer</AppButton>
      <AppButton variant="secondary" @click="load">Actualiser</AppButton>
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
    error.value = "Impossible de charger le classement.";
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
