// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { apiLogin, apiLoginEnv, apiRegister } from "../services/apiAuth.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Cargar sesión guardada al montar
  useEffect(() => {
    const saved = localStorage.getItem("nura_auth");
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved);
      if (parsed?.token && parsed?.user) {
        setToken(parsed.token);
        setUser(parsed.user);
      }
    } catch (err) {
      console.error("Error al leer auth guardado", err);
    }
  }, []);

  // Persistir sesión cuando cambian user/token
  useEffect(() => {
    if (token && user) {
      localStorage.setItem("nura_auth", JSON.stringify({ token, user }));
    } else {
      localStorage.removeItem("nura_auth");
    }
  }, [token, user]);

  // Login normal
  async function login(email, password) {
    const res = await apiLogin({ email, password }); // ⬅️ importante: objeto
    if (!res.ok) {
      throw new Error(res.message || "Credenciales inválidas");
    }
    setToken(res.token);
    setUser(res.user);
    return res;
  }

  // Login admin desde .env
  async function loginWithEnv() {
    const res = await apiLoginEnv();
    if (!res.ok) {
      throw new Error(res.message || "No se pudo iniciar sesión con las credenciales del .env");
    }
    setToken(res.token);
    setUser(res.user);
    return res;
  }

  // Registro de usuario normal
  // Espera un objeto: { nombre, email, password }
  async function register(data) {
    const res = await apiRegister(data);
    if (!res.ok) {
      throw new Error(res.message || "No se pudo registrar");
    }

    // Si querés auto-login después de registrarse, descomentá:
    // setToken(res.token);
    // setUser(res.user);

    return res;
  }

  // Logout (solo limpia estado; la confirmación visual la maneja el componente)
  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("nura_auth");
  }

  const value = {
    user,
    token,
    isAuthenticated: !!token,
    login,
    loginWithEnv,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
