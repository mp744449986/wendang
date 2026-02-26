import api from './index'

export const getBackups = () => api.get('/backup')
export const createBackup = (data) => api.post('/backup/create', data)
export const getBackup = (id) => api.get(`/backup/${id}`)
export const deleteBackup = (id) => api.delete(`/backup/${id}`)
export const getBackupSettings = () => api.get('/backup/settings')
