import { useState } from 'react'
import { CENA, CONSULTANDO, nombreDeRespuesta, nombrePlato, resumenCena } from '../../lib/cena'
import { borrarRespuestaCena } from '../../lib/actions'
import { formatearFechaLarga } from '../../lib/dates'

function textoParaRestaurante(resumen, nombrePlano) {
  const lineas = [
    `${CENA.titulo} · ${formatearFechaLarga(CENA.fecha)}`,
    `Comensales: ${resumen.van.length}`,
    '',
    `Entrantes (${CENA.maxEntrantes}):`,
    ...resumen.entrantesGanadores.map((e) => `- ${e.nombre}`),
    '',
    'Principales:',
    ...resumen.principales.map((p) => `- ${p.nombre}: ${p.quienes.length}`),
    '',
    'Por persona:',
    ...resumen.van.map((r) => `- ${nombreDe(r.id)}: ${nombrePlato(r.principal)}`),
  ]
  return lineas.join('\n')
}

export default function AdminCena({ respuestasCena, peñistas }) {
  const [copiado, setCopiado] = useState(false)
  const [enlaceCopiado, setEnlaceCopiado] = useState(false)
  const nombreDe = (id) => {
    const r = respuestasCena.find((x) => x.id === id) ?? { id }
    return nombreDeRespuesta(r, peñistas) + (r.externo ? ' (antiguo)' : '')
  }
  // Para el texto del restaurante, sin la etiqueta "(antiguo)".
  const nombrePlano = (id) => nombreDeRespuesta(respuestasCena.find((x) => x.id === id) ?? { id }, peñistas)
  const externos = respuestasCena.filter((r) => r.externo)
  const enlaceCena = `${window.location.origin}${import.meta.env.BASE_URL}?cena`

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(enlaceCena)
      setEnlaceCopiado(true)
      setTimeout(() => setEnlaceCopiado(false), 2500)
    } catch {
      window.prompt('Copia el enlace:', enlaceCena)
    }
  }

  async function borrar(r) {
    if (!window.confirm(`¿Borrar a ${r.nombre} de la cena?`)) return
    await borrarRespuestaCena(CENA.id, r.id)
  }

  function estado(r) {
    if (r.asiste === true) return `✅ va · ${nombrePlato(r.principal)}`
    if (r.asiste === CONSULTANDO) return '🏠 aún no le ha preguntado a su mujer'
    return '😢 no va'
  }
  const resumen = resumenCena(respuestasCena, peñistas)
  const maxVotos = Math.max(1, ...resumen.votos.map((v) => v.votos))
  const ganadores = new Set(resumen.entrantesGanadores.map((e) => e.id))

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoParaRestaurante(resumen, nombrePlano))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      window.prompt('Copia el resumen:', textoParaRestaurante(resumen, nombrePlano))
    }
  }

  return (
    <>
      <section className="tarjeta">
        <h2 className="titulo-seccion">
          🎄 {CENA.titulo} · {CENA.lugar}
        </h2>
        <p className="subtitulo">
          {formatearFechaLarga(CENA.fecha)} · {CENA.precio} € por persona
        </p>
        <div className="contadores" style={{ marginTop: 10 }}>
          <div className="contador principal">
            <span className="numero">{resumen.van.length}</span>
            <span className="etiqueta">Van</span>
          </div>
          <div className="contador rojo">
            <span className="numero">{resumen.noVan.length}</span>
            <span className="etiqueta">No van</span>
          </div>
          <div className="contador ambar">
            <span className="numero">{resumen.sinResponder.length + resumen.consultando.length}</span>
            <span className="etiqueta">
              Sin decidir{resumen.consultando.length > 0 ? ` (🏠 ${resumen.consultando.length} sin preguntar en casa)` : ''}
            </span>
          </div>
          <div className="contador">
            <span className="numero">{resumen.total} €</span>
            <span className="etiqueta">Total aprox.</span>
          </div>
        </div>
        <button className="boton boton-primario boton-bloque" style={{ marginTop: 12 }} onClick={copiar}>
          {copiado ? '✅ Copiado' : '📋 Copiar resumen para el restaurante'}
        </button>
      </section>

      <section className="tarjeta">
        <h2 className="titulo-seccion">👋 Antiguos peñistas</h2>
        <p className="subtitulo">
          Pásales este enlace por WhatsApp: abre la app solo con la cena, escriben su nombre y eligen sus platos.
        </p>
        <p className="meta" style={{ wordBreak: 'break-all', margin: '6px 0 10px' }}>
          {enlaceCena}
        </p>
        <button className="boton boton-secundario boton-bloque" onClick={copiarEnlace}>
          {enlaceCopiado ? '✅ Enlace copiado' : '🔗 Copiar enlace de la cena'}
        </button>
        {externos.length > 0 && (
          <ul className="lista" style={{ marginTop: 12 }}>
            {externos.map((r) => (
              <li key={r.id} className="lista-item" style={{ alignItems: 'flex-start' }}>
                <div>
                  <strong>{r.nombre}</strong>
                  <div className="meta">{estado(r)}</div>
                </div>
                <button
                  className="boton boton-secundario"
                  style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                  onClick={() => borrar(r)}
                  aria-label={`Borrar a ${r.nombre}`}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tarjeta">
        <h2 className="titulo-seccion">Votos de entrantes</h2>
        <p className="subtitulo">Salen los {CENA.maxEntrantes} más votados (marcados con ⭐).</p>
        <ul className="lista-votos">
          {resumen.votos.map((v) => (
            <li key={v.id} className={ganadores.has(v.id) ? 'ganador' : ''}>
              <div className="voto-texto">
                <span>
                  {ganadores.has(v.id) ? '⭐ ' : ''}
                  {v.nombre}
                </span>
                <strong>{v.votos}</strong>
              </div>
              <div className="voto-barra">
                <span style={{ width: `${(v.votos / maxVotos) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="tarjeta">
        <h2 className="titulo-seccion">Platos principales</h2>
        {resumen.principales.length === 0 ? (
          <p className="subtitulo">Todavía nadie ha elegido.</p>
        ) : (
          <ul className="lista" style={{ marginTop: 8 }}>
            {resumen.principales.map((p) => (
              <li key={p.id} className="lista-item" style={{ alignItems: 'flex-start' }}>
                <div>
                  {p.emoji} {p.nombre}
                  {p.suplemento && <span className="etiqueta-pill suplemento">+{p.suplemento} €</span>}
                  <div className="meta">{p.quienes.map(nombreDe).join(', ')}</div>
                </div>
                <strong>{p.quienes.length}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(resumen.noVan.length > 0 || resumen.consultando.length > 0 || resumen.sinResponder.length > 0) && (
        <section className="tarjeta">
          {resumen.noVan.length > 0 && (
            <>
              <h2 className="titulo-seccion">No van</h2>
              <p className="subtitulo">{resumen.noVan.map((r) => nombreDe(r.id)).join(', ')}</p>
            </>
          )}
          {resumen.consultando.length > 0 && (
            <>
              <h2 className="titulo-seccion" style={{ marginTop: resumen.noVan.length ? 12 : 0 }}>
                🏠 Aún no le han preguntado a su mujer
              </h2>
              <p className="subtitulo">{resumen.consultando.map((r) => nombreDe(r.id)).join(', ')}</p>
            </>
          )}
          {resumen.sinResponder.length > 0 && (
            <>
              <h2
                className="titulo-seccion"
                style={{ marginTop: resumen.noVan.length || resumen.consultando.length ? 12 : 0 }}
              >
                Sin responder
              </h2>
              <p className="subtitulo">{resumen.sinResponder.map((p) => p.nombre).join(', ')}</p>
            </>
          )}
        </section>
      )}
    </>
  )
}
