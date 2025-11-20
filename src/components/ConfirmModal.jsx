// src/components/ConfirmModal.jsx
import React from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({ open, message, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h2 className="modal-title">¿Confirmar acción?</h2>
        <p className="modal-message">{message}</p>

        <div className="modal-buttons">
          <button className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
