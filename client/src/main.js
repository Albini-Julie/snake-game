import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import App from './App.vue'
import './assets/main.css'

const app   = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialise la session auth avant de monter l'app
const auth = useAuthStore()
auth.init().then(() => app.mount('#app'))