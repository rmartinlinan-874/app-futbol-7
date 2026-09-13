import { useState } from 'react'
import { cambiarConfig } from '../../lib/actions'

export default function AdminAjustes({ config, pin, onCambiarPin, onSalir }) {
  const [nombre, setNombre] = useState(config?.nombrePeña ?? '')
  const [guardandoNombre, setGuardandoNombre] = useState(false)

  const [pinActual, setPinActual] = useState('')
  const [pinNuevo, setPinNuevo] = useState('')
  const [errorPin, setErrorPin] = useState('')
  const [guardandoPin, setGuardandoPin] = useState(false)

  async function guardarNombre(e) {
    e.preventDefault()
    if (!nombre.trim()) return
    setGuardandoNombre(true)
    try {
      await cambiarConfig({ nombrePeña: nombre.trim() }, pin)
    } finally {
      setGuardandoNombre(false)
    }
  }

  async function cambiarPin(e) {
    e.preventDefault()
    setErrorPin('')
    if (pinActual !== config?.pin) {
      setErrorPin('El PIN actual no coincide')
      return
    }
    if (!/^\d{4,8}$/.test(pinNuevo)) {
      setErrorPin('El nuevo PIN debe tener entre 4 y 8 dígitos')
      return
    }
    setGuardandoPin(true)
    try {
      await cambiarConfig({ pin: pinNuevo }, pin)
      onCambiarPin(pinNuevo)
      setPinActual('')
      setPinNuevo('')
    } finally {
      setGuardandoPin(false)
    }
  }

  return (
    <>
      <section className="tarjeta">
        <h2 className="titulo-seccion">Nombre de la peña</h2>
        <form className="form-inline" style={{ marginTop: 10 }} onSubmit={guardarNombre}>
          <input className="campo-texto" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <button className="boton boton-primario" disabled={guardandoNombre || !nombre.trim()}>
            Guardar
          </button>
        </form>
      </section>

      <section className="tarjeta">
        <h2 className="titulo-seccion">Cambiar PIN de administrador</h2>
        <form style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }} onSubmit={cambiarPin}>
          <div>
            <label className="campo-label">PIN actual</label>
            <input
              className="campo-texto"
              type="password"
              inputMode="numeric"
              value={pinActual}
              onChange={(e) => setPinActual(e.target.value)}
            />
          </div>
          <div>
            <label className="campo-label">PIN nuevo (4-8 dígitos)</label>
            <input
              className="campo-texto"
              type="password"
              inputMode="numeric"
              value={pinNuevo}
              onChange={(e) => setPinNuevo(e.target.value)}
            />
          </div>
          {errorPin && <p style={{ color: 'var(--rojo)', margin: 0 }}>{errorPin}</p>}
          <button className="boton boton-primario" disabled={guardandoPin || !pinActual || !pinNuevo}>
            Cambiar PIN
          </button>
        </form>
      </section>

      <button className="boton boton-secundario boton-bloque" onClick={onSalir}>
        Cerrar sesión de admin
      </button>
    </>
  )
}
