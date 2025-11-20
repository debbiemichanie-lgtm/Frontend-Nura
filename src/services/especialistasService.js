import api from './api';

export const getEspecialistas    = (params) => api.get('/especialistas', { params }).then(r => r.data);
export const createEspecialista  = (payload) => api.post('/especialistas', payload).then(r => r.data);
export const updateEspecialista  = (id, payload) => api.put(`/especialistas/${id}`, payload).then(r => r.data);
export const deleteEspecialista  = (id) => api.delete(`/especialistas/${id}`).then(r => r.data);
