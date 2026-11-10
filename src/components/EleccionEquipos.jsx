import { useState } from 'react'
import { capitanesDeLaEleccion } from '../lib/encargados'
import { estadoEleccion, participantesDelPartido, NOMBRE_EQUIPO } from '../lib/eleccion'
import { elegirJugador, deshacerEleccion, ErrorEleccion } from '../lib/actions'
import { AFORO_MIN } from '../lib/aforo'
import Avatar from './Avatar'

function mensajeDeError(e) {
  if (e instanceof ErrorEleccion) return e.message
  if (e?.code === 'unavailable' || e?.code === 'failed-precondition' || !navigator.onLine) {
    return 'No se ha podido guardar: parece que no hay conexión. Inténtalo otra vez.'
  }
  return 'No se ha podido guardar. Inténtalo otra vez.'
}

function ColumnaEquipo({ letra, miembros, peñistas }) {
  return (
    <div className={`columna-equipo equipo-${letra}`}>
      <div className="cabecera-equipo">
        {NOMBRE_EQUIPO[letra]} <span className="contador-equipo">{miembros.length}</span>
      </div>
      <ul className="lista-equipo">
        {miembros.map((m) => {
          const p = peñistas.find((x) => x.id === m.id)
          return (
            <li key={m.id} className={m.sigueApuntado ? '' : 'desapuntado'}>
              <Avatar nombre={m.nombre} fotoURL={p?.fotoURL} tamaño={22} />
              <span className="nombre-equipo">
                {m.nombre}
                {m.esCapitan && ' (C)'}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default function EleccionEquipos({
  idConvocatoria,
  peñista,
  peñistas,
  convocatoria,
  aforo,
  eleccion,
  convocatorias,
  cargandoConvocatorias,
}) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const candidatosIds = aforo.peñistasJuegan.map((r) => r.id)
  const yaEmpezada = eleccion?.capitanes?.length === 2

  // Hasta que no haya el mínimo de jugadores no se sabe quién entra esa
  // semana, así que no se deciden capitanes (salvo que la elección ya
  // hubiera empezado: entonces se respetan los que quedaron fijados).
  if (!yaEmpezada && aforo.totalJugando < AFORO_MIN) {
    return (
      <section className="tarjeta">
        <h2 className="titulo-seccion">Elección de equipos</h2>
        <p className="subtitulo">
          Los capitanes se decidirán cuando haya al menos {AFORO_MIN} apuntados para jugar (faltan{' '}
          {AFORO_MIN - aforo.totalJugando}).
        </p>
      </section>
    )
  }

  // Los capitanes automáticos dependen de la clasificación: hasta que no
  // estén cargadas todas las convocatorias no se pueden calcular bien.
  if (!yaEmpezada && cargandoConvocatorias) return null

  const datosCapitanes = capitanesDeLaEleccion({
    eleccion,
    encargadosAdmin: convocatoria?.encargados,
    idConvocatoria,
    candidatosIds,
    convocatorias,
    peñistas,
  })
  if (!datosCapitanes) return null

  const { capitanes, fijados } = datosCapitanes
  const participantes = participantesDelPartido(aforo, peñistas)
  const elecciones = eleccion?.elecciones ?? []
  const estado = estadoEleccion({ capitanes, elecciones, participantes })
  const nombreDe = (id) => peñistas.find((p) => p.id === id)?.nombre ?? '—'
  const partidoJugado = Boolean(convocatoria?.resultado?.registrado)

  const soyCapitan = capitanes.includes(peñista.id)
  const meToca = !estado.terminada && !partidoJugado && estado.idCapitanTurno === peñista.id
  const ultima = elecciones.at(-1)
  const puedoDeshacer = !partidoJugado && ultima?.porId === peñista.id

  async function elegir(jugador) {
    setGuardando(true)
    setError(null)
    try {
      await elegirJugador(idConvocatoria, {
        capitanes,
        jugador,
        quienElige: peñista.id,
        turnoEsperado: estado.turno,
        participantesIds: participantes.map((p) => p.id),
      })
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setGuardando(false)
    }
  }

  async function deshacer() {
    setGuardando(true)
    setError(null)
    try {
      await deshacerEleccion(idConvocatoria, { quienElige: peñista.id, turnoEsperado: estado.turno })
    } catch (e) {
      setError(mensajeDeError(e))
    } finally {
      setGuardando(false)
    }
  }

  let aviso
  if (partidoJugado) aviso = null
  else if (estado.terminada) aviso = <p className="aviso principal">✅ Equipos hechos.</p>
  else if (estado.libres.length === 0) aviso = <p className="subtitulo">Todavía no hay más jugadores para elegir.</p>
  else if (meToca)
    aviso = (
      <p className="aviso principal aviso-turno">
        👉 Te toca elegir para el equipo {NOMBRE_EQUIPO[estado.equipoTurno]}. Toca un jugador.
      </p>
    )
  else
    aviso = (
      <p className="aviso ambar">
        {soyCapitan ? 'Esperando a que elija ' : 'Le toca elegir a '}
        {nombreDe(estado.idCapitanTurno)} ({NOMBRE_EQUIPO[estado.equipoTurno]})…
      </p>
    )

  return (
    <section className="tarjeta">
      <h2 className="titulo-seccion">Elección de equipos</h2>
      <p className="subtitulo">
        Capitanes: {nombreDe(capitanes[0])} ({NOMBRE_EQUIPO.A}) y {nombreDe(capitanes[1])} ({NOMBRE_EQUIPO.B}).
        {!fijados && ' Son provisionales hasta la primera elección: si se apunta alguien mejor clasificado, cambiarán.'}
      </p>

      {aviso && <div style={{ marginTop: 10 }}>{aviso}</div>}
      {error && (
        <p className="aviso error" style={{ marginTop: 8 }}>
          {error}
        </p>
      )}
      {estado.hayDesapuntados && (
        <p className="aviso ambar" style={{ marginTop: 8 }}>
          Alguien que estaba en un equipo ya no está apuntado (aparece tachado). Si hace falta, el admin puede
          reiniciar la elección.
        </p>
      )}

      <div className="equipos-grid">
        <ColumnaEquipo letra="A" miembros={estado.equipoA} peñistas={peñistas} />
        <ColumnaEquipo letra="B" miembros={estado.equipoB} peñistas={peñistas} />
      </div>

      {puedoDeshacer && (
        <button className="boton boton-secundario boton-bloque" style={{ marginTop: 10 }} disabled={guardando} onClick={deshacer}>
          ↩️ Deshacer mi última elección ({ultima.nombre})
        </button>
      )}

      {!partidoJugado && estado.libres.length > 0 && (
        <>
          <label className="campo-label" style={{ marginTop: 14 }}>
            Sin equipo ({estado.libres.length})
          </label>
          <ul className="lista">
            {estado.libres.map((j) => {
              const p = peñistas.find((x) => x.id === j.id)
              const contenido = (
                <>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar nombre={j.nombre} fotoURL={p?.fotoURL} tamaño={28} />
                    {j.nombre}
                  </span>
                  {j.tipo === 'invitado' && <span className="etiqueta-pill">invitado</span>}
                </>
              )
              return (
                <li key={j.id}>
                  {meToca ? (
                    <button className="lista-item jugador-elegible" disabled={guardando} onClick={() => elegir(j)}>
                      {contenido}
                    </button>
                  ) : (
                    <div className="lista-item">{contenido}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}
    </section>
  )
}
