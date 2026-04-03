<template>
  <div class="min-h-screen flex flex-col">
    <nav
      v-if="auth.isLoggedIn"
      class="bg-game-surface border-b border-game-border px-6 py-3 flex items-center justify-between"
    >
      <span class="font-game text-game-accent text-sm">POULPENTIN</span>
      <div class="flex items-center gap-4">
        <RouterLink
          to="/game"
          class="text-slate-400 hover:text-white text-sm transition-colors"
          active-class="text-white font-semibold"
        >
          Jouer
        </RouterLink>
        <RouterLink
          to="/leaderboard"
          class="text-slate-400 hover:text-white text-sm transition-colors"
          active-class="text-white font-semibold"
        >
          Scores
        </RouterLink>
        <RouterLink
          to="/avatar"
          class="text-slate-400 hover:text-white text-sm transition-colors"
          active-class="text-white font-semibold"
        >
          Avatar
        </RouterLink>
        <button
          @click="handleLogout"
          class="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </nav>

    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();
const router = useRouter();

async function handleLogout() {
  await auth.logout();
  router.push("/login");
}
</script>
