<template>
  <div class="mt-3">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-pixel-md text-slate-500"
        >Usernames suggested by AI</span
      >
      <button
        @click="generate"
        :disabled="loading"
        class="text-pixel-md text-game-accent hover:text-indigo-400 transition-colors disabled:opacity-50"
      >
        {{ loading ? "Generating..." : "↺ Regenerate" }}
      </button>
    </div>

    <div v-if="error" class="text-red-400 text-pixel-md">{{ error }}</div>

    <div v-else class="flex gap-2 flex-wrap">
      <button
        v-for="name in usernames"
        :key="name"
        @click="$emit('select', name)"
        class="px-3 py-1 rounded-full bg-game-bg border border-game-border hover:border-game-accent text-slate-300 hover:text-white text-pixel-md transition-all"
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
    error.value = "Impossible to generate usernames.";
  } finally {
    loading.value = false;
  }
}

onMounted(generate);
</script>
