// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("admin@nura.app");
  const [password, setPassword] = useState("supersegura123");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await login(email, password);
      navigate("/especialistas");
    } catch (err) {
      console.error(err);

      if (err?.response?.status === 401) {
        setError("Credenciales inválidas. Verificá email y contraseña.");
      } else {
        setError(
          "No se pudo conectar con la API. Verificá que el backend esté en http://localhost:5000."
        );
      }
    }
  };

  return (
    <section className="login-page">
      <div className="login-card">
        <h1 className="page-title">Login</h1>
        <p className="login-intro">
          Ingresá con tu usuario de admin o staff.
          <br />
          Para la corrección podés usar:{" "}
          <code>admin@nura.app / supersegura123</code>
        </p>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn primary block">
            Entrar
          </button>
        </form>

        <p className="login-hint">
          Tip: también podés usar el botón{" "}
          <strong>“Login admin (.env)”</strong> del encabezado, que toma las
          credenciales definidas en el backend.
        </p>
      </div>
    </section>
  );
}
