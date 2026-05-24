<template>
  <nav
    class="relative z-20 bg-game-surface/80 backdrop-blur border-b border-game-border px-6 py-3 flex items-center justify-between shadow-[0_4px_0_#000000]"
  >
    <!-- Logo -->
    <span class="font-game text-game-accent text-sm">POULPENTIN</span>

    <!-- Navigation -->
    <div class="flex items-center gap-4">
      <RouterLink to="/profile" class="flex items-center gap-2 group">
        <div class="flex items-center gap-2 mr-2">
          <img
            v-if="auth.profile?.avatars?.path"
            :src="auth.profile.avatars.path"
            :alt="auth.profile.username"
            class="w-8 h-8 object-contain rounded-full border border-game-border"
          />
          <span class="text-slate-300 text-sm hidden sm:block">
            {{ auth.profile?.username }}
          </span>
        </div>
      </RouterLink>
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

      <!-- Profil + déconnexion -->
      <button
        @click="$emit('logout')"
        class="text-slate-400 hover:text-white text-sm transition-colors"
      >
        Déconnexion
      </button>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

defineEmits(["logout"]);
</script>
