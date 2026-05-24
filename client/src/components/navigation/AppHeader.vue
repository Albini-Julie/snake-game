<template>
  <nav
    class="relative z-20 bg-game-bg border-b-4 border-game-border px-6 py-3 flex flex-wrap items-center gap-2 md:gap-0 justify-center sm:justify-between shadow-[0_4px_0_#000000]"
  >
    <!-- Logo -->
    <span
      class="font-game text-game-accent text-pixel-xl text-shadow-accent-glow"
    >
      POULPENTIN
    </span>

    <!-- Navigation -->
    <div class="flex flex-wrap items-center justify-center gap-6">
      <RouterLink
        to="/game"
        class="font-game text-pixel-sm md:text-pixel-md text-slate-500 hover:text-game-accent hover:text-shadow-accent-glow transition-colors uppercase"
        active-class="!text-game-accent text-shadow-accent-glow"
      >
        PLAY
      </RouterLink>

      <RouterLink
        to="/leaderboard"
        class="font-game text-pixel-sm md:text-pixel-md text-slate-500 hover:text-game-accent hover:text-shadow-accent-glow transition-colors uppercase"
        active-class="!text-game-accent text-shadow-accent-glow"
      >
        SCORES
      </RouterLink>

      <RouterLink
        to="/avatar"
        class="font-game text-pixel-sm md:text-pixel-md text-slate-500 hover:text-game-accent hover:text-shadow-accent-glow transition-colors uppercase"
        active-class="!text-game-accent text-shadow-accent-glow"
      >
        AVATAR
      </RouterLink>

      <!-- Séparateur -->
      <span aria-hidden="true" class="text-game-border hidden md:block">|</span>

      <!-- Profil cliquable -->
      <RouterLink to="/profile" class="flex items-center gap-2 group">
        <img
          v-if="auth.profile?.avatars?.path"
          :src="auth.profile.avatars.path"
          :alt="auth.profile.username"
          class="w-7 h-7 object-contain group-hover:scale-110 transition-transform"
        />
        <div v-else class="w-7 h-7 bg-game-border" />
        <span
          class="font-game text-pixel-sm text-slate-400 group-hover:text-game-accent group-hover:text-shadow-accent-glow transition-colors hidden sm:block uppercase"
        >
          {{ auth.profile?.username }}
        </span>
      </RouterLink>

      <!-- Déconnexion -->
      <button
        @click="$emit('logout')"
        class="font-game text-pixel-sm md:text-pixel-md text-game-accent hover:text-game-danger transition-colors uppercase"
      >
        EXIT
      </button>
    </div>
  </nav>
</template>

<script setup>
import { useAuthStore } from "@/stores/auth";
const auth = useAuthStore();
defineEmits(["logout"]);
</script>
