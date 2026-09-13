import { useState } from 'react'
import { altaPeñista, editarPeñista } from '../../lib/actions'

export default function AdminPeñistas({ peñistas, pin }) {
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [guardando, setGuardando] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [nombreEdicion, setNombreEdicion] = useState('')

  async function añadir(e) {
    e.preventDefault()
    const nombre = nombreNuevo.trim()
    if (!nombre) return
    setGuardando('nuevo')
    try {
      await altaPeñista(nombre, pin)
      setNombreNuevo('')
    } finally {
      setGuardando(null)
    }
  }

  async function guardarEdicion(id) {
    const nombre = nombreEdicion.trim()
    if (!nombre) return
    setGuardando(id)
    try {
      await editarPeñista(id, { nombre }, pin)
      setEditandoId(null)
    } finally {
      setGuardando(null)
    }
  }

  async function alternarActivo(p) {
    setGuardando(p.id)
    try {
      await editarPeñista(p.id, { activo: !p.activo }, pin)
    } finally {
      setGuardando(null)
    }
  }

  return (
    <section className="tarjeta">
      <h2 className="titulo-seccion">Peñistas</h2>
      <p className="subtitulo">Alta, baja y edición de nombres.</p>

      <form className="form-inline" style={{ marginTop: 10 }} onSubmit={añadir}>
        <input
          className="campo-texto"
          placeholder="Nombre del nuevo peñista"
          value={nombreNuevo}
          onChange={(e) => setNombreNuevo(e.target.value)}
        />
        <button className="boton boton-primario" disabled={guardando === 'nuevo' || !nombreNuevo.trim()}>
          Añadir
        </button>
      </form>

      <ul className="lista" style={{ marginTop: 12 }}>
        {peñistas.map((p) => (
          <li key={p.id} className="lista-item">
            {editandoId === p.id ? (
              <div className="form-inline" style={{ flex: 1 }}>
                <input
                  className="campo-texto"
                  value={nombreEdicion}
                  onChange={(e) => setNombreEdicion(e.target.value)}
                  autoFocus
                />
                <button className="boton boton-primario" onClick={() => guardarEdicion(p.id)} disabled={guardando === p.id}>
                  ✓
                </button>
                <button className="boton boton-secundario" onClick={() => setEditandoId(null)}>
                  ✕
                </button>
              </div>
            ) : (
              <>
                <div>
                  {p.nombre}
                  {!p.activo && <span className="etiqueta-pill espera" style={{ marginLeft: 8 }}>de baja</span>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="boton boton-secundario"
                    style={{ padding: '4px 8px' }}
                    onClick={() => {
                      setEditandoId(p.id)
                      setNombreEdicion(p.nombre)
                    }}
                  >
                    Editar
                  </button>
                  <button
                    className="boton boton-secundario"
                    style={{ padding: '4px 8px' }}
                    disabled={guardando === p.id}
                    onClick={() => alternarActivo(p)}
                  >
                    {p.activo ? 'Dar de baja' : 'Reactivar'}
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
