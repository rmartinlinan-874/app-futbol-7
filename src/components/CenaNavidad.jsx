import { useState } from 'react'
import {
  CENA,
  CONSULTANDO,
  LARGO_MAX_NOMBRE,
  limpiarNombre,
  nombrePlato,
  nombreValido,
  respuestaCompleta,
} from '../lib/cena'
import { formatearFechaLarga } from '../lib/dates'
import { guardarRespuestaCena } from '../lib/actions'
import { lanzarConfeti } from '../lib/confeti'

/**
 * Tarjeta de la cena de Navidad. Si el peñista no ha respondido, enseña el
 * formulario (y ConvocatoriaScreen no le deja marcar si juega hasta que lo
 * haga). Si ya respondió, enseña su elección en pequeño con un botón para
 * cambiarla.
 *
 * Con externo (enlace de la cena para antiguos peñistas) además pide el
 * nombre y no menciona el partido.
 */
export default function CenaNavidad({ peñista, miRespuesta, resumen, externo = false }) {
  const completa = respuestaCompleta(miRespuesta)
  const [editando, setEditando] = useState(false)
  // Quien aún lo está consultando en casa ve el formulario abierto para que
  // no se le olvide, aunque ya pueda apuntarse al partido.
  const consultando = miRespuesta?.asiste === CONSULTANDO
  const mostrarFormulario = !completa || editando || consultando

  return (
    <section className={`tarjeta tarjeta-cena ${mostrarFormulario ? 'abierta' : ''}`}>
      <div className="cena-cabecera">
        <span className="cena-icono" aria-hidden="true">
          🎄
        </span>
        <div>
          <h2 className="titulo-seccion" style={{ margin: 0 }}>
            {CENA.titulo} · {CENA.lugar}
          </h2>
          <p className="subtitulo" style={{ margin: 0 }}>
            {formatearFechaLarga(CENA.fecha)} · {CENA.precio} € · Van {resumen.van.length}
          </p>
        </div>
      </div>

      {mostrarFormulario ? (
        <FormularioCena
          key={peñista.id}
          peñista={peñista}
          inicial={miRespuesta}
          puedeCancelar={completa && !consultando}
          consultando={consultando}
          externo={externo}
          onTerminar={() => setEditando(false)}
        />
      ) : (
        <ResumenMiCena respuesta={miRespuesta} externo={externo} onCambiar={() => setEditando(true)} />
      )}
    </section>
  )
}

function ResumenMiCena({ respuesta, externo, onCambiar }) {
  return (
    <div style={{ marginTop: 10 }}>
      {externo && respuesta.nombre && (
        <p className="meta" style={{ margin: '0 0 6px' }}>
          Apuntado como <strong>{respuesta.nombre}</strong>
        </p>
      )}
      {respuesta.asiste ? (
        <>
          <p style={{ margin: '0 0 4px', fontWeight: 600 }}>✅ Vas a la cena</p>
          <p className="meta" style={{ margin: 0 }}>
            Entrantes que votas: {respuesta.entrantes.map((id) => nombrePlato(id)).join(', ')}
          </p>
          <p className="meta" style={{ margin: '2px 0 0' }}>Principal: {nombrePlato(respuesta.principal)}</p>
        </>
      ) : (
        <p style={{ margin: 0, fontWeight: 600 }}>😢 No vas a la cena</p>
      )}
      <button className="boton boton-secundario" style={{ marginTop: 10, padding: '6px 12px' }} onClick={onCambiar}>
        Cambiar
      </button>
    </div>
  )
}

