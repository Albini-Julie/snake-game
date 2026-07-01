<template>
  <div class="min-h-screen px-4 py-10 max-w-2xl mx-auto">
    <!-- Titre -->
    <div class="text-center mb-8">
      <p class="font-game text-slate-600 mb-2 text-pixel-sm">
        <span aria-hidden="true">—</span> POULPENTIN
        <span aria-hidden="true">—</span>
      </p>
      <h1
        class="text-shadow-accent-glow font-game text-game-accent text-pixel-xl"
      >
        AVATAR
      </h1>
      <p class="font-game text-slate-600 mt-2 text-pixel-sm uppercase">
        CHOOSE YOUR OCTOPUS
      </p>
    </div>

    <!-- Chargement -->
    <div v-if="loading" class="text-center py-20">
      <p class="font-game text-game-accent blink text-pixel-sm">LOADING...</p>
    </div>

    <div v-else-if="error" class="text-center py-10">
      <p class="font-game text-game-danger text-pixel-sm">
        {{ error }}
      </p>
    </div>

    <div v-else class="flex flex-col gap-6">
      <!-- Grille avatars -->
      <AvatarGrid
        :avatars="avatars"
        :selected="selected"
        @select="selected = $event"
      />

      <!-- Avatar actuel -->
      <p
        v-if="auth.profile?.avatars"
        class="font-game text-slate-600 text-center text-pixel-sm uppercase"
      >
        CURRENT :
        <span class="text-slate-300">{{ auth.profile.avatars.name }}</span>
      </p>

      <!-- Messages -->
      <p
        v-if="saveError"
        class="font-game text-game-danger text-center text-pixel-sm"
      >
        {{ saveError }}
      </p>
      <p
        v-if="saveSuccess"
        class="font-game text-game-success text-center text-pixel-sm uppercase"
      >
        AVATAR UPDATED !
      </p>

      <!-- Actions -->
      <div class="flex gap-4 justify-center">
        <AppButton @click="handleSave" :disabled="!selected || saving">
          <span v-if="saving">...</span>
          <span v-else>Choose</span>
        </AppButton>
        <AppButton
          v-if="auth.hasAvatar"
          variant="secondary"
          @click="router.push('/game')"
        >
          Cancel
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { getAvatars } from "@/api/avatars";
import AppButton from "@/components/ui/AppButton.vue";
import AvatarGrid from "@/components/avatar/AvatarGrid.vue";

const auth = useAuthStore();
const router = useRouter();

const avatars = ref([]);
const selected = ref(auth.profile?.avatar_id ?? null);
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const saveError = ref("");
const saveSuccess = ref(false);

onMounted(async () => {
  if (avatars.value.length > 0) return;
  try {
    const { data } = await getAvatars();
    avatars.value = data;
  } catch {
    error.value = "LOADING ERROR";
  } finally {
    loading.value = false;
  }
});

async function handleSave() {
  if (!selected.value) return;
  saveError.value = "";
  saveSuccess.value = false;
  saving.value = true;
  try {
    await auth.updateAvatar(selected.value);
    saveSuccess.value = true;
    setTimeout(() => router.push("/game"), 800);
  } catch {
    saveError.value = "ERREUR MISE À JOUR";
  } finally {
    saving.value = false;
  }
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
