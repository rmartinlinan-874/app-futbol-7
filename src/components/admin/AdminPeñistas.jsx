import { useState } from 'react'
import { altaPeñista, editarPeñista, ajustarPuntos } from '../../lib/actions'
import { sumaAjustesManuales } from '../../lib/points'

export default function AdminPeñistas({ peñistas, pin }) {
  const [nombreNuevo, setNombreNuevo] = useState('')
  const [guardando, setGuardando] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [nombreEdicion, setNombreEdicion] = useState('')

  const [ajustandoId, setAjustandoId] = useState(null)
  const [puntosAjuste, setPuntosAjuste] = useState('')
  const [motivoAjuste, setMotivoAjuste] = useState('')

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

  function abrirAjuste(id) {
    setAjustandoId(id)
    setPuntosAjuste('')
    setMotivoAjuste('')
  }

  async function aplicarAjuste(id) {
    const puntos = Number(puntosAjuste.replace(',', '.'))
    if (!puntos || Number.isNaN(puntos)) return
    setGuardando(id)
    try {
      await ajustarPuntos(id, puntos, motivoAjuste.trim(), pin)
      setPuntosAjuste('')
      setMotivoAjuste('')
    } finally {
      setGuardando(null)
    }
  }

  return (
    <section className="tarjeta">
      <h2 className="titulo-seccion">Peñistas</h2>
      <p className="subtitulo">Alta, baja, edición de nombres y ajustes manuales de puntos.</p>

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
        {peñistas.map((p) => {
          const ajuste = sumaAjustesManuales(p)
          return (
            <li
              key={p.id}
              className="lista-item"
              style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                      {ajuste !== 0 && (
                        <span className="etiqueta-pill" style={{ marginLeft: 8 }}>
                          Ajuste: {ajuste > 0 ? `+${ajuste}` : ajuste}
                        </span>
                      )}
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
                        onClick={() => (ajustandoId === p.id ? setAjustandoId(null) : abrirAjuste(p.id))}
                      >
                        ± Puntos
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
              </div>

              {ajustandoId === p.id && (
                <div style={{ borderTop: '1px solid var(--borde)', paddingTop: 8 }}>
                  {(p.historialAjustes ?? []).length > 0 && (
                    <ul style={{ listStyle: 'none', margin: '0 0 8px', padding: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {p.historialAjustes.map((a, i) => (
                        <li key={i} className="meta">
                          {a.puntos > 0 ? `+${a.puntos}` : a.puntos} pts
                          {a.motivo ? ` — ${a.motivo}` : ''}
                          {a.fecha ? ` (${new Date(a.fecha).toLocaleDateString('es-ES')})` : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="form-inline">
                    <input
                      className="campo-texto"
                      style={{ maxWidth: 90 }}
                      placeholder="p.ej. 2 o -1"
                      inputMode="decimal"
                      value={puntosAjuste}
                      onChange={(e) => setPuntosAjuste(e.target.value)}
                    />
                    <input
                      className="campo-texto"
                      placeholder="Motivo (opcional)"
                      value={motivoAjuste}
                      onChange={(e) => setMotivoAjuste(e.target.value)}
                    />
                    <button
                      className="boton boton-primario"
                      disabled={guardando === p.id || !puntosAjuste.trim()}
                      onClick={() => aplicarAjuste(p.id)}
                    >
                      Aplicar
                    </button>
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
