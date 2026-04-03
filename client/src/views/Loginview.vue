<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-10">
        <h1 class="font-game text-game-accent text-2xl mb-2">POULPENTIN</h1>
        <p class="text-slate-400 text-sm">Le snake aux tentacules</p>
      </div>

      <AppCard>
        <div class="flex mb-6 bg-game-bg rounded-lg p-1">
          <button
            @click="mode = 'login'"
            :class="
              mode === 'login'
                ? 'bg-game-surface text-white'
                : 'text-slate-400 hover:text-white'
            "
            class="flex-1 py-2 rounded-md text-sm font-medium transition-all"
          >
            Connexion
          </button>
          <button
            @click="mode = 'register'"
            :class="
              mode === 'register'
                ? 'bg-game-surface text-white'
                : 'text-slate-400 hover:text-white'
            "
            class="flex-1 py-2 rounded-md text-sm font-medium transition-all"
          >
            Inscription
          </button>
        </div>

        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4">
          <AppInput
            v-if="mode === 'register'"
            v-model="username"
            label="Nom d'utilisateur"
            placeholder="ex : poulpe42"
            :minlength="3"
            :maxlength="20"
            :required="true"
            autocomplete="username"
          />
          <AppInput
            v-model="email"
            label="Email"
            type="email"
            placeholder="ton@email.com"
            :required="true"
            autocomplete="email"
          />
          <AppInput
            v-model="password"
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            :minlength="6"
            :required="true"
            autocomplete="current-password"
          />

          <p
            v-if="error"
            class="text-red-400 text-sm bg-red-400/10 rounded-lg px-4 py-3"
          >
            {{ error }}
          </p>
          <p
            v-if="successMsg"
            class="text-green-400 text-sm bg-green-400/10 rounded-lg px-4 py-3"
          >
            {{ successMsg }}
          </p>

          <AppButton type="submit" class="mt-2" :disabled="loading">
            <span v-if="loading">Chargement...</span>
            <span v-else>{{
              mode === "login" ? "Se connecter" : "S'inscrire"
            }}</span>
          </AppButton>
        </form>
      </AppCard>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import AppCard from "@/components/ui/AppCard.vue";
import AppButton from "@/components/ui/AppButton.vue";
import AppInput from "@/components/ui/AppInput.vue";

const auth = useAuthStore();
const router = useRouter();

const mode = ref("login");
const email = ref("");
const password = ref("");
const username = ref("");
const loading = ref(false);
const error = ref("");
const successMsg = ref("");

async function handleSubmit() {
  error.value = "";
  successMsg.value = "";
  loading.value = true;
  try {
    if (mode.value === "login") {
      await auth.login(email.value, password.value);
      router.push(auth.hasAvatar ? "/game" : "/avatar");
    } else {
      await auth.register(email.value, password.value, username.value);
      successMsg.value = "Compte créé ! Connecte-toi.";
      mode.value = "login";
    }
  } catch (e) {
    error.value = e.message ?? "Une erreur est survenue.";
  } finally {
    loading.value = false;
  }
}
</script>
