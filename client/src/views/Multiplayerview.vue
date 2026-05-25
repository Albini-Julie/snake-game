<template>
  <div
    class="min-h-screen flex flex-col items-center justify-center gap-6 px-4 py-8"
  >
    <!-- ── LOBBY ── -->
    <div
      v-if="state === 'idle'"
      class="flex flex-col items-center gap-6 w-full max-w-sm"
    >
      <div class="text-center">
        <p class="font-game text-slate-600 mb-2 text-pixel-sm">
          — POULPENTIN —
        </p>
        <h1
          class="font-game text-game-accent text-pixel-xl text-shadow-accent-glow"
        >
          2 PLAYERS
        </h1>
      </div>

      <div
        class="shadow-pixel-card bg-game-surface/60 w-full p-6 flex flex-col gap-4"
      >
        <p class="font-game text-game-accent text-pixel-sm text-center">
          SELECT MODE
        </p>

        <!-- Matchmaking auto -->
        <button
          @click="handleMatchmaking"
          class="group flex flex-col items-center gap-2 p-4 border-2 border-game-border hover:border-game-accent bg-game-bg transition-all duration-75 hover:-translate-y-0.5"
        >
          <AppIcon name="search" size="lg" />
          <p
            class="font-game text-white text-pixel-sm group-hover:text-game-accent transition-colors"
          >
            AUTO MATCHMAKING
          </p>
          <p class="font-game text-slate-600 text-pixel-sm">
            Find an opponent automatically
          </p>
        </button>

        <!-- Créer une room -->
        <button
          @click="handleCreateRoom"
          class="group flex flex-col items-center gap-2 p-4 border-2 border-game-border hover:border-game-accent bg-game-bg transition-all duration-75 hover:-translate-y-0.5"
        >
          <AppIcon name="add" size="lg" />
          <p
            class="font-game text-white text-pixel-sm group-hover:text-game-accent transition-colors"
          >
            CREATE ROOM
          </p>
          <p class="font-game text-slate-600 text-pixel-sm">
            Share the code with your friend
          </p>
        </button>

        <!-- Rejoindre -->
        <button
          @click="showJoinForm = !showJoinForm"
          :class="[
            'group flex flex-col items-center gap-2 p-4 border-2 bg-game-bg transition-all duration-75 hover:-translate-y-0.5',
            showJoinForm
              ? 'border-game-accent'
              : 'border-game-border hover:border-game-accent',
          ]"
        >
          <AppIcon name="link" size="md" />
          <p
            class="font-game text-pixel-sm transition-colors"
            :class="
              showJoinForm
                ? 'text-game-accent'
                : 'text-white group-hover:text-game-accent'
            "
          >
            JOIN A ROOM
          </p>
          <p class="font-game text-slate-600 text-pixel-sm">
            Enter your friend's code
          </p>
        </button>

        <!-- Champ code -->
        <div v-if="showJoinForm" class="flex flex-col gap-3 mt-1">
          <AppInput
            v-model="roomCode"
            label="ROOM CODE"
            placeholder="ABC123"
            :maxlength="6"
            autocomplete="off"
          />
          <AppButton @click="handleJoinRoom" :disabled="roomCode.length < 6">
            JOIN
          </AppButton>
        </div>

        <p
          v-if="errorMsg"
          class="font-game text-game-danger text-center text-pixel-sm"
        >
          {{ errorMsg }}
        </p>
      </div>
    </div>

    <!-- ── EN ATTENTE ── -->
    <div
      v-else-if="state === 'waiting'"
      class="text-center flex flex-col gap-6"
    >
      <h1
        class="font-game text-game-accent text-pixel-xl text-shadow-accent-glow"
      >
        WAITING...
      </h1>

      <div v-if="roomId" class="shadow-pixel-card bg-game-surface/60 p-6">
        <p class="font-game text-slate-500 text-pixel-sm mb-3">ROOM CODE</p>
        <p class="font-game text-white text-pixel-xl tracking-widest">
          {{ roomId }}
        </p>
        <p class="font-game text-slate-600 text-pixel-sm mt-3">
          Share this code with your opponent
        </p>
      </div>

      <p class="font-game text-slate-500 text-pixel-sm blink">
        SEARCHING FOR OPPONENT...
      </p>
      <AppButton variant="secondary" @click="mp.disconnect()">CANCEL</AppButton>
    </div>

    <!-- ── COUNTDOWN ── -->
    <div
      v-else-if="state === 'countdown'"
      class="text-center flex flex-col gap-4"
    >
      <h1
        class="font-game text-game-accent text-pixel-xl text-shadow-accent-glow"
      >
        GET READY!
      </h1>
      <div class="flex gap-8 justify-center">
        <div
          v-for="(p, i) in players"
          :key="p.id"
          class="flex flex-col items-center gap-2"
        >
          <div
            class="w-4 h-4"
            :style="{ background: mp.PLAYER_COLORS[i].head }"
          />
          <p
            class="font-game text-pixel-sm"
            :style="{ color: mp.PLAYER_COLORS[i].head }"
          >
            {{ p.username }}
          </p>
        </div>
      </div>
      <p class="font-game text-white text-pixel-xl">{{ countdown }}</p>
    </div>

    <!-- ── Canvas ── -->
    <div
      v-show="
        state === 'playing' || state === 'finished' || state === 'abandoned'
      "
      class="relative border-2 border-game-border overflow-hidden"
      :style="{ width: CANVAS_SIZE + 'px', height: CANVAS_SIZE + 'px' }"
    >
      <canvas
        ref="canvasRef"
        :width="CANVAS_SIZE"
        :height="CANVAS_SIZE"
        class="block"
      />

      <!-- HUD scores -->
      <div
        class="absolute top-2 left-0 right-0 flex justify-between px-3 pointer-events-none"
      >
        <div
          v-for="(p, i) in players"
          :key="p.id"
          class="flex flex-col items-center"
        >
          <p
            class="font-game text-pixel-sm"
            :style="{ color: mp.PLAYER_COLORS[i].head }"
          >
            {{ p.username }}
          </p>
          <p class="font-game text-white text-lg">{{ p.score }}</p>
        </div>
      </div>

      <!-- Overlay Game Over -->
      <div
        v-if="state === 'finished' || state === 'abandoned'"
        class="absolute inset-0 flex flex-col items-center justify-center bg-game-bg/85 gap-4"
      >
        <p
          class="font-game text-pixel-lg"
          :class="
            winner?.id === myPlayerId ? 'text-yellow-400' : 'text-red-400'
          "
        >
          {{ winner?.id === myPlayerId ? "YOU WIN!" : "GAME OVER" }}
        </p>

        <p
          v-if="state === 'abandoned'"
          class="font-game text-slate-400 text-pixel-sm"
        >
          {{ errorMsg }}
        </p>
        <template v-else>
          <p v-if="winner" class="font-game text-yellow-400 text-pixel-sm">
            {{ winner.username }} WINS!
          </p>
          <p v-else class="font-game text-slate-400 text-pixel-sm uppercase">
            equality !
          </p>
          <div class="flex flex-col gap-1 mt-2">
            <p
              v-for="(p, i) in players"
              :key="p.id"
              class="font-game text-pixel-sm"
              :style="{ color: mp.PLAYER_COLORS[i].head }"
            >
              {{ p.username }} : {{ p.score }}
            </p>
          </div>
        </template>

        <div class="flex gap-3 mt-2">
          <AppButton @click="resetAndGoLobby">PLAY AGAIN</AppButton>
          <AppButton variant="secondary" @click="router.push('/game')"
            >SOLO</AppButton
          >
        </div>
      </div>
    </div>

    <p
      v-if="state === 'playing'"
      class="font-game text-slate-600 text-pixel-sm"
    >
      USE ARROW KEYS TO CONTROL YOUR OCTOPUS
    </p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useMultiplayer } from "@/composables/useMultiplayer";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";
