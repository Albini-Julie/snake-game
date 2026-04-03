<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-2xl">
      <div class="text-center mb-10">
        <h1 class="font-game text-game-accent text-xl mb-3">
          Choisis ton avatar
        </h1>
        <p class="text-slate-400 text-sm">Il apparaîtra sur le leaderboard</p>
      </div>

      <div v-if="loading" class="text-center text-slate-400 py-20">
        Chargement des avatars...
      </div>
      <div v-else-if="error" class="text-red-400 text-center py-10">
        {{ error }}
      </div>

      <div v-else>
        <AvatarGrid
          :avatars="avatars"
          :selected="selected"
          @select="selected = $event"
          class="mb-8"
        />

        <p
          v-if="auth.profile?.avatars"
          class="text-center text-slate-500 text-sm mb-6"
        >
          Avatar actuel :
          <span class="text-slate-300">{{ auth.profile.avatars.name }}</span>
        </p>

        <p v-if="saveError" class="text-red-400 text-sm text-center mb-4">
          {{ saveError }}
        </p>
        <p v-if="saveSuccess" class="text-green-400 text-sm text-center mb-4">
          Avatar mis à jour !
        </p>

        <div class="flex gap-3 justify-center">
          <AppButton @click="handleSave" :disabled="!selected || saving">
            <span v-if="saving">Sauvegarde...</span>
            <span v-else>Confirmer</span>
          </AppButton>
          <AppButton
            v-if="auth.hasAvatar"
            variant="secondary"
            @click="router.push('/game')"
          >
            Annuler
          </AppButton>
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
    setTimeout(() => router.push("/game"), 800);
  } catch {
    saveError.value = "Erreur lors de la mise à jour de l'avatar.";
  } finally {
    saving.value = false;
  }
}
</script>
