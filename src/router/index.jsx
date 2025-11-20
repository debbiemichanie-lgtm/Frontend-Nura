// src/router/index.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "../ui/AppLayout.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import Especialistas from "../pages/Especialistas.jsx";
import Especialidades from "../pages/Especialidades.jsx";
import { ProtectedRoute } from "../ui/ProtectedRoute.jsx";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/especialistas"
            element={
              <ProtectedRoute>
                <Especialistas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/especialidades"
            element={
              <ProtectedRoute>
                <Especialidades />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
