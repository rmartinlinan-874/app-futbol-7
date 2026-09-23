import { useEffect, useState } from 'react'
import { avisosDisponibles, activarAvisos } from '../lib/notificaciones'

const CLAVE_DESCARTADO = 'apppena_avisos_descartado'

export default function AvisoNotificaciones({ peñista }) {
  const [disponible, setDisponible] = useState(false)
  const [descartado, setDescartado] = useState(
    () => localStorage.getItem(CLAVE_DESCARTADO) === '1',
  )
  const [activando, setActivando] = useState(false)
  const [activado, setActivado] = useState(
    typeof Notification !== 'undefined' && Notification.permission === 'granted',
  )
  const [error, setError] = useState(false)

  useEffect(() => {
    avisosDisponibles().then(setDisponible)
  }, [])

  if (!disponible || descartado || activado) return null

  async function activar() {
    setActivando(true)
    setError(false)
    try {
      const ok = await activarAvisos(peñista.id)
      if (ok) setActivado(true)
      else setError(true)
    } catch {
      setError(true)
    } finally {
      setActivando(false)
    }
  }

  function descartar() {
    setDescartado(true)
    localStorage.setItem(CLAVE_DESCARTADO, '1')
  }

  return (
    <section className="tarjeta">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 22 }}>🔔</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Activa los avisos</p>
          <p className="subtitulo" style={{ margin: 0 }}>
            Te avisamos el sábado cuando se abra la convocatoria, y cuando se registre el
            resultado del partido.
          </p>
        </div>
      </div>
      {error && (
        <p className="aviso ambar" style={{ marginTop: 10 }}>
          No se ha podido activar. Puede que hayas denegado el permiso de notificaciones.
        </p>
      )}
      <div className="fila-toggle" style={{ marginTop: 10 }}>
        <button className="boton boton-primario" disabled={activando} onClick={activar}>
          {activando ? 'Activando…' : 'Activar'}
        </button>
        <button className="boton boton-secundario" disabled={activando} onClick={descartar}>
          Ahora no
        </button>
      </div>
    </section>
  )
}
