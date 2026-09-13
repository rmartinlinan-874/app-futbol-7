export default function Identificacion({ nombrePeña, peñistas, onElegir }) {
  const activos = peñistas.filter((p) => p.activo)

  return (
    <div className="identificacion">
      <div>
        <h1 style={{ margin: 0 }}>{nombrePeña}</h1>
        <p className="subtitulo">¿Quién eres?</p>
      </div>

      {activos.length === 0 ? (
        <p className="subtitulo">
          Todavía no hay peñistas dados de alta. Pide al administrador que os añada desde el panel
          de admin.
        </p>
      ) : (
        <div className="grid-nombres">
          {activos.map((p) => (
            <button key={p.id} onClick={() => onElegir(p)}>
              {p.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
