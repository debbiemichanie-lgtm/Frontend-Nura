// src/ui/LogoutButton.jsx
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function LogoutButton() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const dlgRef = useRef(null);

  // Abrir y cerrar el <dialog>
  useEffect(() => {
    const dlg = dlgRef.current;
    if (!dlg) return;
    if (open) dlg.showModal();
    else dlg.close();
  }, [open]);

  const handleOpen = () => setOpen(true);
  const handleCancel = () => setOpen(false);
  const handleConfirm = () => {
    logout(); // limpia contexto + localStorage
    setOpen(false);
  };

  return (
    <>
      {/* Botón visible para cerrar sesión */}
      <button className="btn plum" onClick={handleOpen}>
        Logout
      </button>

      {/* Modal igual al backend */}
      <dialog ref={dlgRef} className="dlg">
        <div className="dialog-body">
          <h3 className="dialog-title">¿Cerrar sesión?</h3>
          <p>¿Seguro que querés cerrar sesión?</p>
          <div className="dialog-actions">
            <button
              type="button"
              className="btn outline-plum"
              onClick={handleCancel}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn plum"
              onClick={handleConfirm}
            >
              Sí, cerrar sesión
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
