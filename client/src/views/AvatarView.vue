<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-10">
        <h1 class="font-game text-game-accent text-xl mb-3">
          Choisis ton avatar
        </h1>
        <p class="text-slate-400 text-sm">Il apparaîtra sur le leaderboard</p>
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="text-center text-slate-400 py-20">
        Chargement des avatars...
      </div>

      <!-- Erreur -->
      <div v-else-if="error" class="text-red-400 text-center py-10">
        {{ error }}
      </div>

      <!-- Grille d'avatars -->
      <div v-else>
        <div class="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-8">
          <button
            v-for="avatar in avatars"
            :key="avatar.id"
            @click="selected = avatar.id"
            :class="[
              'card flex flex-col items-center gap-3 p-4 transition-all duration-200 hover:border-game-accent',
              selected === avatar.id
                ? 'border-game-accent ring-2 ring-game-accent ring-offset-2 ring-offset-game-bg'
                : 'border-game-border',
            ]"
          >
            <img
              :src="avatar.path"
              :alt="avatar.name"
              class="w-16 h-16 object-contain"
              @error="(e) => (e.target.src = '/avatars/default.png')"
            />
            <span class="text-xs text-slate-300 text-center leading-tight">{{
              avatar.name
            }}</span>
          </button>
        </div>

        <!-- Avatar actuel -->
        <p
          v-if="auth.profile?.avatars"
          class="text-center text-slate-500 text-sm mb-6"
        >
          Avatar actuel :
          <span class="text-slate-300">{{ auth.profile.avatars.name }}</span>
        </p>

        <!-- Message erreur/succès -->
        <p v-if="saveError" class="text-red-400 text-sm text-center mb-4">
          {{ saveError }}
        </p>
        <p v-if="saveSuccess" class="text-green-400 text-sm text-center mb-4">
          Avatar mis à jour !
        </p>

        <!-- Actions -->
        <div class="flex gap-3 justify-center">
          <button
            @click="handleSave"
            class="btn-primary"
            :disabled="!selected || saving"
          >
            <span v-if="saving">Sauvegarde...</span>
            <span v-else>Confirmer</span>
          </button>
          <button
            v-if="auth.hasAvatar"
            @click="router.push('/game')"
            class="btn-secondary"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import api from "@/lib/api";

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
  try {
    const { data } = await api.get("/avatars");
    avatars.value = data;
  } catch {
    error.value = "Impossible de charger les avatars.";
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
    // Redirige vers le jeu après un court délai
    setTimeout(() => router.push("/game"), 800);
  } catch {
    saveError.value = "Erreur lors de la mise à jour de l'avatar.";
  } finally {
    saving.value = false;
  }
}
</script>
