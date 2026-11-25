import { useEffect, useState } from 'react'
import { lanzarConfeti } from '../lib/confeti'
import { activarSonidos, sonidosActivados, aplauso } from '../lib/sonidos'

const CLAVE_MODO = 'apppena_modo_willy'
const CLAVE_OBRAS = 'apppena_obras_willy_vistas'

function leer(clave) {
  try {
    return localStorage.getItem(clave) === '1'
  } catch {
    return false
  }
}

function guardar(clave, valor) {
  try {
    if (valor) localStorage.setItem(clave, '1')
    else localStorage.removeItem(clave)
  } catch {
    // sin almacenamiento local: se aplica solo mientras la app esté abierta
  }
}

/** Modo Willy: se guarda en cada móvil y pone la clase "modo-willy" en <body>. */
export function useModoWilly() {
  const [activo, setActivo] = useState(() => leer(CLAVE_MODO))
  useEffect(() => {
    document.body.classList.toggle('modo-willy', activo)
    guardar(CLAVE_MODO, activo)
  }, [activo])
  return [activo, setActivo]
}

/** Firma al pie de cada pantalla, con el botón del Modo Willy. */
export function FirmaWilly({ modoWilly, onCambiarModo }) {
  const [sonido, setSonido] = useState(sonidosActivados)
  function alternarSonido() {
    activarSonidos(!sonido)
    setSonido(!sonido)
    if (!sonido) aplauso()
  }
  function alternar() {
    if (!modoWilly) lanzarConfeti()
    onCambiarModo(!modoWilly)
  }
  return (
    <div className="firma-willy">
      <span>🎨 Decoración: Willy. Reclamaciones, a él.</span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="boton-sonido"
          onClick={alternarSonido}
          aria-label={sonido ? 'Quitar sonidos' : 'Poner sonidos'}
          title={sonido ? 'Quitar sonidos' : 'Poner sonidos'}
        >
          {sonido ? '🔊' : '🔇'}
        </button>
        <button className="boton-willy" onClick={alternar}>
          {modoWilly ? '😌 Modo normal' : '🦄 Modo Willy'}
        </button>
      </div>
    </div>
  )
}

/** Cartel que sale una sola vez en cada móvil tras el cambio de colores. */
export function CartelObras() {
  const [visto, setVisto] = useState(() => leer(CLAVE_OBRAS))
  if (visto) return null
  function cerrar() {
    guardar(CLAVE_OBRAS, true)
    setVisto(true)
  }
  return (
    <section className="tarjeta cartel-obras">
      <h2 className="titulo-seccion">🚧 Obras terminadas</h2>
      <p>
        Hemos pintado la app <strong>a petición de Willy</strong>, que decía que estaba muy sosa. Si no te gusta,
        las quejas se las das a él (en mano, a poder ser el lunes).
      </p>
      <p className="meta">Y si te parece poco, abajo del todo tienes el botón «Modo Willy». Bajo tu responsabilidad.</p>
      <button className="boton boton-primario" style={{ marginTop: 10 }} onClick={cerrar}>
        Vale, culpa de Willy
      </button>
    </section>
  )
}
