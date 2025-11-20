// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppLayout from "./ui/AppLayout.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Especialidades from "./pages/Especialidades.jsx";
import Especialistas from "./pages/Especialistas.jsx";
import ProtectedRoute from "./ui/ProtectedRoute.jsx";
import Clientes from "./pages/Clientes.jsx";

import "./ui/AppLayout.css";
import "./styles.css"; // si lo usás

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
          <Route path="/clientes" element={<Clientes />} />
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route
              path="especialidades"
              element={
                <ProtectedRoute>
                  <Especialidades />
                </ProtectedRoute>
              }
            />
            <Route
              path="/clientes"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <Clientes />
                </ProtectedRoute>
              }
            />

            <Route
              path="especialistas"
              element={
                <ProtectedRoute>
                  <Especialistas />
                </ProtectedRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
