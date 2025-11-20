## 🟢 README para el **Frontend (React)** (`api/frontend/README.md`)

```md
# Nura – Panel de Especialistas en TCA (Frontend React)

**Alumnas:** Debbie Michanie, Chiara Rodo, Morena Castro y Tiara Albornos  
**Materia:** Aplicaciones Híbridas  
**Docente:** Jonathan Cruz  
**Comisión:** DWM4AP-0225

---

## 1. Descripción

Frontend en **React + Vite** que consume la API de Nura para:

- Listar especialistas en TCA con tarjetas estilo Nura.
- Filtrar, buscar y gestionar especialistas.
- ABM de **Especialidades** (panel separado).
- Login con roles:
  - **admin:** puede crear, editar y borrar especialistas y especialidades.
  - **client:** puede editar/borrar especialistas existentes (según consigna).
- Paneles con:
  - cards con avatar, chips de especialidad/modalidad/cobertura,
  - botones de email / WhatsApp,
  - botones redondos “Editar / Borrar”,
  - mensajes de confirmación mediante modales,
  - panel lateral de “Respuesta de la API” para ver la última llamada.

---

## 2. Tecnologías principales

- **React** (Vite)
- **React Router**
- **Context API** para Auth
- **Axios** para requests HTTP
- **CSS** propio (estética “Nura” unificada con el backend)

---

## 3. Requisitos

- Node.js 18+  
- npm  
- Backend corriendo en `http://localhost:5000` (o la URL que se configure en `.env`)

---

## 4. Estructura del frontend

Ubicación del proyecto React: `api/frontend/`

Estructura simplificada:

```txt
api/frontend/
  src/
    components/
      ApiPanel.jsx
      ConfirmModal.jsx
      ...
    context/
      AuthContext.jsx
    pages/
      Especialistas.jsx
      Especialidades.jsx
      Login.jsx (si aplica)
      ...
    services/
      api.js          # funciones axios → backend
    App.jsx
    main.jsx
  index.html
  vite.config.js
  package.json


##**.env Frontend:** 
VITE_API_URL=http://localhost:5000/api

## 1. Cómo levantar el proyecto

### 1.1. frontend 
cd frontend
npm install
npm run dev

http://localhost:5173