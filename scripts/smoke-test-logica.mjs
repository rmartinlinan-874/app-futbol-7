import assert from 'node:assert/strict'
import { calcularAforo, AFORO_MAX, AFORO_MIN } from '../src/lib/aforo.js'
import { calcularClasificacion, calcularVecesEncargado } from '../src/lib/points.js'
import { sortearCapitanes, sortearCapitanesAhora, capitanesDeLaEleccion } from '../src/lib/encargados.js'
import { capitanDelTurno, estadoEleccion, asignacionesDesdeEleccion } from '../src/lib/eleccion.js'
import { idConvocatoriaActiva, lunesConvocatoriaActiva } from '../src/lib/dates.js'

const t = (ms) => ({ toMillis: () => ms })

// --- aforo: 18 peñistas apuntados a jugar, 3 invitados confirmados ---
const respuestasJuego = Array.from({ length: 18 }, (_, i) => ({ id: `p${i}`, timestamp: t(i) }))
const invitados = [
  { id: 'g0', confirmado: true, timestamp: t(100) },
  { id: 'g1', confirmado: true, timestamp: t(101) },
  { id: 'g2', confirmado: false, timestamp: t(102) },
]
const r1 = calcularAforo({ respuestasJuego, invitados })
assert.equal(r1.peñistasJuegan.length, AFORO_MAX, 'con 18 apuntados, juegan los primeros 16')
assert.equal(r1.peñistasEnEspera.length, 2, 'los 2 restantes quedan en espera')
assert.equal(r1.plazasLibres, 0, 'sin plazas libres para invitados si ya hay 16 peñistas')
assert.equal(r1.invitadosJuegan.length, 0)
assert.equal(r1.invitadosEnEspera.length, 3)
console.log('OK: aforo con exceso de peñistas')

// --- aforo: 13 peñistas, 2 invitados confirmados (deberían completar hasta 15) ---
const respuestas13 = Array.from({ length: 13 }, (_, i) => ({ id: `p${i}`, timestamp: t(i) }))
const invitados2 = [
  { id: 'g0', confirmado: true, timestamp: t(50) },
  { id: 'g1', confirmado: true, timestamp: t(51) },
  { id: 'g2', confirmado: true, timestamp: t(52) },
  { id: 'g3', confirmado: false, timestamp: t(53) },
]
const r2 = calcularAforo({ respuestasJuego: respuestas13, invitados: invitados2 })
assert.equal(r2.plazasLibres, 3)
assert.equal(r2.invitadosJuegan.length, 3, 'los 3 primeros invitados confirmados completan aforo')
assert.equal(r2.totalJugando, 16)
assert.equal(r2.faltanParaMinimo, 0)
console.log('OK: aforo completado con invitados confirmados')

// --- aforo: 10 peñistas, ningún invitado confirmado -> por debajo del mínimo ---
const respuestas10 = Array.from({ length: 10 }, (_, i) => ({ id: `p${i}`, timestamp: t(i) }))
const r3 = calcularAforo({ respuestasJuego: respuestas10, invitados: [{ id: 'g0', confirmado: false, timestamp: t(0) }] })
assert.equal(r3.totalJugando, 10)
assert.equal(r3.faltanParaMinimo, AFORO_MIN - 10)
console.log('OK: aviso de mínimo no alcanzado cuando no se confirman invitados')

// --- clasificación ---
const peñistas = [
  { id: 'a', nombre: 'Ana' },
  { id: 'b', nombre: 'Bea' },
  {
    id: 'c',
    nombre: 'Carlos',
    historialAjustes: [
      { puntos: 2, motivo: 'Trajo la equipación' },
      { puntos: -1, motivo: 'Llegó tarde' },
    ],
  },
]
const convocatorias = [
  {
    resultado: {
      registrado: true,
      ganador: 'A',
      equipoA: [{ id: 'a', tipo: 'peñista' }, { id: 'x', tipo: 'invitado' }],
      equipoB: [{ id: 'b', tipo: 'peñista' }],
      cerveza: ['a'],
    },
  },
  {
    resultado: {
      registrado: true,
      ganador: 'empate',
      equipoA: [{ id: 'a', tipo: 'peñista' }],
      equipoB: [{ id: 'b', tipo: 'peñista' }],
      cerveza: [],
    },
  },
  { resultado: { registrado: false } },
]
const clasificacion = calcularClasificacion(convocatorias, peñistas)
const porId = Object.fromEntries(clasificacion.map((c) => [c.id, c]))
assert.equal(porId.a.puntos, 3 + 0.5 + 2, 'Ana: victoria(3) + cerveza(0.5) + empate(2)')
assert.equal(porId.b.puntos, 1 + 2, 'Bea: derrota(1) + empate(2)')
assert.equal(porId.c.puntos, 1, 'Carlos no jugó pero tiene un ajuste manual neto de +1')
assert.equal(porId.a.partidosJugados, 2)
console.log('OK: clasificación y puntos')

