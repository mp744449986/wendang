import api from './index'

export const login = (password) => api.post('/admin/login', { password })
export const logout = () => api.post('/admin/logout')
export const reauth = (password) => api.post('/admin/reauth', { password })
export const getDashboard = () => api.get('/admin/dashboard')
