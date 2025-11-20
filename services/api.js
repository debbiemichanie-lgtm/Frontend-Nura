// src/services/api.js
export async function api(path, { method = "GET", headers = {}, body, token } = {}) {
  const finalHeaders = { ...headers };
  if (!(body instanceof FormData)) finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json";
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`;

  const res = await fetch(path, {
    method,
    headers: finalHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  // Devuelvo JSON “crudo” para que ApiPanel muestre tal cual
  let json;
  try { json = await res.json(); } catch { json = { ok: false, message: "Respuesta no JSON" }; }
  // Anoto status por si sirve en el panel
  return { status: res.status, ...json };
}
