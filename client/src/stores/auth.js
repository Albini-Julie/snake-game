import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import supabase from '@/lib/supabase'
import { getMyProfile, updateAvatar as updateAvatarApi } from '@/api/users'

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

      const { data } = await getMyProfile()
      profile.value = data
    } catch {
      profile.value = null
    }
  }

  // Initialise la session au démarrage de l'app
  async function init() {
    loading.value = true

    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    if (user.value) await fetchProfile()
    loading.value = false

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        user.value = session?.user ?? null
        if (!profile.value) await fetchProfile()
      }
      if (event === 'SIGNED_OUT') {
        user.value    = null
        profile.value = null
      }
      if (event === 'TOKEN_REFRESHED') {
        user.value = session?.user ?? null
      }
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
    await updateAvatarApi(avatarId)
    await fetchProfile()
  }

  return {
    user, profile, loading,
    isLoggedIn, hasAvatar,
    init, login, register, logout, updateAvatar
  }
})