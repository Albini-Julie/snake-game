import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import supabase from '@/lib/supabase'
import api from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const user    = ref(null)
  const profile = ref(null)
  const loading = ref(true)

  const isLoggedIn = computed(() => !!user.value)
  const hasAvatar  = computed(() => !!profile.value?.avatar_id)

  // Charge le profil depuis l'API Express
  async function fetchProfile() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data } = await api.get('/users/me')
      profile.value = data
    } catch {
      profile.value = null
    }
  }

  // Initialise la session au démarrage de l'app
  async function init() {
    loading.value = true

    // Attend que Supabase ait restauré la session depuis le localStorage
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null

    if (user.value) await fetchProfile()
    loading.value = false

    // Écoute les changements APRÈS l'init
    supabase.auth.onAuthStateChange(async (event, session) => {
      user.value = session?.user ?? null
      if (event === 'SIGNED_IN')  await fetchProfile()
      if (event === 'SIGNED_OUT') profile.value = null
    })
  }

  async function login(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function register(email, password, username) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // Crée le profil utilisateur dans la table users
    await supabase.from('users').insert({
      id: data.user.id,
      email,
      username,
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value    = null
    profile.value = null
  }

  async function updateAvatar(avatarId) {
    await api.put('/users/avatar', { avatar_id: avatarId })
    await fetchProfile()
  }

  return {
    user, profile, loading,
    isLoggedIn, hasAvatar,
    init, login, register, logout, updateAvatar
  }
})