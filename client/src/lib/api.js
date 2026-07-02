import axios from 'axios'
import supabase from '@/lib/supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api'
})

// Injecte le token frais à chaque requête
api.interceptors.request.use(async config => {
  // refreshSession force le renouvellement si le token est expiré
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Si le serveur répond 401, on tente un refresh et on réessaie
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      const { data, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !data.session) {
        // Refresh impossible → déconnexion
        await supabase.auth.signOut()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      originalRequest.headers.Authorization = `Bearer ${data.session.access_token}`
      return api(originalRequest)
    }

    return Promise.reject(error)
  }
)

export default api