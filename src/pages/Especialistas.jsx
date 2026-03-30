import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getEspecialistas,
  getEspecialidades,
  createEspecialista,
  updateEspecialista,
  deleteEspecialista,
} from "../services/api.js";
import "./Especialistas.css";

const TIPOS_BASE = ["Psicóloga", "Psiquiatra", "Ginecóloga", "Nutricionista"];

const MODALIDADES = [
  { value: "presencial", label: "Presencial" },
  { value: "virtual", label: "Virtual" },
  { value: "mixta", label: "Mixta" },
];

const COBERTURAS = [
  { value: "privado", label: "Particular" },
  { value: "obra social", label: "Obra social" },
  { value: "prepaga", label: "Prepaga" },
];

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

const DIAS = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
];

function buildDefaultHorarios() {
  return {
    lunes: { active: true, from: "09:00", to: "17:00" },
    martes: { active: true, from: "09:00", to: "17:00" },
    miercoles: { active: true, from: "09:00", to: "17:00" },
    jueves: { active: true, from: "09:00", to: "17:00" },
    viernes: { active: true, from: "09:00", to: "17:00" },
    sabado: { active: false, from: "", to: "" },
    domingo: { active: false, from: "", to: "" },
  };
}

function normalizeHorarios(input) {
  const base = buildDefaultHorarios();
  if (!input || typeof input !== "object") return base;

  for (const dia of DIAS) {
    const src = input[dia.key];
    if (src && typeof src === "object") {
      base[dia.key] = {
        active: typeof src.active === "boolean" ? src.active : base[dia.key].active,
        from: src.from || (src.active ? base[dia.key].from : ""),
        to: src.to || (src.active ? base[dia.key].to : ""),
      };
    }
  }

  return base;
}

function formatHorariosResumen(horarios) {
  if (!horarios || typeof horarios !== "object") return "Lunes a viernes de 09:00 a 17:00";

  const activos = DIAS.filter((d) => horarios[d.key]?.active);
  if (!activos.length) return "Sin horarios cargados";

  return activos
    .map((d) => {
      const item = horarios[d.key];
      return `${d.label}: ${item.from} a ${item.to}`;
    })
    .join(" · ");
}

function getModalidadLabel(value) {
  return MODALIDADES.find((m) => m.value === value)?.label || value;
}

function getCoberturaLabel(value) {
  return COBERTURAS.find((c) => c.value === value)?.label || value;
}

const emptyForm = {
  id: "",
  name: "",
  tipo: "",
  modalidad: MODALIDADES[0].value,
  ciudad: "",
  cobertura: COBERTURAS[0].value,
  sessionDuration: 60,
  email: "",
  whatsapp: "",
  avatar: "",
  bio: "",
  horarios: buildDefaultHorarios(),
};

