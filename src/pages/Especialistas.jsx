// src/pages/Especialistas.jsx
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getEspecialistas,
  getEspecialidades,
  createEspecialista,
  updateEspecialista,
  deleteEspecialista,
} from "../services/api.js";

// Tipos base que querés forzados
const TIPOS_BASE = ["Psicóloga", "Psiquiatra", "Ginecóloga", "Nutricionista"];

// Modalidades
const MODALIDADES = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "mixta", label: "Mixta" },
];

// Coberturas permitidas (valores tal como los espera el backend)
const COBERTURAS = [
  { value: "privado", label: "Particular" },
  { value: "obra social", label: "Obra social" },
  { value: "prepaga", label: "Prepaga" },
];

// Ciudades sugeridas
const CIUDADES = [
  "CABA",
  "Buenos Aires",
  "La Plata",
  "Bahía Blanca",
  "Córdoba",
  "Rosario",
  "Mendoza",
  "Neuquén",
  "Mar del Plata",
  "Lanús",
  "Morón",
  "San Isidro",
  "San Miguel de Tucumán",
];

const emptyForm = {
  id: "",
  name: "",
  tipo: "",
  modalidad: MODALIDADES[0].value,
  ciudad: "",
  cobertura: COBERTURAS[0].value,
  email: "",
  whatsapp: "",
  avatar: "",
  bio: "",
};

