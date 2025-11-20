// src/pages/Especialidades.jsx
import { useEffect, useState } from "react";
import ConfirmModal from "../components/ConfirmModal.jsx";
import ApiPanel from "../components/ApiPanel.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getEspecialidades,
  createEspecialidad,
  updateEspecialidad,
  deleteEspecialidad,
} from "../services/api.js";

// Especialidades base del sistema (no editables / no borrables)
const BASE_ESPECIALIDADES = [
  "Psicóloga",
  "Psiquiatra",
  "Ginecóloga",
  "Nutricionista",
  "Clínico",
];

const emptyForm = { id: "", name: "", descripcion: "" };

/** Modal simple de éxito para crear/editar especialidad */
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

export default function Especialidades() {
  const { user, token } = useAuth(); // user.rol = 'admin' | 'client'
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [apiResponse, setApiResponse] = useState(null);

  // Modal de confirmar borrado
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Modal de éxito (creación / edición)
  const [successOpen, setSuccessOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isEditing = Boolean(form.id);
  const isAdmin = user?.rol === "admin";

  // Helpers
  function buildListFromApi(rawList) {
    const apiList =
      rawList?.map((e) => ({
        ...e,
        name: e.name || e.nombre || "",
        isBase: false,
      })) || [];

    // Excluimos de la parte “editable” las base
    const filteredApi = apiList.filter(
      (e) => !BASE_ESPECIALIDADES.includes((e.name || "").trim())
    );

    const baseItems = BASE_ESPECIALIDADES.map((name) => ({
      _id: `base-${name}`,
      name,
      descripcion: "Especialidad base del sistema (no editable).",
      isBase: true,
    }));

    return [...baseItems, ...filteredApi];
  }

  // Cargar lista inicial
  useEffect(() => {
    (async () => {
      try {
        const res = await getEspecialidades();
        const list =
          res.data?.data || res.data?.especialidades || res.data || [];
        setItems(buildListFromApi(list));
      } catch (err) {
        console.error(err);
        setItems(buildListFromApi([]));
      }
    })();
  }, []);

  async function reload() {
    try {
      const res = await getEspecialidades();
      const list =
        res.data?.data || res.data?.especialidades || res.data || [];
      setItems(buildListFromApi(list));
    } catch (err) {
      console.error(err);
      setItems(buildListFromApi([]));
    }
  }

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
      alert("Solo el admin puede crear o editar especialidades.");
      return;
    }
    if (!form.name.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    const nombreLimpio = form.name.trim();

    if (BASE_ESPECIALIDADES.includes(nombreLimpio)) {
      alert("Esa especialidad es base del sistema.");
      return;
    }

    const payload = {
      name: nombreLimpio,
      nombre: nombreLimpio,
      descripcion: form.descripcion?.trim() || "",
    };

    try {
      let res;
      if (isEditing) {
        res = await updateEspecialidad(form.id, payload, token);
      } else {
        res = await createEspecialidad(payload, token);
      }

      setApiResponse(res.data || res);
      setForm(emptyForm);
      await reload();

      // Modal de éxito
      setSuccessMessage(
        isEditing
          ? "La especialidad se actualizó correctamente."
          : "La especialidad se creó correctamente."
      );
      setSuccessOpen(true);
    } catch (err) {
      console.error(err);
      setApiResponse(err);
      alert("Error al guardar especialidad.");
    }
  }

  function handleEdit(esp) {
    if (!isAdmin) {
      alert("Solo el admin puede editar especialidades.");
      return;
    }
    if (esp.isBase) {
      alert("Las especialidades base no se pueden editar.");
      return;
    }
    setForm({
      id: esp._id,
      name: esp.name || "",
      descripcion:
        esp.descripcion || esp.description || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setForm(emptyForm);
  }

  function askDelete(id, isBase) {
    if (!isAdmin)
      return alert("Solo el admin puede borrar especialidades.");
    if (isBase)
      return alert("Las especialidades base no se pueden borrar.");
    setToDelete(id);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    try {
      const res = await deleteEspecialidad(toDelete, token);
      setApiResponse(res.data || res);
      await reload();
    } catch (err) {
      console.error(err);
      setApiResponse(err);
      alert("No se pudo eliminar la especialidad");
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  }

  const filteredItems = items.filter((e) =>
    `${e.name} ${e.descripcion || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="app-shell">
      <section className="panel-page">
        <h1 className="page-title">Especialidades</h1>
        <p className="page-intro">
          Este panel mantiene la lista de especialidades que luego se usan al
          cargar especialistas.
        </p>

        {isAdmin && (
          <form className="admin-form" onSubmit={handleSubmit}>
            <h2 className="form-title">
              {isEditing ? "Editar especialidad" : "Nueva especialidad"}
            </h2>

            <div className="form-grid">
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nombre (ej: Psicóloga)"
              />
              <textarea
                className="input textarea"
                name="descripcion"
                rows={2}
                value={form.descripcion}
                onChange={handleChange}
                placeholder="Descripción breve"
              />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {isEditing ? "Guardar cambios" : "Crear especialidad"}
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

            {/* Panel con la última respuesta */}
            <ApiPanel
              title="Respuesta de la API — Especialidades"
              data={apiResponse}
            />
          </form>
        )}

        {/* LISTAR / BUSCAR */}
        <div className="listado-header" style={{ marginTop: 28 }}>
          <h2>Listar / Buscar</h2>
          <span className="muted">
            Total: {filteredItems.length}{" "}
            {filteredItems.length !== items.length &&
              `(de ${items.length})`}
          </span>
        </div>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <input
            className="input"
            placeholder="Buscar por nombre o descripción..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        {filteredItems.length === 0 ? (
          <p className="no-results">No se encontraron especialidades.</p>
        ) : (
          <ul className="card-list">
            {filteredItems.map((e) => (
              <li key={e._id} className="card card-especialidad">
                <div className="card-head">
                  <div>
                    <h3 className="card-title">{e.name}</h3>
                    <p className="muted">
                      {e.isBase
                        ? "Especialidad base del sistema"
                        : "Especialidad disponible para especialistas"}
                    </p>
                  </div>
                </div>

                {e.descripcion && (
                  <p className="bio card-bio">{e.descripcion}</p>
                )}

                {isAdmin && !e.isBase && (
                  <div className="small-actions card-actions">
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => handleEdit(e)}
                    >
                      🖊 Editar
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => askDelete(e._id, e.isBase)}
                    >
                      🗑 Borrar
                    </button>
                  </div>
                )}

                {e.isBase && (
                  <p className="muted" style={{ marginTop: 8, fontSize: ".8rem" }}>
                    No editable ni borrable.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Modal de confirmación de borrado */}
        <ConfirmModal
          open={confirmOpen}
          message="¿Seguro que querés eliminar esta especialidad?"
          onConfirm={confirmDelete}
          onCancel={() => setConfirmOpen(false)}
        />

        {/* Modal de éxito al guardar */}
        <SuccessModal
          open={successOpen}
          message={successMessage}
          onClose={() => setSuccessOpen(false)}
        />
      </section>
    </main>
  );
}