// --- encargados (capitanes): sorteo al azar ---
const conEncargados = [
  ...convocatorias,
  { encargados: ['a', 'b'] },
  { encargados: ['b', 'c'] },
]
const veces = calcularVecesEncargado(conEncargados)
assert.equal(veces.get('a'), 1)
assert.equal(veces.get('b'), 2)
assert.equal(veces.get('c'), 1)
console.log('OK: veces encargado')

// Sorteo automático: dos capitanes distintos de entre los candidatos, y
// siempre los mismos (y en el mismo orden) para la misma convocatoria.
const candidatos = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const sorteo = sortearCapitanes(candidatos, '2026-11-30')
assert.equal(sorteo.length, 2)
assert.notEqual(sorteo[0], sorteo[1])
assert.equal(sorteo.every((id) => candidatos.includes(id)), true)
for (let i = 0; i < 20; i++) {
  assert.deepEqual(sortearCapitanes([...candidatos].reverse(), '2026-11-30'), sorteo, 'fijo para la misma convocatoria')
}
assert.deepEqual(sortearCapitanes(['a'], '2026-11-30'), [], 'con uno solo no hay sorteo')

// Es aleatorio de verdad a lo largo de las semanas: todos salen capitanes
// alguna vez, y unas veces empieza uno y otras el otro.
const vecesCapitan = new Map()
const vecesEmpieza = new Map()
let semanas = 0
for (let d = new Date(2026, 0, 5); d.getFullYear() < 2031; d.setDate(d.getDate() + 7)) {
  const id = d.toISOString().slice(0, 10)
  const [blanco, amarillo] = sortearCapitanes(candidatos, id)
  for (const c of [blanco, amarillo]) vecesCapitan.set(c, (vecesCapitan.get(c) ?? 0) + 1)
  vecesEmpieza.set(amarillo, (vecesEmpieza.get(amarillo) ?? 0) + 1)
  semanas++
}
for (const c of candidatos) {
  const v = vecesCapitan.get(c) ?? 0
  assert.ok(v > semanas * 0.12 && v < semanas * 0.38, `reparto razonable de capitanías para ${c}: ${v}/${semanas}`)
  assert.ok((vecesEmpieza.get(c) ?? 0) > 0, `${c} empieza alguna vez`)
}

// Que se apunte alguien nuevo solo cambia los capitanes si le toca a él.
const conNuevo = sortearCapitanes([...candidatos, 'z'], '2026-11-30')
assert.ok(conNuevo.includes('z') || conNuevo.every((id) => sorteo.includes(id)), 'no se re-sortea todo')

// Sorteo del botón del admin: dos distintos de la lista.
const delAdmin = sortearCapitanesAhora(candidatos)
assert.equal(new Set(delAdmin).size, 2)
assert.equal(delAdmin.every((id) => candidatos.includes(id)), true)
console.log('OK: elección de encargados')

// --- elección de equipos por turnos ---
assert.deepEqual(
  Array.from({ length: 9 }, (_, n) => capitanDelTurno(n) + 1),
  [2, 1, 1, 2, 1, 2, 1, 2, 1],
  'orden: abre el Amarillo, luego el Blanco dos y alternos',
)

const participantesPartido = ['c1', 'c2', 'j1', 'j2', 'j3', 'j4', 'j5'].map((id) => ({ id, tipo: 'peñista', nombre: id }))
const capitanesPartido = ['c1', 'c2']
let e = estadoEleccion({ capitanes: capitanesPartido, elecciones: [], participantes: participantesPartido })
assert.equal(e.idCapitanTurno, 'c2', 'empieza el capitán Amarillo')
assert.equal(e.equipoTurno, 'B')
assert.equal(e.libres.length, 5, 'los capitanes no se eligen')
assert.equal(e.terminada, false)

