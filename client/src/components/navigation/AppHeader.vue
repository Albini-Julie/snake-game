<template>
  <nav
    class="relative z-20 bg-game-bg border-b-4 border-game-border px-6 py-3 flex flex-wrap items-center gap-2 md:gap-0 justify-center sm:justify-between shadow-[0_4px_0_#000000]"
  >
    <!-- Logo -->
    <span
      class="font-game text-game-accent text-pixel-xl"
      style="text-shadow: 0 0 15px rgba(99, 102, 241, 0.7)"
    >
      POULPENTIN
    </span>

    <!-- Navigation -->
    <div class="flex flex-wrap items-center justify-center gap-6 row-0">
      <!-- Liens nav -->
      <RouterLink
        to="/game"
        class="font-game text-pixel-sm md:text-pixel-md text-slate-500 hover:text-white transition-colors relative group uppercase"
        active-class="!text-white"
      >
        PLAY
        <span
          class="absolute -bottom-1 left-0 w-0 h-px bg-game-accent group-hover:w-full transition-all duration-200"
        />
      </RouterLink>

      <RouterLink
        to="/leaderboard"
        class="font-game text-pixel-sm md:text-pixel-md text-slate-500 hover:text-white transition-colors relative group uppercase"
        active-class="!text-white"
      >
        SCORES
        <span
          class="absolute -bottom-1 left-0 w-0 h-px bg-game-accent group-hover:w-full transition-all duration-200"
        />
      </RouterLink>

      <RouterLink
        to="/avatar"
        class="font-game text-pixel-sm md:text-pixel-md text-slate-500 hover:text-white transition-colors relative group uppercase"
        active-class="!text-white"
      >
        AVATAR
        <span
          class="absolute -bottom-1 left-0 w-0 h-px bg-game-accent group-hover:w-full transition-all duration-200"
        />
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
          class="font-game text-pixel-sm md:text-pixel-md text-slate-400 group-hover:text-white transition-colors hidden sm:block uppercase"
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
