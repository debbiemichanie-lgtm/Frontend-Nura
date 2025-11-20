// src/ui/AppLayout.jsx
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LogoutButton from "./LogoutButton.jsx";

import "./AppLayout.css";

export default function AppLayout() {
  const { user, loginWithEnv } = useAuth();
  const navigate = useNavigate();

  const handleEnvLogin = async () => {
    try {
      await loginWithEnv();
      navigate("/especialistas");
    } catch (err) {
      console.error(err);
      alert("No se pudo iniciar sesión con las credenciales del .env");
    }
  };

  return (
    <>
      {/* HEADER */}
      <header className="topbar">
        <div className="wrap topbar-inner">
          {/* Brand */}
          <Link to="/" className="brand">
            <div className="brand-logo">N</div>
            <div className="brand-text">
              <div className="brand-title">Especialistas en TCA</div>
              <div className="brand-sub">Panel académico · Demo</div>
            </div>
          </Link>

          {/* Nav */}
          <nav className="main-nav">
            <NavLink to="/" end className="nav-link">
              Inicio
            </NavLink>
            <NavLink to="/especialidades" className="nav-link">
              Especialidades
            </NavLink>
            <NavLink to="/especialistas" className="nav-link">
              Especialistas
            </NavLink>
            <NavLink to="/clientes" className="nav-link">
              Clientes
            </NavLink>
          </nav>

          {/* Sesión */}
          <div className="topbar-actions">
            {user ? (
              <>
                <span className="session-label">
                  Sesión: {user.email} ({user.rol || "user"})
                </span>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline">
                  Login
                </Link>
                <button className="btn btn-env" onClick={handleEnvLogin}>
                  Login admin (.env)
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="page-main">
        <div className="wrap">
          <Outlet />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="page-footer">
        <div className="wrap footer-inner">
          © Nura · Proyecto académico · Frontend y tester usan la misma API.
        </div>
      </footer>
    </>
  );
}
