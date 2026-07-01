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
    <!-- Scanlines CRT -->
    <div class="scanlines absolute inset-0 pointer-events-none z-20" />

    <!-- Vignette -->
    <div class="vignette absolute inset-0 pointer-events-none z-20" />

    <!-- Header -->
    <AppHeader v-if="auth.isLoggedIn" @logout="handleLogout" />

    <main class="flex-1 relative z-10">
      <RouterView v-slot="{ Component }">
        <Transition name="crt" mode="out-in">
          <component :is="Component" :key="$route.path" />
        </Transition>
      </RouterView>
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
    "--duration": `${Math.random() * 3 + 2}s`,
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

.scanlines {
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 0, 0, 0.08) 2px,
    rgba(0, 0, 0, 0.08) 4px
  );
}

.vignette {
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(0, 0, 0, 0.6) 100%
  );
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

<style>
/* Curseur pixel art global */
*,
*::before,
*::after,
button,
a,
[role="button"],
input,
select,
textarea,
label {
  cursor:
    url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIiBzaGFwZS1yZW5kZXJpbmc9ImNyaXNwRWRnZXMiPjxyZWN0IHg9IjE0IiB5PSIwIiB3aWR0aD0iNCIgaGVpZ2h0PSIxMiIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSIxNCIgeT0iMjAiIHdpZHRoPSI0IiBoZWlnaHQ9IjEyIiBmaWxsPSJ3aGl0ZSIvPjxyZWN0IHg9IjAiIHk9IjE0IiB3aWR0aD0iMTIiIGhlaWdodD0iNCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSIyMCIgeT0iMTQiIHdpZHRoPSIxMiIgaGVpZ2h0PSI0IiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==")
      16 16,
    crosshair !important;
}
/* Transition CRT entre les pages */
.crt-enter-active,
.crt-leave-active {
  transition: all 0.2s steps(4);
}

.crt-enter-from {
  opacity: 0;
  transform: scaleY(0.02) scaleX(1.1);
  filter: brightness(4);
}

.crt-enter-to {
  opacity: 1;
  transform: scaleY(1) scaleX(1);
  filter: brightness(1);
}

.crt-leave-from {
  opacity: 1;
  transform: scaleY(1) scaleX(1);
  filter: brightness(1);
}

.crt-leave-to {
  opacity: 0;
  transform: scaleY(0.02) scaleX(1.1);
  filter: brightness(4);
}
</style>
