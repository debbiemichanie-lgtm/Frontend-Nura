import React from "react";

export default function Home() {
  return (
    <section>
      <h2>Inicio</h2>
      <p>
        Esta app lista profesionales especializados en Trastornos de la
        Conducta Alimentaria (TCA) y ofrece un panel de administración para
        cargar, editar y eliminar especialistas y especialidades.
      </p>
      <p>
        El listado público (hecho en HTML/JS) y este frontend en React
        consumen la misma API Node + Mongo.
      </p>
      <p>
        Iniciá sesión como admin para acceder a:
        <strong> Especialidades</strong> y <strong>Especialistas</strong>.
      </p>
    </section>
  );
}
