<template>
  <div class="min-h-screen flex flex-col">
    <!-- Navbar -->
    <nav
      v-if="auth.isLoggedIn"
      class="bg-game-surface border-b border-game-border px-6 py-3 flex items-center justify-between"
    >
      <span class="font-game text-game-accent text-sm">POULPENTIN</span>
      <div class="flex items-center gap-4">
        <RouterLink to="/game" class="nav-link">Jouer</RouterLink>
        <RouterLink to="/leaderboard" class="nav-link">Scores</RouterLink>
        <RouterLink to="/avatar" class="nav-link">Avatar</RouterLink>
        <button
          @click="handleLogout"
          class="text-slate-400 hover:text-white text-sm transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </nav>

    <!-- Vue active -->
    <main class="flex-1">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
import { useRouter } from "vue-router";
const auth = useAuthStore();
const router = useRouter();

async function handleLogout() {
  await auth.logout();
  router.push("/login");
}
</script>

<style scoped>
.nav-link {
  @apply text-slate-400 hover:text-white text-sm transition-colors;
}
.nav-link.router-link-active {
  @apply text-white font-semibold;
}
</style>