const eleccionesPartido = [
  { id: 'j1', equipo: 'B', porId: 'c2' },
  { id: 'j2', equipo: 'A', porId: 'c1' },
  { id: 'j3', equipo: 'A', porId: 'c1' },
  { id: 'j4', equipo: 'B', porId: 'c2' },
  { id: 'j5', equipo: 'A', porId: 'c1' },
]
e = estadoEleccion({ capitanes: capitanesPartido, elecciones: eleccionesPartido.slice(0, 3), participantes: participantesPartido })
assert.equal(e.idCapitanTurno, 'c2', 'tras Amarillo, Blanco, Blanco vuelve a tocar al Amarillo')
e = estadoEleccion({ capitanes: capitanesPartido, elecciones: eleccionesPartido, participantes: participantesPartido })
assert.equal(e.terminada, true)
assert.deepEqual(e.equipoA.map((m) => m.id), ['c1', 'j2', 'j3', 'j5'])
assert.deepEqual(e.equipoB.map((m) => m.id), ['c2', 'j1', 'j4'])
assert.equal(e.hayDesapuntados, false)

// Alguien elegido se borra después: se marca y no entra en el resultado.
const sinJ4 = participantesPartido.filter((p) => p.id !== 'j4')
e = estadoEleccion({ capitanes: capitanesPartido, elecciones: eleccionesPartido, participantes: sinJ4 })
assert.equal(e.hayDesapuntados, true)
assert.equal(e.equipoB.find((m) => m.id === 'j4').sigueApuntado, false)
const asignaciones = asignacionesDesdeEleccion({ capitanes: capitanesPartido, elecciones: eleccionesPartido, participantes: sinJ4 })
assert.deepEqual(asignaciones, { c1: 'A', c2: 'B', j1: 'B', j2: 'A', j3: 'A', j5: 'A' })

// Capitanes: fijados si la elección ya empezó; si no, los del admin si siguen
// apuntados; si no, los automáticos.
const baseCapitanes = { idConvocatoria: '2026-11-16', convocatorias, peñistas }
assert.deepEqual(
  capitanesDeLaEleccion({ ...baseCapitanes, eleccion: { capitanes: ['b', 'c'] }, encargadosAdmin: ['a', 'b'], candidatosIds: ['a', 'b', 'c'] }),
  { capitanes: ['b', 'c'], fijados: true },
)
assert.deepEqual(
  capitanesDeLaEleccion({ ...baseCapitanes, eleccion: null, encargadosAdmin: ['c', 'b'], candidatosIds: ['a', 'b', 'c'] }).capitanes,
  ['c', 'b'],
)
assert.deepEqual(
  capitanesDeLaEleccion({ ...baseCapitanes, eleccion: null, encargadosAdmin: ['c', 'zz'], candidatosIds: ['a', 'b', 'c'] }).capitanes,
  sortearCapitanes(['a', 'b', 'c'], '2026-11-16'),
  'si un encargado del admin ya no juega, se usa el sorteo automático',
)
assert.equal(capitanesDeLaEleccion({ ...baseCapitanes, eleccion: null, candidatosIds: ['a'] }), null)
console.log('OK: elección de equipos por turnos')

// --- fechas: convocatoria activa siempre es un lunes ---
for (const fecha of [
  new Date(2026, 8, 13), // domingo
  new Date(2026, 8, 14, 10), // lunes por la mañana
  new Date(2026, 8, 14, 22), // lunes después del partido
  new Date(2026, 8, 17), // jueves
]) {
  const lunes = lunesConvocatoriaActiva(fecha)
  assert.equal(lunes.getDay(), 1, `debe caer en lunes para ${fecha}`)
}

// De martes a jueves sigue activo el lunes de esa semana (2026-09-14), para
// dar tiempo a anotar el resultado; el viernes salta ya al siguiente.
assert.equal(idConvocatoriaActiva(new Date(2026, 8, 14, 22)), '2026-09-14', 'lunes por la noche: sigue siendo esa convocatoria')
assert.equal(idConvocatoriaActiva(new Date(2026, 8, 15, 9)), '2026-09-14', 'martes: sigue siendo la del lunes')
assert.equal(idConvocatoriaActiva(new Date(2026, 8, 17, 9)), '2026-09-14', 'jueves: sigue siendo la del lunes')
assert.equal(idConvocatoriaActiva(new Date(2026, 8, 18, 9)), '2026-09-21', 'viernes: ya se abre la siguiente')
assert.equal(idConvocatoriaActiva(new Date(2026, 8, 20, 9)), '2026-09-21', 'domingo: sigue abierta la siguiente')
console.log('OK: cálculo de la convocatoria activa')

console.log('\nTodas las comprobaciones de lógica pasaron correctamente.')
