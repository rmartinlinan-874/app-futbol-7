import Avatar from './Avatar'

export default function Identificacion({ nombrePeña, peñistas, onElegir }) {
  const activos = peñistas.filter((p) => p.activo)

  return (
    <div className="identificacion">
      <div>
        <img
          src={`${import.meta.env.BASE_URL}icon-192.png`}
          alt=""
          aria-hidden="true"
          width="96"
          height="96"
          style={{ borderRadius: 22, marginBottom: 8 }}
        />
        <h1 style={{ margin: 0 }}>{nombrePeña}</h1>
        <p className="lema-patrocinio">Hueco disponible para patrocinador. Aceptamos pago en camisetas.</p>
        <p className="subtitulo" style={{ marginTop: 14 }}>
          ¿Quién eres?
        </p>
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
              <Avatar nombre={p.nombre} fotoURL={p.fotoURL} tamaño={32} />
              {p.nombre}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
