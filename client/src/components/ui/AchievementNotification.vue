<template>
  <Transition name="notif">
    <div
      v-if="visible"
      class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center"
    >
      <div
        v-for="achievement in queue"
        :key="achievement.slug"
        class="shadow-pixel-card bg-game-bg border-2 border-game-accent px-3 py-3 flex items-center gap-3"
      >
        <span
          aria-hidden="true"
          class="font-game text-game-accent text-pixel-lg"
          >★</span
        >
        <div class="flex flex-col">
          <p class="font-game text-game-accent text-pixel-sm">
            ACHIEVEMENT UNLOCKED
          </p>
          <p class="font-game text-white text-pixel-sm">
            {{ achievement.name }}
          </p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  slugs: {
    type: Array,
    default: () => [],
  },
  allAchievements: {
    type: Array,
    default: () => [],
  },
});

const visible = ref(false);
const queue = ref([]);
let timer = null;

watch(
  () => props.slugs,
  (newSlugs) => {
    if (!newSlugs || newSlugs.length === 0) return;

    // Retrouve les noms des achievements depuis leurs slugs
    queue.value = newSlugs
      .map((slug) => props.allAchievements.find((a) => a.slug === slug))
      .filter(Boolean);

    if (queue.value.length === 0) return;

    visible.value = true;

    // Disparaît après 4 secondes
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      visible.value = false;
      queue.value = [];
    }, 4000);
  },
  { deep: true },
);
</script>

<style scoped>
.notif-enter-active {
  animation: slide-up 0.3s steps(4) forwards;
}
.notif-leave-active {
  animation: slide-down 0.3s steps(4) forwards;
}

@keyframes slide-up {
  from {
    transform: translateX(-50%) translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes slide-down {
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(20px);
    opacity: 0;
  }
}
</style>
