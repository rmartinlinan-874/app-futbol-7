import { useState } from 'react'
import { formatearFechaLarga, horaPartidoTexto } from '../lib/dates'
import { calcularAforo, AFORO_MIN, AFORO_MAX } from '../lib/aforo'
import { marcarRespuesta, apuntarInvitado, quitarInvitado } from '../lib/actions'

export default function ConvocatoriaScreen({ idConvocatoria, peñista, peñistas, convocatoria, respuestas, invitados }) {
  const [nombreInvitado, setNombreInvitado] = useState('')
  const [enviando, setEnviando] = useState(false)

  const totalActivos = peñistas.filter((p) => p.activo).length
  const miRespuesta = respuestas.find((r) => r.id === peñista.id)
  const juegan = respuestas.filter((r) => r.juega)
  const noJuegan = respuestas.filter((r) => !r.juega)
  const porConfirmar = Math.max(0, totalActivos - respuestas.length)

  const aforo = calcularAforo({ respuestasJuego: juegan, invitados })
  const nombreDe = (id) => peñistas.find((p) => p.id === id)?.nombre ?? '—'

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
        <div className="contador verde">
          <span className="numero">{juegan.length}</span>
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
          <span className="numero">{invitados.length}</span>
          <span className="etiqueta">Invitados apuntados</span>
        </div>
      </section>

      {aforo.totalJugando < AFORO_MIN ? (
        <p className="aviso ambar">
          Faltan {aforo.faltanParaMinimo} para llegar al mínimo de {AFORO_MIN} jugadores.
        </p>
      ) : (
        <p className="aviso verde">
          {aforo.totalJugando} confirmados para jugar (de un máximo de {AFORO_MAX}).
        </p>
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

      {aforo.peñistasEnEspera.length > 0 && (
        <section className="tarjeta">
          <h2 className="titulo-seccion">Lista de espera (peñistas)</h2>
          <ul className="lista" style={{ marginTop: 8 }}>
            {aforo.peñistasEnEspera.map((r) => (
              <li key={r.id} className="lista-item">
                {nombreDe(r.id)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
