import { calcularClasificacion } from '../lib/points'

export default function ClasificacionScreen({ convocatorias, peñistas }) {
  const activos = peñistas.filter((p) => p.activo)
  const clasificacion = calcularClasificacion(convocatorias, activos)

  return (
    <section className="tarjeta">
      <h2 className="titulo-seccion">Clasificación</h2>
      <p className="subtitulo">
        Victoria 3 pts · Empate 2 pts · Derrota 1 pt · Cerveza postpartido +0,5 pts
      </p>

      {clasificacion.length === 0 ? (
        <p className="subtitulo" style={{ marginTop: 12 }}>
          Todavía no hay puntos registrados.
        </p>
      ) : (
        <table className="tabla-clasificacion" style={{ marginTop: 12 }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Peñista</th>
              <th>Partidos</th>
              <th>Puntos</th>
            </tr>
          </thead>
          <tbody>
            {clasificacion.map((fila, i) => (
              <tr key={fila.id}>
                <td>{i + 1}</td>
                <td>{fila.nombre}</td>
                <td>{fila.partidosJugados}</td>
                <td>{fila.puntos}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
