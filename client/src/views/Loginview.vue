<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="text-center mb-10">
        <h1 class="font-game text-game-accent text-2xl mb-2">POULPENTIN</h1>
        <p class="text-slate-400 text-sm">Le snake aux tentacules</p>
      </div>

      <div class="bg-game-surface border border-game-border rounded-xl p-6">
        <!-- Onglets -->
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
          <div v-if="mode === 'register'">
            <label class="block text-sm text-slate-400 mb-1"
              >Nom d'utilisateur</label
            >
            <input
              v-model="username"
              type="text"
              class="w-full px-4 py-3 rounded-lg bg-game-bg border border-game-border text-white placeholder-slate-500 focus:outline-none focus:border-game-accent transition-colors"
              placeholder="ex : poulpe42"
              minlength="3"
              maxlength="20"
              required
            />
          </div>

          <div>
            <label class="block text-sm text-slate-400 mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              autocomplete="email"
              class="w-full px-4 py-3 rounded-lg bg-game-bg border border-game-border text-white placeholder-slate-500 focus:outline-none focus:border-game-accent transition-colors"
              placeholder="ton@email.com"
              required
            />
          </div>

          <div>
            <label class="block text-sm text-slate-400 mb-1"
              >Mot de passe</label
            >
            <input
              v-model="password"
              type="password"
              autocomplete="current-password"
              class="w-full px-4 py-3 rounded-lg bg-game-bg border border-game-border text-white placeholder-slate-500 focus:outline-none focus:border-game-accent transition-colors"
              placeholder="••••••••"
              minlength="6"
              required
            />
          </div>

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

          <button
            type="submit"
            class="mt-2 px-6 py-3 rounded-lg font-semibold bg-game-accent hover:bg-indigo-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <span v-if="loading">Chargement...</span>
            <span v-else>{{
              mode === "login" ? "Se connecter" : "S'inscrire"
            }}</span>
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

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
