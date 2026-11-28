import { useState } from 'react'
import CenaNavidad from './CenaNavidad'
import { CENA, cenaAbierta, nuevoIdExterno, resumenCena } from '../lib/cena'
import { FirmaWilly, useModoWilly } from './Willy'

// En cada móvil se recuerda con qué id se apuntó, para poder cambiarlo luego.
const CLAVE_ID = `apppena_cena_externo_${CENA.id}`

function leerId() {
  try {
    return localStorage.getItem(CLAVE_ID)
  } catch {
    return null
  }
}

function guardarId(id) {
  try {
    if (id) localStorage.setItem(CLAVE_ID, id)
    else localStorage.removeItem(CLAVE_ID)
  } catch {
    // sin almacenamiento local: podrá apuntarse, pero no cambiarlo luego desde este móvil
  }
}

/**
 * Pantalla del enlace de la cena (…/app-futbol-7/?cena) para antiguos
 * peñistas y amigos: solo la cena, sin nada del partido. Escriben su nombre y
 * eligen sus platos.
 */
export default function CenaExterna({ nombrePeña, respuestasCena, peñistas }) {
  const [modoWilly, setModoWilly] = useModoWilly()
  const [id, setId] = useState(() => {
    const guardado = leerId()
    if (guardado) return guardado
    const nuevo = nuevoIdExterno()
    guardarId(nuevo)
    return nuevo
  })
  const miRespuesta = respuestasCena.find((r) => r.id === id)
  const resumen = resumenCena(respuestasCena, peñistas)

  function apuntarAOtro() {
    const nuevo = nuevoIdExterno()
    guardarId(nuevo)
    setId(nuevo)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <header className="barra-superior">
        <h1>{nombrePeña}</h1>
      </header>
      <main className="contenido">
        <section className="tarjeta">
          <h2 className="titulo-seccion">👋 ¡Hola, veterano!</h2>
          <p className="subtitulo" style={{ margin: 0 }}>
            Aunque ya no juegues con nosotros, estás invitado a la cena de Navidad de la peña. Escribe tu
            nombre y dinos si vienes.
          </p>
        </section>

        {cenaAbierta() ? (
          <>
            <CenaNavidad key={id} peñista={{ id }} miRespuesta={miRespuesta} resumen={resumen} externo />
            {miRespuesta && (
              <button className="boton boton-secundario boton-bloque" onClick={apuntarAOtro}>
                ➕ Apuntar a otra persona desde este móvil
              </button>
            )}
          </>
        ) : (
          <section className="tarjeta">
            <p style={{ margin: 0 }}>La cena ya ha pasado. ¡Gracias a todos los que vinisteis! 🍻</p>
          </section>
        )}

        <p className="meta" style={{ textAlign: 'center' }}>
          ¿Sigues jugando en la peña? Entra por la app normal, que ahí también puedes apuntarte a la cena.
        </p>

        <FirmaWilly modoWilly={modoWilly} onCambiarModo={setModoWilly} />
      </main>
    </>
  )
}
