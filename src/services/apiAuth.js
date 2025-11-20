// frontend/src/services/apiAuth.js
import api from "./api"; // tu instancia base de Axios

// POST /api/auth/login
export async function apiLogin(credentials) {
  const { data } = await api.post("/auth/login", credentials);
  return data;
}

// GET /api/auth/login-env (login admin por .env)
export async function apiLoginEnv() {
  const { data } = await api.get("/auth/login-env");
  return data;
}

// POST /api/auth/register
export async function apiRegister(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}
