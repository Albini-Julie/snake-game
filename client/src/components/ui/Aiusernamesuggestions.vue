<template>
  <div class="mt-3">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-xs text-slate-500">Pseudos suggérés par IA</span>
      <button
        @click="generate"
        :disabled="loading"
        class="text-xs text-game-accent hover:text-indigo-400 transition-colors disabled:opacity-50"
      >
        {{ loading ? "Génération..." : "↺ Relancer" }}
      </button>
    </div>

    <div v-if="error" class="text-red-400 text-xs">{{ error }}</div>

    <div v-else class="flex gap-2 flex-wrap">
      <button
        v-for="name in usernames"
        :key="name"
        @click="$emit('select', name)"
        class="px-3 py-1 rounded-full bg-game-bg border border-game-border hover:border-game-accent text-slate-300 hover:text-white text-xs transition-all"
      >
        {{ name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from "@/lib/api";

defineEmits(["select"]);

const usernames = ref([]);
const loading = ref(false);
const error = ref("");

async function generate() {
  loading.value = true;
  error.value = "";
  try {
    const { data } = await api.get("/ai/usernames?refresh=true");
    usernames.value = data.usernames;
  } catch {
    error.value = "Impossible de générer des pseudos.";
  } finally {
    loading.value = false;
  }
}

onMounted(generate);
</script>
