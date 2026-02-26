import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(password) {
    const res = await api.post('/admin/login', { password })
    token.value = res.token
    localStorage.setItem('token', res.token)
    return res
  }

  function logout() {
    token.value = null
    localStorage.removeItem('token')
    router.push('/login')
  }

  async function reauth(password) {
    return await api.post('/admin/reauth', { password })
  }

  return { token, isAuthenticated, login, logout, reauth }
})