function FormularioCena({ peñista, inicial, puedeCancelar, consultando, externo, onTerminar }) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? '')
  const [asiste, setAsiste] = useState(inicial?.asiste ?? null)
  const [entrantes, setEntrantes] = useState(inicial?.entrantes ?? [])
  const [principal, setPrincipal] = useState(inicial?.principal ?? null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const lleno = entrantes.length >= CENA.maxEntrantes
  const listo =
    (!externo || nombreValido(nombre)) &&
    (asiste === false || asiste === CONSULTANDO || (asiste === true && entrantes.length >= 1 && principal))

  function alternarEntrante(id) {
    setEntrantes((actual) =>
      actual.includes(id) ? actual.filter((x) => x !== id) : actual.length < CENA.maxEntrantes ? [...actual, id] : actual,
    )
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await guardarRespuestaCena(CENA.id, peñista.id, {
        asiste,
        entrantes,
        principal,
        nombre: externo ? limpiarNombre(nombre) : null,
      })
      if (asiste === true) lanzarConfeti()
      onTerminar()
    } catch {
      setError('No se ha podido guardar. Comprueba la conexión e inténtalo otra vez.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ marginTop: 12 }}>
      {externo && (
        <>
          <label className="campo-label" htmlFor="nombre-cena">
            Tu nombre
          </label>
          <input
            id="nombre-cena"
            className="campo-texto"
            type="text"
            autoComplete="name"
            maxLength={LARGO_MAX_NOMBRE}
            placeholder="Nombre y, si quieres, apellido o mote"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            disabled={guardando}
            style={{ marginBottom: 14 }}
          />
        </>
      )}

      {consultando ? (
        <p className="aviso ambar" style={{ marginBottom: 10 }}>
          {externo
            ? '🏠 Apuntado como «aún no le he preguntado a mi mujer». Cuando tengas respuesta, vuelve a abrir este enlace y dinos si vienes.'
            : '🏠 Apuntado como «aún no le he preguntado a mi mujer». Ya puedes apuntarte al partido, pero cuando tengas respuesta, dinos aquí si vienes.'}
        </p>
      ) : (
        !puedeCancelar &&
        !externo && (
          <p className="aviso ambar" style={{ marginBottom: 10 }}>
            Antes de apuntarte al partido, dinos si vienes a la cena.
          </p>
        )
      )}

      <div className="fila-toggle">
        <button
          className={`boton ${asiste === true ? 'boton-primario' : 'boton-secundario'}`}
          onClick={() => setAsiste(true)}
          disabled={guardando}
        >
          🎉 Voy
        </button>
        <button
          className={`boton ${asiste === false ? 'boton-peligro' : 'boton-secundario'}`}
          onClick={() => setAsiste(false)}
          disabled={guardando}
        >
          😢 No voy
        </button>
      </div>
      <button
        className={`boton boton-bloque ${asiste === CONSULTANDO ? 'boton-consultar activo' : 'boton-secundario'}`}
        style={{ marginTop: 8 }}
        onClick={() => setAsiste(CONSULTANDO)}
        disabled={guardando}
      >
        🏠 Aún no le he preguntado a mi mujer
      </button>

      {asiste === true && (
        <>
          <label className="campo-label" style={{ marginTop: 16 }}>
            Entrantes para la mesa: vota hasta {CENA.maxEntrantes}{' '}
            <span className="contador-cena">
              {entrantes.length}/{CENA.maxEntrantes}
            </span>
          </label>
          <p className="meta" style={{ margin: '0 0 8px' }}>
            Salen los {CENA.maxEntrantes} más votados por todos.
          </p>
          <ul className="opciones-cena">
            {CENA.entrantes.map((e) => {
              const marcado = entrantes.includes(e.id)
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    className={`opcion-cena ${marcado ? 'marcada' : ''}`}
                    aria-pressed={marcado}
                    disabled={guardando || (!marcado && lleno)}
                    onClick={() => alternarEntrante(e.id)}
                  >
                    <span className="opcion-emoji">{e.emoji}</span>
                    <span className="opcion-nombre">{e.nombre}</span>
                    <span className="opcion-check">{marcado ? '✓' : ''}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <label className="campo-label" style={{ marginTop: 16 }}>
            Tu plato principal (elige 1)
          </label>
          <ul className="opciones-cena">
            {CENA.principales.map((p) => {
              const marcado = principal === p.id
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={`opcion-cena ${marcado ? 'marcada' : ''}`}
                    aria-pressed={marcado}
                    disabled={guardando}
                    onClick={() => setPrincipal(p.id)}
                  >
                    <span className="opcion-emoji">{p.emoji}</span>
                    <span className="opcion-nombre">
                      {p.nombre}
                      {p.suplemento && <span className="etiqueta-pill suplemento">+{p.suplemento} €</span>}
                    </span>
                    <span className="opcion-check">{marcado ? '●' : ''}</span>
                  </button>
                </li>
              )
            })}
          </ul>

          <p className="meta" style={{ marginTop: 10 }}>
            Incluye: {CENA.incluye.join(' · ')}.{' '}
            <a href={`${import.meta.env.BASE_URL}cena-menu.jpg`} target="_blank" rel="noreferrer">
              Ver el cartel del menú
            </a>
          </p>
        </>
      )}

      {error && (
        <p className="aviso error" style={{ marginTop: 10 }}>
          {error}
        </p>
      )}

      <div className="fila-toggle" style={{ marginTop: 14 }}>
        <button className="boton boton-primario" disabled={!listo || guardando} onClick={guardar}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        {puedeCancelar && (
          <button className="boton boton-secundario" disabled={guardando} onClick={onTerminar}>
            Cancelar
          </button>
        )}
      </div>
      {externo && !nombreValido(nombre) && asiste !== null && (
        <p className="meta" style={{ marginTop: 6 }}>
          Escribe tu nombre arriba para que sepamos quién eres.
        </p>
      )}
      {asiste === true && (entrantes.length === 0 || !principal) && (
        <p className="meta" style={{ marginTop: 6 }}>
          Te falta {entrantes.length === 0 ? 'votar al menos un entrante' : ''}
          {entrantes.length === 0 && !principal ? ' y ' : ''}
          {!principal ? 'elegir el plato principal' : ''}.
        </p>
      )}
    </div>
  )
}
