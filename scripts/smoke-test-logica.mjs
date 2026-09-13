import assert from 'node:assert/strict'
import { calcularAforo, AFORO_MAX, AFORO_MIN } from '../src/lib/aforo.js'
import { calcularClasificacion } from '../src/lib/points.js'
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
  { id: 'c', nombre: 'Carlos' },
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
assert.equal(porId.a.puntos, 3 + 1 + 2, 'Ana: victoria(3) + cerveza(1) + empate(2)')
assert.equal(porId.b.puntos, 1 + 2, 'Bea: derrota(1) + empate(2)')
assert.equal(porId.c.puntos, 0, 'Carlos no jugó, 0 puntos')
assert.equal(porId.a.partidosJugados, 2)
console.log('OK: clasificación y puntos')

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
assert.equal(idConvocatoriaActiva(new Date(2026, 8, 14, 22)).endsWith('09-21'), true, 'tras el partido del lunes, salta al lunes siguiente')
console.log('OK: cálculo de la convocatoria activa')

console.log('\nTodas las comprobaciones de lógica pasaron correctamente.')
