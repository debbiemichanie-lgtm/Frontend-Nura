import api from './api';

export const getEspecialidades   = (params) => api.get('/especialidades', { params }).then(r => r.data);
export const createEspecialidad  = (payload) => api.post('/especialidades', payload).then(r => r.data);
export const updateEspecialidad  = (id, payload) => api.put(`/especialidades/${id}`, payload).then(r => r.data);
export const deleteEspecialidad  = (id) => api.delete(`/especialidades/${id}`).then(r => r.data);
