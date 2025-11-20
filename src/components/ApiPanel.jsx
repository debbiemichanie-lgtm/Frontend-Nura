// src/components/ApiPanel.jsx
export default function ApiPanel({ data, title = "Respuesta de la API" }) {
  if (!data) return null;

  // Si viene como string, intentamos prettificar
  const pretty =
    typeof data === "string"
      ? data
      : JSON.stringify(data, null, 2);

  return (
    <section className="api-panel" style={{marginTop: 16}}>
      <h3 style={{margin: 0, fontSize: "1rem"}}>{title}</h3>
      <pre
        style={{
          marginTop: 8,
          padding: 12,
          background: "#0f172a",
          color: "#e2e8f0",
          borderRadius: 8,
          overflow: "auto",
          maxHeight: 280,
          fontSize: 12,
        }}
      >
        {pretty}
      </pre>
    </section>
  );
}
