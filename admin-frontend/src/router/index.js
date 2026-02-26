import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'Dashboard', component: () => import('@/views/Dashboard.vue') },
      { path: 'manuals', name: 'ManualList', component: () => import('@/views/manuals/List.vue') },
      { path: 'manuals/create', name: 'ManualCreate', component: () => import('@/views/manuals/Create.vue') },
      { path: 'manuals/:id/edit', name: 'ManualEdit', component: () => import('@/views/manuals/Edit.vue') },
      { path: 'ads', name: 'AdList', component: () => import('@/views/ads/List.vue') },
      { path: 'stats', name: 'Stats', component: () => import('@/views/stats/Index.vue') },
      { path: 'backup', name: 'Backup', component: () => import('@/views/backup/List.vue') },
      { path: 'settings', name: 'Settings', component: () => import('@/views/settings/Index.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory('/admin'),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router
