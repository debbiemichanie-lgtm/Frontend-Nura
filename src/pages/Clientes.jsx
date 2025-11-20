// src/pages/Clientes.jsx
import { useEffect, useState } from "react";
import ConfirmModal from "../components/ConfirmModal.jsx";
import ApiPanel from "../components/ApiPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../services/api.js";

const emptyForm = { id: "", nombre: "", email: "", password: "" };

function SuccessModal({ open, message, onClose }) {
  if (!open) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        className="modal-card"
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "20px 24px",
          maxWidth: 380,
          width: "90%",
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
          textAlign: "center",
        }}
      >
        <h3
          className="dialog-title"
          style={{ margin: "0 0 10px", fontSize: "1.25rem" }}
        >
          ¡Guardado!
        </h3>
        <p style={{ margin: "0 0 18px", fontSize: ".95rem" }}>{message}</p>
        <button type="button" className="btn-primary" onClick={onClose}>
          Aceptar
        </button>
      </div>
    </div>
  );
}

export default function Clientes() {
  const { user, token } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [apiResponse, setApiResponse] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = Boolean(form.id);
  const isAdmin = user?.rol === "admin";

  async function reload() {
    try {
      const res = await getUsers(token);
      const list = res.data?.data || res.data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setItems([]);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      reload();
    }
  }, [isAdmin]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isAdmin) {
      alert("Solo el admin puede crear o editar clientes.");
      return;
    }

    if (!form.nombre.trim() || !form.email.trim()) {
      alert("Nombre y email son obligatorios.");
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
    };

    // Solo enviamos password si se completó
    if (form.password && form.password.trim()) {
      payload.password = form.password;
    }

    try {
      let res;
      if (isEditing) {
        res = await updateUser(form.id, payload, token);
      } else {
        res = await createUser(payload, token);
      }

      setApiResponse(res.data || res);
      setForm(emptyForm);
      await reload();

      setSuccessMessage(
        isEditing
          ? "El cliente se actualizó correctamente."
          : "El cliente se creó correctamente."
      );
      setSuccessOpen(true);
    } catch (err) {
      console.error(err);
      setApiResponse(err);
      alert("Error al guardar el cliente.");
    }
  }

  function handleEdit(cli) {
    if (!isAdmin) {
      alert("Solo el admin puede editar clientes.");
      return;
    }

    setForm({
      id: cli._id,
      nombre: cli.nombre || "",
      email: cli.email || "",
      password: "", // se deja vacío, solo se cambia si el admin escribe algo
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setForm(emptyForm);
  }

  function askDelete(id) {
    if (!isAdmin) return alert("Solo el admin puede borrar clientes.");
    setToDelete(id);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    try {
      const res = await deleteUser(toDelete, token);
      setApiResponse(res.data || res);
      await reload();
    } catch (err) {
      console.error(err);
      setApiResponse(err);
      alert("No se pudo eliminar el cliente.");
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  }

  if (!isAdmin) {
    return (
      <main className="app-shell" style={{ padding: "40px 0" }}>
        <section className="panel-page" style={{ textAlign: "center" }}>
          
          <div
            style={{
              background: "#ffffff",
              padding: "40px 32px",
              borderRadius: "18px",
              maxWidth: "520px",
              margin: "0 auto",
              boxShadow: "0 8px 24px rgba(99, 50, 102, 0.12)",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔒</div>
  
            <h2 style={{ marginBottom: "12px", color: "#633266" }}>
              Acceso restringido
            </h2>
  
            <p style={{ color: "#555", fontSize: "1rem", lineHeight: "1.5" }}>
              Esta sección es exclusiva para administradores del sistema.
              <br />
              Si necesitás administrar clientes, por favor ponete en contacto con
              el equipo de Nura.
            </p>
          </div>
  
        </section>
      </main>
    );
  }
  

  const filteredItems = items.filter((c) =>
    `${c.nombre} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="app-shell">
      <section className="panel-page">
        <h1 className="page-title">Clientes</h1>
        <p className="page-intro">
          Administración de usuarios clientes que pueden acceder al panel para
          editar especialistas y especialidades.
        </p>

        {/* Formulario alta/edición */}
        <form className="admin-form" onSubmit={handleSubmit}>
          <h2 className="form-title">
            {isEditing ? "Editar cliente" : "Nuevo cliente"}
          </h2>

          <div className="form-grid">
            <input
              className="input"
              name="nombre"
              placeholder="Nombre completo"
              value={form.nombre}
              onChange={handleChange}
            />
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              className="input"
              name="password"
              type="password"
              placeholder={
                isEditing
                  ? "Nueva contraseña (opcional)"
                  : "Contraseña inicial"
              }
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="form-actions">
            <button className="btn-primary" type="submit">
              {isEditing ? "Guardar cambios" : "Crear cliente"}
            </button>
            {isEditing && (
              <button
                type="button"
                className="btn-ghost"
                onClick={handleCancelEdit}
              >
                Cancelar
              </button>
            )}
          </div>

          <ApiPanel
            title="Respuesta de la API — Clientes"
            data={apiResponse}
          />
        </form>

        {/* Listado / búsqueda */}
        <div className="listado-header" style={{ marginTop: 28 }}>
          <h2>Listado de clientes</h2>
          <span className="muted">Total: {filteredItems.length}</span>
        </div>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <input
            className="input"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {filteredItems.length === 0 ? (
          <p className="no-results">
            No hay clientes cargados todavía. Podés crear uno con el formulario
            de arriba.
          </p>
        ) : (
          <ul className="card-list">
            {filteredItems.map((c) => (
              <li key={c._id} className="card">
                <div className="card-info">
                  <h3 className="card-title">{c.nombre}</h3>
                  <p className="card-sub">{c.email}</p>
                  <p className="card-sub">Rol: {c.rol}</p>
                </div>

                <div className="small-actions card-actions">
                  <button
                    type="button"
                    className="btn-edit"
                    onClick={() => handleEdit(c)}
                  >
                    🖊 Editar
                  </button>
                  <button
                    type="button"
                    className="btn-delete"
                    onClick={() => askDelete(c._id)}
                  >
                    🗑 Borrar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <ConfirmModal
          open={confirmOpen}
          message="¿Seguro que querés eliminar este cliente?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />

        <SuccessModal
          open={successOpen}
          message={successMessage}
          onClose={() => setSuccessOpen(false)}
        />
      </section>
    </main>
  );
}
