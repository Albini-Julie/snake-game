<template>
  <div class="min-h-screen flex flex-col relative overflow-hidden">
    <!-- Fond étoilé -->
    <div class="stars-container absolute inset-0 pointer-events-none">
      <span
        v-for="star in stars"
        :key="star.id"
        class="star"
        :style="star.style"
      />
    </div>

    <!-- Header -->
    <AppHeader @logout="handleLogout" />

    <main class="flex-1 relative z-10">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppHeader from "@/components/navigation/AppHeader.vue";

const auth = useAuthStore();
const router = useRouter();

async function handleLogout() {
  await auth.logout();
  router.push("/login");
}

// Génère les étoiles une seule fois
const stars = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  style: {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `${Math.random() * 2 + 1}px`,
    height: `${Math.random() * 2 + 1}px`,
    animationDelay: `${Math.random() * 4}s`,
    animationDuration: `${Math.random() * 3 + 2}s`,
    opacity: Math.random() * 0.7 + 0.1,
  },
}));
</script>

<style scoped>
.stars-container {
  z-index: 0;
}

.star {
  position: absolute;
  background: white;
  border-radius: 50%;
  animation: twinkle var(--duration, 3s) ease-in-out infinite alternate;
}

@keyframes twinkle {
  from {
    opacity: 0.1;
    transform: scale(0.8);
  }
  to {
    opacity: 0.8;
    transform: scale(1.2);
  }
}
</style>
