// src/router/AuthRouter.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "../ui/AppLayout.jsx";
import Home from "../pages/Home.jsx";
import Login from "../pages/Login.jsx";
import Especialidades from "../pages/Especialidades.jsx";
import Especialistas from "../pages/Especialistas.jsx";
import ProtectedRoute from "../ui/ProtectedRoute.jsx";

export default function AuthRouter() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/especialidades"
            element={
              <ProtectedRoute>
                <Especialidades />
              </ProtectedRoute>
            }
          />

          <Route
            path="/especialistas"
            element={
              <ProtectedRoute>
                <Especialistas />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
