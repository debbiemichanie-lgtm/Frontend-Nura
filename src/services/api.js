import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
});

// ======================= AUTH =======================

export function loginRequest(email, password) {
  return api.post("/auth/login", { email, password });
}

export function loginEnvRequest() {
  return api.get("/auth/login-env");
}

// ================== ESPECIALIDADES ==================

export function getEspecialidades() {
  return api.get("/especialidades");
}

export function createEspecialidad(data, token) {
  return api.post("/especialidades", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateEspecialidad(id, data, token) {
  return api.put(`/especialidades/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function deleteEspecialidad(id, token) {
  return api.delete(`/especialidades/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// =================== ESPECIALISTAS ==================

export function getEspecialistas(params = {}) {
  return api.get("/especialistas", { params });
}

export function getEspecialistaById(id) {
  return api.get(`/especialistas/${id}`);
}

export function createEspecialista(data, token) {
  return api.post("/especialistas", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateEspecialista(id, data, token) {
  return api.put(`/especialistas/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function deleteEspecialista(id, token) {
  return api.delete(`/especialistas/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// =================== AGENDA INTERNA ==================

export function listarBloqueosAgenda(especialistaId, token, params = {}) {
  return api.get(`/agenda/especialistas/${especialistaId}/bloqueos`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function crearBloqueoAgenda(especialistaId, data, token) {
  return api.post(`/agenda/especialistas/${especialistaId}/bloqueos`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function eliminarBloqueoAgenda(especialistaId, bloqueoId, token) {
  return api.delete(`/agenda/especialistas/${especialistaId}/bloqueos/${bloqueoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function crearTurnoManual(especialistaId, data, token) {
  return api.post(`/agenda/especialistas/${especialistaId}/turnos-manuales`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function cancelarTurno(turnoId, token) {
  return api.patch(
    `/turnos/${turnoId}/cancelar`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}

// ===================== TURNOS =====================

export function getTurnosByEspecialista(especialistaId, token) {
  return api.get(`/turnos/especialista/${especialistaId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function getDisponibilidad(especialistaId, from, to, token) {
  return api.get(`/turnos/disponibilidad/${especialistaId}`, {
    params: { from, to },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// ============= USUARIOS / CLIENTES (ADMIN) =============

export function getUsers(token) {
  return api.get("/usuarios", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createUser(data, token) {
  return api.post("/usuarios", data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function updateUser(id, data, token) {
  return api.put(`/usuarios/${id}`, data, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function deleteUser(id, token) {
  return api.delete(`/usuarios/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default api;