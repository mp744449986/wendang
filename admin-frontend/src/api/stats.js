import api from './index'

export const getStats = (period) => api.get('/stats', { params: { period } })
export const recordView = (data) => api.post('/stats/record', data)
