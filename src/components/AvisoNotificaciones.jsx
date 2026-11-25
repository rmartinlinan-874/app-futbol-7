import { useEffect, useState } from 'react'
import { avisosDisponibles, activarAvisos, renovarAvisosEnSilencio } from '../lib/notificaciones'

const CLAVE_DESCARTADO = 'apppena_avisos_descartado'

export default function AvisoNotificaciones({ peñista }) {
  const [disponible, setDisponible] = useState(false)
  // Clave por peñista: en el mismo dispositivo se puede cambiar de peñista
  // (ver TopBar > Cambiar), y descartar el aviso siendo uno no debe ocultarlo
  // para los demás.
  const [descartado, setDescartado] = useState(
    () => localStorage.getItem(`${CLAVE_DESCARTADO}_${peñista.id}`) === '1',
  )
  const [activando, setActivando] = useState(false)
  // El permiso de notificaciones del navegador es por dispositivo, no por
  // peñista: si ya está concedido pero el token guardado es el de otro
  // peñista (o nunca se guardó para este), hay que volver a mostrar el
  // aviso y a activar, aunque el navegador ya diga "granted".
  const [activadoLocal, setActivadoLocal] = useState(false)
  // Mientras se intenta renovar el token en silencio no se enseña el aviso,
  // para que no "parpadee" a quien ya tiene el permiso concedido.
  const [renovando, setRenovando] = useState(true)
  const activado = activadoLocal
  const [error, setError] = useState(false)

  useEffect(() => {
    avisosDisponibles().then(setDisponible)
  }, [])

  // Al abrir la app (o al cambiar de peñista en este móvil), si el permiso ya
  // está concedido se renueva el token sin preguntar nada. Solo si eso no
  // basta se muestra el aviso de "Activa los avisos".
  const tokensGuardados = peñista.fcmTokens ?? []
  useEffect(() => {
    let cancelado = false
    setRenovando(true)
    renovarAvisosEnSilencio(peñista.id, tokensGuardados).then((ok) => {
      if (cancelado) return
      setActivadoLocal(ok)
      setRenovando(false)
    })
    return () => {
      cancelado = true
    }
    // Solo al montar o cambiar de peñista: si se reaccionara a cada cambio de
    // tokensGuardados, la propia escritura volvería a lanzar la renovación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peñista.id])

  if (!disponible || descartado || activado || renovando) return null

  async function activar() {
    setActivando(true)
    setError(false)
    try {
      const ok = await activarAvisos(peñista.id, tokensGuardados)
      if (ok) setActivadoLocal(true)
      else setError(true)
    } catch {
      setError(true)
    } finally {
      setActivando(false)
    }
  }

  function descartar() {
    setDescartado(true)
    localStorage.setItem(`${CLAVE_DESCARTADO}_${peñista.id}`, '1')
  }

  return (
    <section className="tarjeta" style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16 }}>🔔</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '0.85rem' }}>Activa los avisos</p>
          <p className="subtitulo" style={{ margin: 0, fontSize: '0.75rem' }}>
            Te avisamos el sábado cuando se abra la convocatoria, y cuando se registre el
            resultado del partido.
          </p>
        </div>
      </div>
      {error && (
        <p className="aviso ambar" style={{ marginTop: 8, fontSize: '0.78rem' }}>
          No se ha podido activar. Puede que hayas denegado el permiso de notificaciones.
        </p>
      )}
      <div className="fila-toggle" style={{ marginTop: 8 }}>
        <button
          className="boton boton-primario"
          style={{ padding: '8px 12px', fontSize: '0.82rem' }}
          disabled={activando}
          onClick={activar}
        >
          {activando ? 'Activando…' : 'Activar'}
        </button>
        <button
          className="boton boton-secundario"
          style={{ padding: '8px 12px', fontSize: '0.82rem' }}
          disabled={activando}
          onClick={descartar}
        >
          Ahora no
        </button>
      </div>
    </section>
  )
}