export default function Especialistas() {
  const { token, user } = useAuth();

  const [especialidades, setEspecialidades] = useState([]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [apiResponse, setApiResponse] = useState(null);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = user?.rol || user?.role || "guest";
  const isEditing = Boolean(form.id);

  const canCreate = role === "admin";
  const canEditOrDelete = role === "admin";

  useEffect(() => {
    loadInitialData();
  }, []);

  function showNotice(message, type = "error") {
    setNotice({ message, type });

    window.clearTimeout(showNotice._timeout);
    showNotice._timeout = window.setTimeout(() => {
      setNotice(null);
    }, 3200);
  }

  async function loadInitialData() {
    try {
      setLoading(true);

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

      setItems(Array.isArray(especialistas) ? especialistas : []);
      setEspecialidades(Array.isArray(especs) ? especs : []);
    } catch (err) {
      console.error(err);
      showNotice("No se pudieron cargar los especialistas.");
    } finally {
      setLoading(false);
    }
  }

  async function reload() {
    try {
      const res = await getEspecialistas();
      const list = res.data?.data || res.data?.especialistas || res.data || [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      showNotice("No se pudo actualizar el listado.");
    }
  }

  function resetForm() {
    setForm({
      ...emptyForm,
      modalidad: MODALIDADES[0].value,
      cobertura: COBERTURAS[0].value,
      sessionDuration: 60,
      horarios: buildDefaultHorarios(),
    });
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "sessionDuration" ? Number(value) : value,
    }));
  }

  function handleSearchChange(e) {
    setSearch(e.target.value);
  }

  function handleHorarioToggle(diaKey) {
    setForm((prev) => {
      const current = prev.horarios[diaKey];
      const nextActive = !current.active;

      return {
        ...prev,
        horarios: {
          ...prev.horarios,
          [diaKey]: {
            active: nextActive,
            from: nextActive ? current.from || "09:00" : "",
            to: nextActive ? current.to || "17:00" : "",
          },
        },
      };
    });
  }

  function handleHorarioChange(diaKey, field, value) {
    setForm((prev) => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [diaKey]: {
          ...prev.horarios[diaKey],
          [field]: value,
        },
      },
    }));
  }

  const tipoOptions = useMemo(() => {
    return [
      ...TIPOS_BASE,
      ...especialidades
        .map((e) => e.name || e.nombre)
        .filter(Boolean)
        .filter((t) => !TIPOS_BASE.includes(t)),
    ];
  }, [especialidades]);

  function validateHorarios() {
    const activos = DIAS.filter((d) => form.horarios[d.key]?.active);

    if (!activos.length) {
      return "Seleccioná al menos un día de atención.";
    }

    for (const dia of activos) {
      const item = form.horarios[dia.key];

      if (!item.from || !item.to) {
        return `Completá desde y hasta para ${dia.label}.`;
      }

      if (item.from >= item.to) {
        return `En ${dia.label}, el horario de fin debe ser posterior al de inicio.`;
      }
    }

    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isEditing && !canCreate) {
      showNotice("Solo el admin puede crear nuevos especialistas.");
      return;
    }

    if (!form.name.trim()) {
      showNotice("El nombre es obligatorio.");
      return;
    }

    if (!form.tipo) {
      showNotice("Seleccioná una especialidad profesional.");
      return;
    }

    if (!form.ciudad) {
      showNotice("Seleccioná una ciudad.");
      return;
    }

    const horariosError = validateHorarios();
    if (horariosError) {
      showNotice(horariosError);
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.tipo,
      modality: form.modalidad,
      city: form.ciudad,
      coverage: form.cobertura,
      sessionDuration: Number(form.sessionDuration),
      bio: form.bio.trim(),
      avatar: form.avatar.trim(),
      contact: {
        email: form.email.trim(),
        whatsapp: form.whatsapp.trim(),
      },
      horarios: form.horarios,
    };

    try {
      let res;

      if (isEditing) {
        if (!canEditOrDelete) {
          showNotice("No tenés permisos para editar especialistas.");
          return;
        }

        res = await updateEspecialista(form.id, payload, token);
        showNotice("Especialista actualizado correctamente.", "success");
      } else {
        res = await createEspecialista(payload, token);
        showNotice("Especialista creado correctamente.", "success");
      }

      setApiResponse(res.data);
      resetForm();
      await reload();
    } catch (err) {
      console.error(err);
      setApiResponse(err.response?.data || err);
      showNotice(
        err.response?.data?.message || "Error al guardar especialista."
      );
    }
  }

  function handleEdit(esp) {
    if (!canEditOrDelete) {
      showNotice("No tenés permisos para editar especialistas.");
      return;
    }

    setForm({
      id: esp._id,
      name: esp.name || "",
      tipo: esp.type || "",
      modalidad: esp.modality || MODALIDADES[0].value,
      ciudad: esp.city || "",
      cobertura: esp.coverage || COBERTURAS[0].value,
      sessionDuration: Number(esp.sessionDuration) || 60,
      email: esp.contact?.email || "",
      whatsapp: esp.contact?.whatsapp || "",
      avatar: esp.avatar || "",
      bio: esp.bio || "",
      horarios: normalizeHorarios(esp.horarios),
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    resetForm();
    showNotice("Edición cancelada.", "success");
  }

  async function handleDelete(id) {
    if (!canEditOrDelete) {
      showNotice("No tenés permisos para borrar especialistas.");
      return;
    }

    const confirmed = window.confirm("¿Eliminar este especialista?");
    if (!confirmed) return;

    try {
      const res = await deleteEspecialista(id, token);
      setApiResponse(res.data);
      showNotice("Especialista eliminado correctamente.", "success");
      await reload();
    } catch (err) {
      console.error(err);
      setApiResponse(err.response?.data || err);
      showNotice(err.response?.data?.message || "No se pudo eliminar.");
    }
  }

  function getAvatarUrl(avatar) {
    if (!avatar) return "";
    if (avatar.startsWith("http")) return avatar;

    const base = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace("/api", "");

    return `${base}${avatar}`;
  }

  const filteredItems = items.filter((e) => {
    const text = `${e.name || ""} ${e.type || ""} ${e.city || ""}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <main className="app-shell">
      <section className="panel-page">
        <h1 className="page-title">Especialistas</h1>

        <p className="page-intro">
          Este panel usa el mismo backend que el listado público.
        </p>

        {notice && (
          <div className={`nura-notice ${notice.type}`}>
            {notice.message}
          </div>
        )}

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

              <select
                className="input"
                name="sessionDuration"
                value={form.sessionDuration}
                onChange={handleChange}
              >
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={50}>50 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
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

            <div className="schedule-block">
              <h3 className="schedule-title">Horarios de atención</h3>

              <div className="schedule-grid">
                {DIAS.map((dia) => {
                  const item = form.horarios[dia.key];

                  return (
                    <div className="schedule-row" key={dia.key}>
                      <label className="schedule-toggle">
                        <input
                          type="checkbox"
                          checked={item.active}
                          onChange={() => handleHorarioToggle(dia.key)}
                        />
                        <span>{dia.label}</span>
                      </label>

                      <input
                        className="input"
                        type="time"
                        value={item.from}
                        disabled={!item.active}
                        onChange={(e) =>
                          handleHorarioChange(dia.key, "from", e.target.value)
                        }
                      />

                      <input
                        className="input"
                        type="time"
                        value={item.to}
                        disabled={!item.active}
                        onChange={(e) =>
                          handleHorarioChange(dia.key, "to", e.target.value)
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

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

        {loading ? (
          <p className="muted">Cargando especialistas...</p>
        ) : (
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
                      <div
                        className="avatar-circle"
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
                          fontSize: "1.1rem",
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
                            <span className="chip">
                              {getModalidadLabel(e.modality)}
                            </span>
                          )}
                          {e.coverage && (
                            <span className="chip">
                              {getCoberturaLabel(e.coverage)}
                            </span>
                          )}
                        </div>

                        <p className="card-sub">
                          {e.city || "Ciudad no especificada"}
                        </p>

                        <p className="card-sub">
                          Duración de sesión: {e.sessionDuration || 60} min
                        </p>

                        <p className="card-sub">
                          {formatHorariosResumen(e.horarios)}
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
                          type="button"
                          className="btn-edit"
                          onClick={() => handleEdit(e)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => handleDelete(e._id)}
                        >
                          Borrar
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
        )}

        {apiResponse && (
          <pre className="api-response">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        )}
      </section>
    </main>
  );
}