export default function Especialistas() {
  const { token, user } = useAuth();
  const [especialidades, setEspecialidades] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [apiResponse, setApiResponse] = useState(null);
  const [search, setSearch] = useState("");

  const role = user?.rol || user?.role || "guest";
  const isEditing = Boolean(form.id);

  const canCreate = role === "admin";
  const canEditOrDelete = role === "admin" || role === "client";

  // Carga inicial
  useEffect(() => {
    (async () => {
      try {
        const [espRes, especRes] = await Promise.all([
          getEspecialistas(),
          getEspecialidades(),
        ]);

        const especialistas =
          espRes.data?.data ||
          espRes.data?.especialistas ||
          espRes.data ||
          [];

        const especs =
          especRes.data?.data ||
          especRes.data?.especialidades ||
          especRes.data ||
          [];

        setItems(especialistas);
        setEspecialidades(especs);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  async function reload() {
    try {
      const res = await getEspecialistas();
      const list =
        res.data?.data || res.data?.especialistas || res.data || [];
      setItems(list);
    } catch (err) {
      console.error(err);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  // Opciones combinadas
  const tipoOptions = [
    ...TIPOS_BASE,
    ...especialidades
      .map((e) => e.name || e.nombre)
      .filter(Boolean)
      .filter((t) => !TIPOS_BASE.includes(t)),
  ];

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isEditing && !canCreate) {
      alert("Solo el admin puede crear nuevos especialistas.");
      return;
    }

    if (!form.name.trim()) {
      alert("El nombre es obligatorio");
      return;
    }

    if (!form.tipo) {
      alert("Seleccioná una especialidad profesional");
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.tipo,
      modality: form.modalidad,
      city: form.ciudad,
      coverage: form.cobertura,
      bio: form.bio || "",
      avatar: form.avatar || "",
      contact: {
        email: form.email || "",
        whatsapp: form.whatsapp || "",
      },
    };

    try {
      let res;
      if (isEditing) {
        if (!canEditOrDelete) {
          alert("No tenés permisos para editar especialistas.");
          return;
        }
        res = await updateEspecialista(form.id, payload, token);
      } else {
        res = await createEspecialista(payload, token);
      }

      setApiResponse(res.data);
      setForm({
        ...emptyForm,
        modalidad: MODALIDADES[0].value,
        cobertura: COBERTURAS[0].value,
      });

      await reload();
    } catch (err) {
      console.error(err);
      setApiResponse(err.response?.data || err);
      alert("Error al guardar especialista.");
    }
  }

  function handleEdit(esp) {
    if (!canEditOrDelete) {
      alert("No tenés permisos para editar especialistas.");
      return;
    }

    setForm({
      id: esp._id,
      name: esp.name || "",
      tipo: esp.type || "",
      modalidad: esp.modality || MODALIDADES[0].value,
      ciudad: esp.city || "",
      cobertura: esp.coverage || COBERTURAS[0].value,
      email: esp.contact?.email || "",
      whatsapp: esp.contact?.whatsapp || "",
      avatar: esp.avatar || "",
      bio: esp.bio || "",
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setForm({
      ...emptyForm,
      modalidad: MODALIDADES[0].value,
      cobertura: COBERTURAS[0].value,
    });
  }

  async function handleDelete(id) {
    if (!canEditOrDelete) {
      alert("No tenés permisos para borrar especialistas.");
      return;
    }
    if (!window.confirm("¿Eliminar este especialista?")) return;

    try {
      const res = await deleteEspecialista(id, token);
      setApiResponse(res.data);
      await reload();
    } catch (err) {
      console.error(err);
      setApiResponse(err.response?.data || err);
      alert("No se pudo eliminar");
    }
  }

  // ASÍ SE ARREGLA LA CARGA DE IMÁGENES
  function getAvatarUrl(avatar) {
    if (!avatar) return "";
    if (avatar.startsWith("http")) return avatar;

    const base = import.meta.env.VITE_API_URL.replace("/api", "");
    return `${base}${avatar}`;
  }

  const filteredItems = items.filter((e) =>
    (e.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="app-shell">
      <section className="panel-page">
        <h1 className="page-title">Especialistas</h1>

        <p className="page-intro">
          Este panel usa el mismo backend que el listado público.
        </p>

        {/* FORMULARIO */}
        {(canCreate || isEditing) && (
          <form className="admin-form" onSubmit={handleSubmit}>
            <h2 className="form-title">
              {isEditing ? "Editar especialista" : "Nuevo especialista"}
            </h2>

            <div className="form-grid">
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nombre y apellido"
              />

              <select
                className="input"
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
              >
                <option value="">Seleccionar especialidad</option>
                {tipoOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                className="input"
                name="modalidad"
                value={form.modalidad}
                onChange={handleChange}
              >
                {MODALIDADES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                className="input"
                name="ciudad"
                value={form.ciudad}
                onChange={handleChange}
              >
                <option value="">Ciudad</option>
                {CIUDADES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                className="input"
                name="cobertura"
                value={form.cobertura}
                onChange={handleChange}
              >
                {COBERTURAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>

              <input
                className="input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
              />

              <input
                className="input"
                name="whatsapp"
                value={form.whatsapp}
                onChange={handleChange}
                placeholder="WhatsApp"
              />

              <input
                className="input"
                name="avatar"
                value={form.avatar}
                onChange={handleChange}
                placeholder="URL Avatar (opcional)"
              />
            </div>

            <textarea
              className="textarea"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Descripción"
            />

            <div className="form-actions">
              <button className="btn-primary" type="submit">
                {isEditing ? "Guardar cambios" : "Crear especialista"}
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
          </form>
        )}

        {/* LISTADO */}
        <div className="listado-header">
          <h2>Listado</h2>
          <span className="muted">
            Resultados: {filteredItems.length} (de {items.length})
          </span>
        </div>

        <div className="form-grid" style={{ marginBottom: 16 }}>
          <input
            className="input"
            placeholder="Buscar especialista..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="cards-grid">
          {filteredItems.map((e) => {
            const email = e.contact?.email;
            const wa = e.contact?.whatsapp;

            const mailHref = email
              ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
                  email
                )}`
              : null;

            const waHref = wa
              ? `https://wa.me/${String(wa).replace(/\D/g, "")}`
              : null;

            return (
              <article key={e._id} className="card specialist-card">
                <div className="card-info">
                  <div className="card-head">
                  <div className="avatar-circle"
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "2px solid #fff",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                      marginRight: "12px",
                      flex: "0 0 auto",
                      background: "#f4f4ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#542d5c",
                      fontWeight: "600",
                      fontSize: "1.1rem"
                    }}
                  >
                    {e.avatar ? (
                      <img
                        src={getAvatarUrl(e.avatar)}
                        alt={e.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          borderRadius: "50%",
                        }}
                      />
                    ) : (
                      <span>{e.name?.[0] || "?"}</span>
                    )}
                  </div>


                    <div>
                      <h3 className="card-title">{e.name}</h3>
                      <div className="chips">
                        {e.type && <span className="chip">{e.type}</span>}
                        {e.modality && (
                          <span className="chip">{e.modality}</span>
                        )}
                        {e.coverage && (
                          <span className="chip">{e.coverage}</span>
                        )}
                      </div>
                      <p className="card-sub">
                        {e.city || "Ciudad no especificada"}
                      </p>
                    </div>
                  </div>

                  <p className="card-bio">
                    {e.bio ||
                      "Profesional especializado en el abordaje interdisciplinario de TCA."}
                  </p>
                </div>

                <div className="card-actions">
                <div>
                  {mailHref && (
                    <a
                      className="icon-btn"
                      href={mailHref}
                      target="_blank"
                      rel="noreferrer"
                      title={`Enviar email a ${e.name}`}
                    >
                      <i className="fa-solid fa-envelope email-icon"></i>
                    </a>
                  )}

                  {waHref && (
                    <a
                      className="icon-btn"
                      href={waHref}
                      target="_blank"
                      rel="noreferrer"
                      title={`Chatear por WhatsApp con ${e.name}`}
                    >
                      <i className="fa-brands fa-whatsapp whatsapp-icon"></i>
                    </a>
                  )}
                </div>


                  {canEditOrDelete && (
                    <div className="small-actions">
                      <button
                        className="btn-edit"
                        onClick={() => handleEdit(e)}
                      >
                        🖊 Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(e._id)}
                      >
                        🗑 Borrar
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}

          {filteredItems.length === 0 && (
            <p className="no-results">
              No se encontraron especialistas con ese nombre.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
