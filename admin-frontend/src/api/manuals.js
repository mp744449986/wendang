import api from './index'

export const getManuals = (params) => api.get('/manuals', { params })
export const getManual = (id) => api.get(`/manuals/${id}`)
export const createManual = (data) => api.post('/manuals', data)
export const updateManual = (id, data) => api.put(`/manuals/${id}`, data)
export const deleteManual = (id) => api.delete(`/manuals/${id}`)
export const getManualPages = (id) => api.get(`/manuals/${id}/pages`)

export const uploadDocument = (formData, onProgress) => 
  api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  })
