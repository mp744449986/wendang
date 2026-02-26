import api from './index'

export const getAds = () => api.get('/ads')
export const getAd = (id) => api.get(`/ads/${id}`)
export const createAd = (data) => api.post('/ads', data)
export const updateAd = (id, data) => api.put(`/ads/${id}`, data)
export const deleteAd = (id) => api.delete(`/ads/${id}`)
