const PESTAÑAS = [
  { id: 'convocatoria', icono: '⚽', etiqueta: 'Convocatoria' },
  { id: 'clasificacion', icono: '🏆', etiqueta: 'Clasificación' },
  { id: 'admin', icono: '🔧', etiqueta: 'Admin' },
]

export default function BottomNav({ pantalla, onCambiar }) {
  return (
    <nav className="nav-inferior">
      {PESTAÑAS.map((p) => (
        <button
          key={p.id}
          className={pantalla === p.id ? 'activo' : ''}
          onClick={() => onCambiar(p.id)}
        >
          <span className="icono">{p.icono}</span>
          {p.etiqueta}
        </button>
      ))}
    </nav>
  )
}
