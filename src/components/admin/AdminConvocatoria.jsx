import { useEffect, useState } from 'react'
import { AFORO_MAX, calcularAforo } from '../../lib/aforo'
import { calcularClasificacion, calcularVecesEncargado } from '../../lib/points'
import { elegirCapitanes } from '../../lib/encargados'
import { asignacionesDesdeEleccion, participantesDelPartido, NOMBRE_EQUIPO } from '../../lib/eleccion'
import {
  confirmarInvitado,
  guardarEncargados,
  registrarResultado,
  marcarRespuesta,
  borrarRespuesta,
  reiniciarEleccion,
} from '../../lib/actions'

function estadoInicialResultado(resultadoGuardado) {
  if (!resultadoGuardado?.registrado) {
    return { asignaciones: {}, ganador: null, cerveza: new Set() }
  }
  const asignaciones = {}
  for (const m of resultadoGuardado.equipoA ?? []) asignaciones[m.id] = 'A'
  for (const m of resultadoGuardado.equipoB ?? []) asignaciones[m.id] = 'B'
  return {
    asignaciones,
    ganador: resultadoGuardado.ganador ?? null,
    cerveza: new Set(resultadoGuardado.cerveza ?? []),
  }
}

export default function AdminConvocatoria({
  idConvocatoria,
  convocatoria,
  respuestas,
  invitados,
  eleccion,
  peñistas,
  convocatorias,
  pin,
}) {
  const nombreDe = (id) => peñistas.find((p) => p.id === id)?.nombre ?? '—'
  const juegan = respuestas.filter((r) => r.juega)
  const aforo = calcularAforo({ respuestasJuego: juegan, invitados })

  // Para elegir encargados se usa la clasificación y el historial de
  // "veces encargado" de ANTES de esta convocatoria (si ya tuviera
  // resultado o encargados propios, no deben influir en su propia elección).
  const convocatoriasAnteriores = convocatorias.filter((c) => c.id !== idConvocatoria)
  const puntosPorId = new Map(
    calcularClasificacion(convocatoriasAnteriores, peñistas).map((c) => [c.id, c.puntos]),
  )
  const vecesEncargadoPorId = calcularVecesEncargado(convocatoriasAnteriores)

  const [sorteando, setSorteando] = useState(false)
  const [guardandoInvitado, setGuardandoInvitado] = useState(null)
  const [guardandoAsistencia, setGuardandoAsistencia] = useState(null)

  const activos = peñistas.filter((p) => p.activo)

  async function fijarAsistencia(peñistaId, juega) {
    setGuardandoAsistencia(peñistaId)
    try {
      await marcarRespuesta(idConvocatoria, peñistaId, juega)
    } finally {
      setGuardandoAsistencia(null)
    }
  }

  async function quitarAsistencia(peñistaId) {
    setGuardandoAsistencia(peñistaId)
    try {
      await borrarRespuesta(idConvocatoria, peñistaId)
    } finally {
      setGuardandoAsistencia(null)
    }
  }

  async function elegirEncargados() {
    setSorteando(true)
    try {
      const elegidos = elegirCapitanes(
        aforo.peñistasJuegan.map((r) => r.id),
        puntosPorId,
        vecesEncargadoPorId,
        idConvocatoria,
      )
      await guardarEncargados(idConvocatoria, elegidos, pin)
    } finally {
      setSorteando(false)
    }
  }

  async function toggleConfirmado(inv) {
    setGuardandoInvitado(inv.id)
    try {
      await confirmarInvitado(idConvocatoria, inv.id, !inv.confirmado, pin)
    } finally {
      setGuardandoInvitado(null)
    }
  }

  // --- Resultado ---
  const [editandoResultado, setEditandoResultado] = useState(false)
  const [form, setForm] = useState(() => estadoInicialResultado(convocatoria?.resultado))
  const [guardandoResultado, setGuardandoResultado] = useState(false)
  // Mientras el admin no toque a mano los equipos del formulario, se
  // rellenan solos con lo que vayan eligiendo los capitanes.
  const [equiposTocados, setEquiposTocados] = useState(false)
  const [reiniciando, setReiniciando] = useState(false)

  // Solo se reinicia el formulario al cambiar de convocatoria, para no
  // pisar una edición en curso del admin si llega una actualización en vivo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setForm(estadoInicialResultado(convocatoria?.resultado))
    setEquiposTocados(false)
  }, [idConvocatoria])

  const participantes = participantesDelPartido(aforo, peñistas)

  const asignacionesEleccion =
    eleccion?.capitanes?.length === 2
      ? asignacionesDesdeEleccion({ capitanes: eleccion.capitanes, elecciones: eleccion.elecciones, participantes })
      : null
  const clavesEleccion = asignacionesEleccion ? JSON.stringify(asignacionesEleccion) : null
  const usaEquiposDeEleccion = Boolean(asignacionesEleccion) && !convocatoria?.resultado?.registrado && !equiposTocados

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (usaEquiposDeEleccion) setForm((f) => ({ ...f, asignaciones: asignacionesEleccion }))
  }, [clavesEleccion, usaEquiposDeEleccion])

  async function borrarEleccion() {
    if (!window.confirm('¿Reiniciar la elección de equipos? Se borran todas las elecciones de los capitanes.')) return
    setReiniciando(true)
    try {
      await reiniciarEleccion(idConvocatoria)
      setEquiposTocados(false)
    } finally {
      setReiniciando(false)
    }
  }

  function asignar(id, equipo) {
    setEquiposTocados(true)
    setForm((f) => ({
      ...f,
      asignaciones: { ...f.asignaciones, [id]: f.asignaciones[id] === equipo ? undefined : equipo },
    }))
  }

  function toggleCerveza(id) {
    setForm((f) => {
      const cerveza = new Set(f.cerveza)
      if (cerveza.has(id)) cerveza.delete(id)
      else cerveza.add(id)
      return { ...f, cerveza }
    })
  }

  async function guardarResultado() {
    const equipoA = participantes.filter((p) => form.asignaciones[p.id] === 'A')
    const equipoB = participantes.filter((p) => form.asignaciones[p.id] === 'B')
    setGuardandoResultado(true)
    try {
      await registrarResultado(
        idConvocatoria,
        {
          equipoA,
          equipoB,
          ganador: form.ganador,
          cerveza: [...form.cerveza],
        },
        pin,
      )
      setEditandoResultado(false)
    } finally {
      setGuardandoResultado(false)
    }
  }

  const resultadoGuardado = convocatoria?.resultado?.registrado ? convocatoria.resultado : null
  const faltanAsignar = participantes.some((p) => !form.asignaciones[p.id])

  return (
    <>
      <section className="tarjeta">
        <h2 className="titulo-seccion">Gestionar convocatoria</h2>
        <p className="subtitulo">Apunta o quita a cualquier peñista, por si no ha podido hacerlo él mismo.</p>
        <ul className="lista" style={{ marginTop: 10 }}>
          {activos.map((p) => {
            const respuesta = respuestas.find((r) => r.id === p.id)
            const ocupado = guardandoAsistencia === p.id
            return (
              <li key={p.id} className="lista-item">
                <span>{p.nombre}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className={`boton ${respuesta?.juega ? 'boton-primario' : 'boton-secundario'}`}
                    style={{ padding: '5px 10px' }}
                    disabled={ocupado}
                    onClick={() => fijarAsistencia(p.id, true)}
                  >
                    Juega
                  </button>
                  <button
                    className={`boton ${respuesta && !respuesta.juega ? 'boton-peligro' : 'boton-secundario'}`}
                    style={{ padding: '5px 10px' }}
                    disabled={ocupado}
                    onClick={() => fijarAsistencia(p.id, false)}
                  >
                    No juega
                  </button>
                  {respuesta && (
                    <button
                      className="boton boton-secundario"
                      style={{ padding: '5px 10px' }}
                      disabled={ocupado}
                      onClick={() => quitarAsistencia(p.id)}
                      title="Volver a 'sin responder'"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="tarjeta">
        <h2 className="titulo-seccion">Encargados de montar los equipos</h2>
        <p className="subtitulo">
          Los dos primeros de la clasificación entre los {aforo.peñistasJuegan.length} peñistas
          confirmados (nunca invitados). En caso de empate a puntos, quien menos veces haya sido
          encargado; si el empate persiste, por sorteo.
        </p>
        {convocatoria?.encargados?.length === 2 && (
          <p style={{ fontWeight: 600, marginTop: 8 }}>
            {nombreDe(convocatoria.encargados[0])} y {nombreDe(convocatoria.encargados[1])}
          </p>
        )}
        <button
          className="boton boton-primario"
          style={{ marginTop: 10 }}
          disabled={sorteando || aforo.peñistasJuegan.length < 2}
          onClick={elegirEncargados}
        >
          {convocatoria?.encargados?.length === 2 ? '🔁 Recalcular encargados' : '📋 Fijar encargados'}
        </button>
        <p className="subtitulo" style={{ marginTop: 8 }}>
          No hace falta pulsarlo: la app calcula los capitanes sola y ellos pueden empezar a elegir equipos en
          cuanto quieran. Úsalo solo si quieres fijarlos antes de que empiece la elección.
        </p>

        {eleccion?.capitanes?.length === 2 && (
          <>
            <p className="aviso principal" style={{ marginTop: 10 }}>
              Elección en marcha: {nombreDe(eleccion.capitanes[0])} ({NOMBRE_EQUIPO.A}) y{' '}
              {nombreDe(eleccion.capitanes[1])} ({NOMBRE_EQUIPO.B}), {eleccion.elecciones?.length ?? 0} jugadores
              elegidos. Mientras esté en marcha, los capitanes no cambian.
            </p>
            <button
              className="boton boton-peligro"
              style={{ marginTop: 8 }}
              disabled={reiniciando}
              onClick={borrarEleccion}
            >
              🗑️ Reiniciar elección de equipos
            </button>
          </>
        )}
      </section>

      <section className="tarjeta">
        <h2 className="titulo-seccion">Completar aforo con invitados</h2>
        <p className="subtitulo">
          Plazas libres tras los peñistas confirmados: {aforo.plazasLibres} (máximo {AFORO_MAX}). Confirma
          invitados por orden de apunte.
        </p>
        {invitados.length === 0 ? (
          <p className="subtitulo" style={{ marginTop: 8 }}>Nadie ha apuntado invitados todavía.</p>
        ) : (
          <ul className="lista" style={{ marginTop: 10 }}>
            {invitados.map((inv) => (
              <li key={inv.id} className="lista-item">
                <div>
                  {inv.nombre}
                  <div className="meta">apuntado por {inv.apuntadoPorNombre}</div>
                </div>
                <button
                  className={`boton ${inv.confirmado ? 'boton-primario' : 'boton-secundario'}`}
                  style={{ padding: '6px 10px' }}
                  disabled={guardandoInvitado === inv.id}
                  onClick={() => toggleConfirmado(inv)}
                >
                  {inv.confirmado ? 'Confirmado ✓' : 'Confirmar'}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tarjeta">
        <h2 className="titulo-seccion">Resultado del partido</h2>

        {resultadoGuardado && !editandoResultado ? (
          <>
            <p style={{ marginTop: 8 }}>
              {resultadoGuardado.ganador === 'empate'
                ? 'Empate'
                : `Ganó el equipo ${NOMBRE_EQUIPO[resultadoGuardado.ganador]}`}
            </p>
            <p className="subtitulo">
              Equipo {NOMBRE_EQUIPO.A}: {resultadoGuardado.equipoA.map((m) => m.nombre).join(', ') || '—'}
            </p>
            <p className="subtitulo">
              Equipo {NOMBRE_EQUIPO.B}: {resultadoGuardado.equipoB.map((m) => m.nombre).join(', ') || '—'}
            </p>
            <p className="subtitulo">
              Se quedaron a la cerveza: {resultadoGuardado.cerveza.map(nombreDe).join(', ') || 'nadie'}
            </p>
            <button className="boton boton-secundario" style={{ marginTop: 8 }} onClick={() => setEditandoResultado(true)}>
              Editar resultado
            </button>
          </>
        ) : participantes.length === 0 ? (
          <p className="subtitulo" style={{ marginTop: 8 }}>
            Todavía no hay nadie confirmado para jugar.
          </p>
        ) : (
          <>
            <p className="subtitulo" style={{ marginTop: 8 }}>
              {usaEquiposDeEleccion
                ? 'Equipos cargados de la elección de los capitanes. Cambia a quien haga falta si en el campo se hizo distinto.'
                : 'Asigna a cada participante a un equipo (tal y como se formaron en el campo).'}
            </p>
            {participantes.map((p) => (
              <div key={p.id} className="fila-equipo">
                <span>
                  {p.nombre} {p.tipo === 'invitado' && <span className="etiqueta-pill">invitado</span>}
                </span>
                <div className="selector-equipo">
                  <button
                    className={`sel-a ${form.asignaciones[p.id] === 'A' ? 'activo' : ''}`}
                    onClick={() => asignar(p.id, 'A')}
                  >
                    {NOMBRE_EQUIPO.A}
                  </button>
                  <button
                    className={`sel-b ${form.asignaciones[p.id] === 'B' ? 'activo' : ''}`}
                    onClick={() => asignar(p.id, 'B')}
                  >
                    {NOMBRE_EQUIPO.B}
                  </button>
                </div>
              </div>
            ))}

            <label className="campo-label" style={{ marginTop: 14 }}>
              Resultado
            </label>
            <div className="fila-toggle">
              <button
                className={`boton ${form.ganador === 'A' ? 'boton-primario' : 'boton-secundario'}`}
                onClick={() => setForm((f) => ({ ...f, ganador: 'A' }))}
              >
                Ganó {NOMBRE_EQUIPO.A}
              </button>
              <button
                className={`boton ${form.ganador === 'empate' ? 'boton-primario' : 'boton-secundario'}`}
                onClick={() => setForm((f) => ({ ...f, ganador: 'empate' }))}
              >
                Empate
              </button>
              <button
                className={`boton ${form.ganador === 'B' ? 'boton-primario' : 'boton-secundario'}`}
                onClick={() => setForm((f) => ({ ...f, ganador: 'B' }))}
              >
                Ganó {NOMBRE_EQUIPO.B}
              </button>
            </div>

            <label className="campo-label" style={{ marginTop: 14 }}>
              Se quedaron a la cerveza (+0,5 puntos extra)
            </label>
            {participantes
              .filter((p) => p.tipo === 'peñista')
              .map((p) => (
                <label key={p.id} className="checkbox-fila">
                  <input
                    type="checkbox"
                    checked={form.cerveza.has(p.id)}
                    onChange={() => toggleCerveza(p.id)}
                  />
                  {p.nombre}
                </label>
              ))}

            <button
              className="boton boton-primario boton-bloque"
              style={{ marginTop: 14 }}
              disabled={guardandoResultado || !form.ganador || faltanAsignar}
              onClick={guardarResultado}
            >
              Guardar resultado
            </button>
            {resultadoGuardado && (
              <button
                className="boton boton-secundario boton-bloque"
                style={{ marginTop: 8 }}
                onClick={() => setEditandoResultado(false)}
              >
                Cancelar
              </button>
            )}
          </>
        )}
      </section>
    </>
  )
}
