import { useState } from 'react'
import { CENA, nombrePlato, resumenCena } from '../../lib/cena'
import { formatearFechaLarga } from '../../lib/dates'

function textoParaRestaurante(resumen, nombreDe) {
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
  const nombreDe = (id) => peñistas.find((p) => p.id === id)?.nombre ?? '—'
  const resumen = resumenCena(respuestasCena, peñistas)
  const maxVotos = Math.max(1, ...resumen.votos.map((v) => v.votos))
  const ganadores = new Set(resumen.entrantesGanadores.map((e) => e.id))

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoParaRestaurante(resumen, nombreDe))
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      window.prompt('Copia el resumen:', textoParaRestaurante(resumen, nombreDe))
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
