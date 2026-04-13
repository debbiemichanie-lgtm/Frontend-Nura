const BASE = "/api/auth";

/**
 * Login normal (admin, user, client).
 * POST /api/auth/login
 */
export async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || "No se pudo iniciar sesión");
  }

  return data; // { ok, token, user }
}

/**
 * Login directo usando credenciales del .env del backend.
 * GET /api/auth/login-env
 */
export async function apiLoginEnv() {
  const res = await fetch(`${BASE}/login-env`);
  const data = await res.json();

  if (!res.ok || !data.ok) {
    throw new Error(data.message || "No se pudo iniciar sesión con .env");
  }

  return data; // { ok, token, user }
}

/**
 * Registro de usuario.
 * POST /api/auth/register
 */
export async function apiRegister(nombre, email, password) {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, email, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    throw new Error(data.message || "No se pudo registrar");
  }

  return data; // { ok, token, user }
}
