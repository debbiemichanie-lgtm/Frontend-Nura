import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getEspecialistas,
  getEspecialidades,
  createEspecialista,
  updateEspecialista,
  deleteEspecialista,
  crearBloqueoAgenda,
  listarBloqueosAgenda,
  eliminarBloqueoAgenda,
  crearTurnoManual,
  getTurnosByEspecialista,
  cancelarTurno,
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
  { key: "lunes", label: "Lunes", jsDay: 1 },
  { key: "martes", label: "Martes", jsDay: 2 },
  { key: "miercoles", label: "Miércoles", jsDay: 3 },
  { key: "jueves", label: "Jueves", jsDay: 4 },
  { key: "viernes", label: "Viernes", jsDay: 5 },
  { key: "sabado", label: "Sábado", jsDay: 6 },
  { key: "domingo", label: "Domingo", jsDay: 0 },
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
        active:
          typeof src.active === "boolean" ? src.active : base[dia.key].active,
        from: src.from || (src.active ? base[dia.key].from : ""),
        to: src.to || (src.active ? base[dia.key].to : ""),
      };
    }
  }

  return base;
}

function formatHorariosResumen(horarios) {
  if (!horarios || typeof horarios !== "object") {
    return "Lunes a viernes de 09:00 a 17:00";
  }

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

function formatDateTimeLocal(value) {
  try {
    return new Date(value).toLocaleString("es-AR");
  } catch {
    return value;
  }
}

function toLocalDateInputValue(date = new Date()) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function extractLocalDate(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const d = new Date(value);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function sameDay(dateA, dateB) {
  return extractLocalDate(dateA) === extractLocalDate(dateB);
}

function formatShortDate(dateStr) {
  const [yyyy, mm, dd] = dateStr.split("-").map(Number);
  const d = new Date(yyyy, mm - 1, dd);

  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function toLocalDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return "";

  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
  return localDate.toISOString();
}

function formatOnlyTime(dateStr) {
  try {
    return new Date(dateStr).toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return "";
  }
}

function addDays(baseDate, days) {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + days);
  return d;
}


function formatRangeShort(start, end) {
  return `${formatOnlyTime(start)} - ${formatOnlyTime(end)}`;
}

function hhmmToMinutes(value) {
  if (!value) return 0;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHHMM(value) {
  const h = Math.floor(value / 60);
  const m = value % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getAvailableAgendaDays(horarios, count = 14) {
  const normalized = normalizeHorarios(horarios);
  const result = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 40 && result.length < count; i++) {
    const d = addDays(today, i);
    const jsDay = d.getDay();
    const dia = DIAS.find((item) => item.jsDay === jsDay);
    if (!dia) continue;

    const schedule = normalized[dia.key];
    if (!schedule?.active) continue;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    result.push({
      key: dia.key,
      label: dia.label,
      date: `${yyyy}-${mm}-${dd}`,
      short: formatShortDate(`${yyyy}-${mm}-${dd}`),
      from: schedule.from || "",
      to: schedule.to || "",
    });
  }

  return result;
}

function buildSlotsForDay(dayInfo, sessionDuration, bloqueos = []) {
  if (!dayInfo?.from || !dayInfo?.to) return [];

  const startMin = hhmmToMinutes(dayInfo.from);
  const endMin = hhmmToMinutes(dayInfo.to);
  const step = Number(sessionDuration) || 60;

  const slots = [];

  for (let current = startMin; current + step <= endMin; current += step) {
    const slotStart = minutesToHHMM(current);
    const slotEnd = minutesToHHMM(current + step);

    const ocupado = bloqueos.some((b) => {
      const blockStart = formatOnlyTime(b.start);
      const blockEnd = formatOnlyTime(b.end);
      return !(slotEnd <= blockStart || slotStart >= blockEnd);
    });

    slots.push({
      start: slotStart,
      end: slotEnd,
      ocupado,
    });
  }

  return slots;
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
  accessEmail: "",
  accessPassword: "",
  horarios: buildDefaultHorarios(),
};

const emptyAgendaForm = {
  date: toLocalDateInputValue(),
  selectedSlot: "",
  motivo: "Bloqueo manual",
  pacienteNombre: "",
  pacienteEmail: "",
  notes: "Cargado manualmente desde admin",
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

 const [agendaOpenId, setAgendaOpenId] = useState(null);
const [bloqueosByEspecialista, setBloqueosByEspecialista] = useState({});
const [agendaLoadingId, setAgendaLoadingId] = useState(null);
const [agendaFormByEspecialista, setAgendaFormByEspecialista] = useState({});
const [turnosByEspecialista, setTurnosByEspecialista] = useState({});
const [confirmDialog, setConfirmDialog] = useState({
  open: false,
  title: "",
  message: "",
  confirmText: "Confirmar",
  variant: "danger",
  onConfirm: null,
});
  const role = user?.rol || user?.role || "guest";
  const isEditing = Boolean(form.id);

  const canCreate = role === "admin";
  const canEditOrDelete = role === "admin";

  const especialistaAgenda = useMemo(
    () => items.find((e) => e._id === agendaOpenId) || null,
    [items, agendaOpenId]
  );

  const agendaDays = useMemo(
    () => getAvailableAgendaDays(especialistaAgenda?.horarios, 14),
    [especialistaAgenda]
  );

  const agendaForm = agendaOpenId
    ? agendaFormByEspecialista[agendaOpenId] || {
        ...emptyAgendaForm,
        date: agendaDays[0]?.date || emptyAgendaForm.date,
      }
    : emptyAgendaForm;

  const bloqueosAgenda = agendaOpenId
  ? bloqueosByEspecialista[agendaOpenId] || []
  : [];

const turnosAgenda = agendaOpenId
  ? turnosByEspecialista[agendaOpenId] || []
  : [];

const bloqueosDelDia = bloqueosAgenda.filter((b) =>
  sameDay(b.start, agendaForm.date)
);

const turnosDelDia = turnosAgenda.filter((t) =>
  sameDay(t.start, agendaForm.date) && t.status === "confirmed"
);

const ocupadosDelDia = [...bloqueosDelDia, ...turnosDelDia];

const dayInfoSeleccionado =
  agendaDays.find((d) => d.date === agendaForm.date) || agendaDays[0] || null;

const slotsDelDia = buildSlotsForDay(
  dayInfoSeleccionado,
  especialistaAgenda?.sessionDuration || 60,
  ocupadosDelDia
);

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

  function openConfirm({
  title,
  message,
  confirmText = "Eliminar",
  variant = "danger",
  onConfirm,
}) {
  setConfirmDialog({
    open: true,
    title,
    message,
    confirmText,
    variant,
    onConfirm,
  });
}

function closeConfirm() {
  setConfirmDialog({
    open: false,
    title: "",
    message: "",
    confirmText: "Confirmar",
    variant: "danger",
    onConfirm: null,
  });
}

async function handleConfirmAction() {
  if (typeof confirmDialog.onConfirm === "function") {
    await confirmDialog.onConfirm();
  }
  closeConfirm();
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

  function updateAgendaForm(especialistaId, field, value) {
    setAgendaFormByEspecialista((prev) => ({
      ...prev,
      [especialistaId]: {
        ...(prev[especialistaId] || emptyAgendaForm),
        [field]: value,
      },
    }));
  }

  function selectAgendaDay(especialistaId, day) {
    setAgendaFormByEspecialista((prev) => ({
      ...prev,
      [especialistaId]: {
        ...(prev[especialistaId] || emptyAgendaForm),
        date: day.date,
        selectedSlot: "",
      },
    }));
  }

  function selectSlot(especialistaId, slot) {
    if (slot.ocupado) return;

    setAgendaFormByEspecialista((prev) => ({
      ...prev,
      [especialistaId]: {
        ...(prev[especialistaId] || emptyAgendaForm),
        selectedSlot: `${slot.start}|${slot.end}`,
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

    if ((form.accessEmail && !form.accessPassword) || (!form.accessEmail && form.accessPassword)) {
  showNotice("Para crear acceso profesional tenés que completar email y contraseña.");
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
  access: form.accessEmail && form.accessPassword
    ? {
        email: form.accessEmail.trim(),
        password: form.accessPassword.trim(),
      }
    : undefined,
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
  accessEmail: "",
  accessPassword: "",
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

  openConfirm({
    title: "Eliminar especialista",
    message: "¿Seguro que querés eliminar este especialista?",
    confirmText: "Eliminar",
    variant: "danger",
    onConfirm: async () => {
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
    },
  });
}

async function handleOpenAgenda(especialistaId) {
  try {
    if (agendaOpenId === especialistaId) {
      setAgendaOpenId(null);
      return;
    }

    setAgendaLoadingId(especialistaId);
    setAgendaOpenId(especialistaId);

    const especialista = items.find((item) => item._id === especialistaId);
    const availableDays = getAvailableAgendaDays(especialista?.horarios, 14);

    if (!agendaFormByEspecialista[especialistaId]) {
      setAgendaFormByEspecialista((prev) => ({
        ...prev,
        [especialistaId]: {
          ...emptyAgendaForm,
          date: availableDays[0]?.date || emptyAgendaForm.date,
          selectedSlot: "",
        },
      }));
    }

    const [bloqRes, turnosRes] = await Promise.all([
      listarBloqueosAgenda(especialistaId, token),
      getTurnosByEspecialista(especialistaId, token),
    ]);

    const bloqueos = bloqRes.data?.data || bloqRes.data || [];
    const turnos = turnosRes.data?.data || turnosRes.data || [];

    setBloqueosByEspecialista((prev) => ({
      ...prev,
      [especialistaId]: Array.isArray(bloqueos) ? bloqueos : [],
    }));

    setTurnosByEspecialista((prev) => ({
      ...prev,
      [especialistaId]: Array.isArray(turnos) ? turnos : [],
    }));
  } catch (err) {
    console.error(err);
    showNotice("No se pudo cargar la agenda.");
  } finally {
    setAgendaLoadingId(null);
  }
}

async function handleCrearBloqueo(especialistaId) {
  const currentForm = agendaFormByEspecialista[especialistaId] || emptyAgendaForm;

  if (!currentForm.selectedSlot) {
    showNotice("Seleccioná un horario en el calendario.");
    return;
  }

  const [startTime, endTime] = currentForm.selectedSlot.split("|");
  const start = toLocalDateTime(currentForm.date, startTime);
  const end = toLocalDateTime(currentForm.date, endTime);

  try {
    await crearBloqueoAgenda(
      especialistaId,
      {
        start,
        end,
        motivo: currentForm.motivo || "Bloqueo manual",
        tipo: "bloqueo",
      },
      token
    );

    const [bloqRes, turnosRes] = await Promise.all([
      listarBloqueosAgenda(especialistaId, token),
      getTurnosByEspecialista(especialistaId, token),
    ]);

    const bloqueos = bloqRes.data?.data || bloqRes.data || [];
    const turnos = turnosRes.data?.data || turnosRes.data || [];

    setBloqueosByEspecialista((prev) => ({
      ...prev,
      [especialistaId]: Array.isArray(bloqueos) ? bloqueos : [],
    }));

    setTurnosByEspecialista((prev) => ({
      ...prev,
      [especialistaId]: Array.isArray(turnos) ? turnos : [],
    }));

    updateAgendaForm(especialistaId, "selectedSlot", "");
    showNotice("Bloqueo creado correctamente.", "success");
  } catch (err) {
    console.error(err);
    showNotice(err.response?.data?.message || "No se pudo crear el bloqueo.");
  }
}

async function handleCrearTurnoManual(especialistaId) {
  const currentForm = agendaFormByEspecialista[especialistaId] || emptyAgendaForm;

  if (!currentForm.selectedSlot) {
    showNotice("Seleccioná un horario en el calendario.");
    return;
  }

  const [startTime, endTime] = currentForm.selectedSlot.split("|");
  const start = toLocalDateTime(currentForm.date, startTime);
  const end = toLocalDateTime(currentForm.date, endTime);

  try {
    await crearTurnoManual(
      especialistaId,
      {
        start,
        end,
        pacienteNombre: currentForm.pacienteNombre || "Turno manual",
        pacienteEmail: currentForm.pacienteEmail || "",
        notes: currentForm.notes || "Cargado manualmente desde admin",
      },
      token
    );

    const [bloqRes, turnosRes] = await Promise.all([
      listarBloqueosAgenda(especialistaId, token),
      getTurnosByEspecialista(especialistaId, token),
    ]);

    const bloqueos = bloqRes.data?.data || bloqRes.data || [];
    const turnos = turnosRes.data?.data || turnosRes.data || [];

    setBloqueosByEspecialista((prev) => ({
      ...prev,
      [especialistaId]: Array.isArray(bloqueos) ? bloqueos : [],
    }));

    setTurnosByEspecialista((prev) => ({
      ...prev,
      [especialistaId]: Array.isArray(turnos) ? turnos : [],
    }));

    setAgendaFormByEspecialista((prev) => ({
      ...prev,
      [especialistaId]: {
        ...(prev[especialistaId] || emptyAgendaForm),
        selectedSlot: "",
        pacienteNombre: "",
        pacienteEmail: "",
        notes: "Cargado manualmente desde admin",
      },
    }));

    showNotice("Turno manual creado correctamente.", "success");
  } catch (err) {
    console.error(err);
    showNotice(
      err.response?.data?.message || "No se pudo crear el turno manual."
    );
  }
}

function handleEliminarBloqueo(especialistaId, bloqueoId) {
  openConfirm({
    title: "Eliminar bloqueo",
    message: "¿Querés eliminar este bloqueo?",
    confirmText: "Eliminar bloqueo",
    variant: "danger",
    onConfirm: async () => {
      try {
        await eliminarBloqueoAgenda(especialistaId, bloqueoId, token);
        showNotice("Bloqueo eliminado.", "success");

        setBloqueosByEspecialista((prev) => ({
          ...prev,
          [especialistaId]: (prev[especialistaId] || []).filter(
            (b) => b._id !== bloqueoId
          ),
        }));
      } catch (err) {
        console.error(err);
        showNotice(
          err.response?.data?.message || "No se pudo eliminar el bloqueo."
        );
      }
    },
  });
}


function handleCancelarTurnoManual(especialistaId, turnoId) {
  openConfirm({
    title: "Cancelar turno",
    message: "¿Querés cancelar este turno manual?",
    confirmText: "Cancelar turno",
    variant: "danger",
    onConfirm: async () => {
      try {
        await cancelarTurno(turnoId, token);

        const [bloqRes, turnosRes] = await Promise.all([
          listarBloqueosAgenda(especialistaId, token),
          getTurnosByEspecialista(especialistaId, token),
        ]);

        const bloqueos = bloqRes.data?.data || bloqRes.data || [];
        const turnos = turnosRes.data?.data || turnosRes.data || [];

        setBloqueosByEspecialista((prev) => ({
          ...prev,
          [especialistaId]: Array.isArray(bloqueos) ? bloqueos : [],
        }));

        setTurnosByEspecialista((prev) => ({
          ...prev,
          [especialistaId]: Array.isArray(turnos) ? turnos : [],
        }));

        showNotice("Turno cancelado correctamente.", "success");
      } catch (err) {
        console.error(err);
        showNotice(
          err.response?.data?.message || "No se pudo cancelar el turno."
        );
      }
    },
  });
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

              <input
                className="input"
                type="email"
                name="accessEmail"
                value={form.accessEmail}
                onChange={handleChange}
                placeholder="Email de acceso profesional"
              />

              <input
                className="input"
                type="password"
                name="accessPassword"
                value={form.accessPassword}
                onChange={handleChange}
                placeholder="Contraseña inicial del profesional"
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
              <button className="btn-primary2" type="submit">
                {isEditing ? "Guardar" : "Crear especialista"}
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
          <>
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

                          <button
                            type="button"
                            className="btn-edit"
                            onClick={() => handleOpenAgenda(e._id)}
                          >
                            {agendaOpenId === e._id ? "Cerrar agenda" : "Ver agenda"}
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

           {agendaOpenId && especialistaAgenda && (
  <div className="agenda-modal-backdrop" onClick={() => setAgendaOpenId(null)}>
    <section
      className="agenda-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="agenda-header">
        <div>
          <h3 className="agenda-title">
            Agenda de {especialistaAgenda.name}
          </h3>
          <p className="agenda-subtitle">
            {especialistaAgenda.type} · {especialistaAgenda.city}
          </p>
        </div>

        <button
          type="button"
          className="agenda-close"
          onClick={() => setAgendaOpenId(null)}
        >
          ×
        </button>
      </div>

      <div className="agenda-days">
        {agendaDays.map((day) => (
          <button
            key={day.date}
            type="button"
            className={`agenda-day-card ${
              agendaForm.date === day.date ? "active" : ""
            }`}
            onClick={() => selectAgendaDay(agendaOpenId, day)}
          >
            <span className="agenda-day-label">{day.label}</span>
            <strong className="agenda-day-short">{day.short}</strong>
            <small className="agenda-day-hours">
              {day.from} a {day.to}
            </small>
          </button>
        ))}
      </div>

      <div className="agenda-body">
        <div className="agenda-slots-column">
          <h4 className="agenda-section-title">Horarios</h4>

          {agendaLoadingId === agendaOpenId ? (
            <p className="muted">Cargando agenda...</p>
          ) : (
            <div className="agenda-slots-grid">
              {slotsDelDia.length ? (
                slotsDelDia.map((slot) => {
                  const selected =
                    agendaForm.selectedSlot === `${slot.start}|${slot.end}`;

                  return (
                    <button
                      key={`${slot.start}-${slot.end}`}
                      type="button"
                      className={`agenda-slot ${
                        slot.ocupado ? "occupied" : ""
                      } ${selected ? "selected" : ""}`}
                      disabled={slot.ocupado}
                      onClick={() => selectSlot(agendaOpenId, slot)}
                    >
                      <span>{slot.start}</span>
                      <small>{slot.end}</small>
                    </button>
                  );
                })
              ) : (
                <p className="muted">
                  No hay horarios configurados para este día.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="agenda-form-column">
          <h4 className="agenda-section-title">Acción sobre horario</h4>

          <div className="agenda-summary-box">
            <p>
              <strong>Día:</strong>{" "}
              {agendaDays.find((d) => d.date === agendaForm.date)?.short ||
                agendaForm.date}
            </p>
            <p>
  <strong>Slot:</strong>{" "}
  {agendaForm.selectedSlot
    ? agendaForm.selectedSlot.replace("|", " a ")
    : "Ninguno seleccionado"}
</p>
          </div>

          <input
            className="input"
            placeholder="Motivo del bloqueo"
            value={agendaForm.motivo}
            onChange={(ev) =>
              updateAgendaForm(agendaOpenId, "motivo", ev.target.value)
            }
          />

          <input
            className="input"
            placeholder="Nombre del paciente"
            value={agendaForm.pacienteNombre}
            onChange={(ev) =>
              updateAgendaForm(
                agendaOpenId,
                "pacienteNombre",
                ev.target.value
              )
            }
          />

          <input
            className="input"
            placeholder="Email del paciente"
            value={agendaForm.pacienteEmail}
            onChange={(ev) =>
              updateAgendaForm(
                agendaOpenId,
                "pacienteEmail",
                ev.target.value
              )
            }
          />

          <textarea
            className="textarea"
            placeholder="Notas"
            value={agendaForm.notes}
            onChange={(ev) =>
              updateAgendaForm(agendaOpenId, "notes", ev.target.value)
            }
          />

          <div className="agenda-actions">
            <button
              type="button"
              className="btn-edit1"
              onClick={() => handleCrearBloqueo(agendaOpenId)}
            >
              Bloquear slot
            </button>

            <button
              type="button"
              className="btn-primary1"
              onClick={() => handleCrearTurnoManual(agendaOpenId)}
            >
              Crear turno manual
            </button>
          </div>
        </div>
        <div className="agenda-list-column">
          <h4 className="agenda-section-title">
            Ocupados del día seleccionado
          </h4>

          {ocupadosDelDia.length === 0 ? (
            <p className="muted">No hay horarios ocupados para este día.</p>
          ) : (
            <div className="agenda-list">
              {ocupadosDelDia.map((item) => {
                const esTurno =
                  !!item.pacienteNombre || item.source === "nura";

                return (
                  <div key={item._id} className="agenda-list-item">
                    <div>
                      <strong>
                        {esTurno
                          ? item.pacienteNombre || "Turno manual"
                          : item.motivo || "Bloqueo"}
                      </strong>
                      <p>{formatRangeShort(item.start, item.end)}</p>
                    </div>

                  {esTurno ? (
  <button
    type="button"
    className="btn-delete"
    onClick={() => handleCancelarTurnoManual(agendaOpenId, item._id)}
  >
    Cancelar turno
  </button>
) : (
  <button
    type="button"
    className="btn-delete"
    onClick={() => handleEliminarBloqueo(agendaOpenId, item._id)}
  >
    Eliminar
  </button>
)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  </div>
)}
          </>
        )}

        {apiResponse && (
          <pre className="api-response">
            {JSON.stringify(apiResponse, null, 2)}
          </pre>
        )}
      </section>
      {confirmDialog.open && (
  <div className="confirm-backdrop" onClick={closeConfirm}>
    <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
      <h3 className="confirm-title">{confirmDialog.title}</h3>
      <p className="confirm-message">{confirmDialog.message}</p>

      <div className="confirm-actions">
        <button
          type="button"
          className="btn-ghost"
          onClick={closeConfirm}
        >
          Cancelar
        </button>

        <button
          type="button"
          className={`confirm-btn ${confirmDialog.variant}`}
          onClick={handleConfirmAction}
        >
          {confirmDialog.confirmText}
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}