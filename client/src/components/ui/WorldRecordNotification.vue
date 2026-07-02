<template>
  <Transition name="record">
    <div
      v-if="visible"
      class="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center"
    >
      <div
        class="shadow-pixel-card bg-game-bg border-2 border-yellow-400 px-4 py-4 flex items-center gap-4"
      >
        <span aria-hidden="true" class="font-game text-yellow-400 text-pixel-lg"
          >👑</span
        >
        <div class="flex flex-col gap-1">
          <p class="font-game text-yellow-400 text-pixel-sm">
            NEW WORLD RECORD !
          </p>
          <p class="font-game text-white text-pixel-sm">SCORE : {{ score }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch } from "vue";
import { useSound } from "@/composables/useSound";

const props = defineProps({
  isWorldRecord: {
    type: Boolean,
    default: false,
  },
  score: {
    type: Number,
    default: 0,
  },
});

const { playSuccess } = useSound();
const visible = ref(false);
let timer = null;

watch(
  () => props.isWorldRecord,
  (val) => {
    if (!val) return;

    visible.value = true;
    playSuccess();
    playSuccess(); // double son pour marquer l'événement

    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      visible.value = false;
    }, 6000);
  },
);
</script>

<style scoped>
.record-enter-active {
  animation: drop-in 0.4s steps(4) forwards;
}
.record-leave-active {
  animation: drop-out 0.3s steps(4) forwards;
}

@keyframes drop-in {
  from {
    transform: translateX(-50%) translateY(-30px);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}

@keyframes drop-out {
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(-30px);
    opacity: 0;
  }
}
</style>
