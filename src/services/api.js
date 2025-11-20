// src/services/api.js
import axios from "axios";

// Usa el valor del .env y, si no existe, cae a localhost:5000/api
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
