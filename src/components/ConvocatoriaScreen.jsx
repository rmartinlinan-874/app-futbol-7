import { useState } from 'react'
import { formatearFechaLarga, horaPartidoTexto } from '../lib/dates'
import { calcularAforo, AFORO_MIN, AFORO_MAX } from '../lib/aforo'
import { marcarRespuesta, apuntarInvitado, quitarInvitado } from '../lib/actions'
import Avatar from './Avatar'
import AvisoNotificaciones from './AvisoNotificaciones'

export default function ConvocatoriaScreen({ idConvocatoria, peñista, peñistas, convocatoria, respuestas, invitados }) {
  const [nombreInvitado, setNombreInvitado] = useState('')
  const [enviando, setEnviando] = useState(false)

  const totalActivos = peñistas.filter((p) => p.activo).length
  const miRespuesta = respuestas.find((r) => r.id === peñista.id)
  const juegan = respuestas.filter((r) => r.juega)
  const noJuegan = respuestas.filter((r) => !r.juega)
  const porConfirmar = Math.max(0, totalActivos - respuestas.length)

  const aforo = calcularAforo({ respuestasJuego: juegan, invitados })
  const peñistaDe = (id) => peñistas.find((p) => p.id === id)
  const nombreDe = (id) => peñistaDe(id)?.nombre ?? '—'

  const activos = peñistas.filter((p) => p.activo)
  const pendientes = activos.filter((p) => !respuestas.some((r) => r.id === p.id))

  async function elegir(juega) {
    setEnviando(true)
    try {
      await marcarRespuesta(idConvocatoria, peñista.id, juega)
    } finally {
      setEnviando(false)
    }
  }

  async function enviarInvitado(e) {
    e.preventDefault()
    const nombre = nombreInvitado.trim()
    if (!nombre) return
    setEnviando(true)
    try {
      await apuntarInvitado(idConvocatoria, {
        nombre,
        apuntadoPorId: peñista.id,
        apuntadoPorNombre: peñista.nombre,
      })
      setNombreInvitado('')
    } finally {
      setEnviando(false)
    }
  }

  const estaEnEspera = aforo.peñistasEnEspera.some((r) => r.id === peñista.id)

  return (
    <>
      <AvisoNotificaciones peñista={peñista} />

      <section className="tarjeta">
        <h2 className="titulo-seccion">Próximo partido</h2>
        <p className="subtitulo">
          {formatearFechaLarga(idConvocatoria)} · {horaPartidoTexto()}
        </p>

        <div className="fila-toggle" style={{ marginTop: 12 }}>
          <button
            className={`boton ${miRespuesta?.juega ? 'boton-primario' : 'boton-secundario'}`}
            disabled={enviando}
            onClick={() => elegir(true)}
          >
            ✅ Juego
          </button>
          <button
            className={`boton ${miRespuesta && !miRespuesta.juega ? 'boton-peligro' : 'boton-secundario'}`}
            disabled={enviando}
            onClick={() => elegir(false)}
          >
            ❌ No juego
          </button>
        </div>

        {estaEnEspera && (
          <p className="aviso ambar" style={{ marginTop: 10 }}>
            Ya hay {AFORO_MAX} peñistas apuntados antes que tú: estás en lista de espera.
          </p>
        )}
      </section>

      <section className="contadores">
        <div className="contador principal">
          <span className="numero">{juegan.length + aforo.invitadosJuegan.length}</span>
          <span className="etiqueta">Juegan</span>
        </div>
        <div className="contador rojo">
          <span className="numero">{noJuegan.length}</span>
          <span className="etiqueta">No juegan</span>
        </div>
        <div className="contador ambar">
          <span className="numero">{porConfirmar}</span>
          <span className="etiqueta">Por confirmar (de {totalActivos})</span>
        </div>
        <div className="contador">
          <span className="numero">{invitados.length - aforo.invitadosJuegan.length}</span>
          <span className="etiqueta">Invitados apuntados</span>
        </div>
      </section>

      {aforo.totalJugando < AFORO_MIN ? (
        <p className="aviso ambar">
          Faltan {aforo.faltanParaMinimo} para llegar al mínimo de {AFORO_MIN} jugadores.
        </p>
      ) : (
        <p className="aviso principal">
          {aforo.totalJugando} confirmados para jugar (de un máximo de {AFORO_MAX}).
        </p>
      )}

      {(juegan.length > 0 || aforo.invitadosJuegan.length > 0) && (
        <section className="tarjeta">
          <h2 className="titulo-seccion">Apuntados</h2>
          <ul className="lista" style={{ marginTop: 8 }}>
            {juegan.map((r) => {
              const p = peñistaDe(r.id)
              const enEspera = aforo.peñistasEnEspera.some((x) => x.id === r.id)
              return (
                <li key={r.id} className="lista-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar nombre={p?.nombre ?? '?'} fotoURL={p?.fotoURL} tamaño={28} />
                    {p?.nombre ?? '—'}
                  </div>
                  {enEspera && <span className="etiqueta-pill espera">Lista de espera</span>}
                </li>
              )
            })}
            {aforo.invitadosJuegan.map((inv) => (
              <li key={inv.id} className="lista-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar nombre={inv.nombre} tamaño={28} />
                  {inv.nombre}
                </div>
                <span className="etiqueta-pill">invitado</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {noJuegan.length > 0 && (
        <section className="tarjeta">
          <h2 className="titulo-seccion">No juegan</h2>
          <ul className="lista" style={{ marginTop: 8 }}>
            {noJuegan.map((r) => {
              const p = peñistaDe(r.id)
              return (
                <li key={r.id} className="lista-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar nombre={p?.nombre ?? '?'} fotoURL={p?.fotoURL} tamaño={28} />
                    {p?.nombre ?? '—'}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {pendientes.length > 0 && (
        <section className="tarjeta">
          <h2 className="titulo-seccion">Por confirmar</h2>
          <p className="subtitulo">Todavía no han dicho si juegan.</p>
          <ul className="lista" style={{ marginTop: 8 }}>
            {pendientes.map((p) => (
              <li key={p.id} className="lista-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar nombre={p.nombre} fotoURL={p.fotoURL} tamaño={28} />
                  {p.nombre}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {convocatoria?.encargados?.length === 2 && (
        <section className="tarjeta">
          <h2 className="titulo-seccion">Encargados de montar los equipos</h2>
          <p className="subtitulo">
            {nombreDe(convocatoria.encargados[0])} y {nombreDe(convocatoria.encargados[1])}
          </p>
        </section>
      )}

      <section className="tarjeta">
        <h2 className="titulo-seccion">Invitados</h2>
        <p className="subtitulo">Para cubrir huecos si faltan peñistas. Por orden de apunte.</p>

        <form className="form-inline" style={{ marginTop: 10 }} onSubmit={enviarInvitado}>
          <input
            className="campo-texto"
            placeholder="Nombre del invitado"
            value={nombreInvitado}
            onChange={(e) => setNombreInvitado(e.target.value)}
            disabled={enviando}
          />
          <button className="boton boton-primario" disabled={enviando || !nombreInvitado.trim()}>
            Apuntar
          </button>
        </form>

        {invitados.length > 0 && (
          <ul className="lista" style={{ marginTop: 12 }}>
            {[...aforo.invitadosJuegan, ...aforo.invitadosEnEspera].map((inv) => {
              const confirmadoParaJugar = aforo.invitadosJuegan.some((x) => x.id === inv.id)
              return (
                <li key={inv.id} className="lista-item">
                  <div>
                    {inv.nombre}
                    <div className="meta">apuntado por {inv.apuntadoPorNombre}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`etiqueta-pill ${confirmadoParaJugar ? '' : 'espera'}`}>
                      {confirmadoParaJugar ? 'Juega' : inv.confirmado ? 'En espera (aforo)' : 'Sin confirmar'}
                    </span>
                    {inv.apuntadoPorId === peñista.id && !inv.confirmado && (
                      <button
                        className="boton boton-secundario"
                        style={{ padding: '4px 8px' }}
                        onClick={() => quitarInvitado(idConvocatoria, inv.id)}
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

    </>
  )
}