import AppIcon from "@/components/ui/AppIcon.vue";

const CANVAS_SIZE = window.innerWidth < 640 ? 320 : 400;

const router = useRouter();
const auth = useAuthStore();
const canvasRef = ref(null);
const mp = useMultiplayer(canvasRef);

const { state, roomId, countdown, players, winner, errorMsg } = mp;

const showJoinForm = ref(false);
const roomCode = ref("");

const myPlayerId = computed(
  () => mp.players.value[mp.myIndex.value]?.id ?? null,
);

watch(canvasRef, (canvas) => {
  if (canvas) mp.init(canvas);
});

onMounted(() => {
  window.addEventListener("keydown", mp.handleKey);
});

onUnmounted(() => {
  window.removeEventListener("keydown", mp.handleKey);
  mp.disconnect();
});

function handleMatchmaking() {
  const username = auth.profile?.username ?? "Player";
  mp.joinMatchmaking(username);
}

function handleCreateRoom() {
  const username = auth.profile?.username ?? "Player";
  mp.createRoom(username);
}

function handleJoinRoom() {
  if (roomCode.value.length < 6) return;
  const username = auth.profile?.username ?? "Player";
  mp.joinRoom(username, roomCode.value.toUpperCase());
}

function resetAndGoLobby() {
  mp.disconnect();
  showJoinForm.value = false;
  roomCode.value = "";
}
</script>

<style scoped>
.blink {
  animation: blink 1s steps(1) infinite;
}
@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
