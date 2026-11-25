/**
 * Efectos de sonido de la convocatoria: aplauso al pulsar "Juego" y abucheo
 * al pulsar "No juego". Se fabrican con la Web Audio API del navegador (ruido
 * y osciladores), sin archivos de audio: no pesan nada y no hay derechos de
 * nadie de por medio.
 *
 * Los navegadores solo dejan sonar audio tras un toque del usuario, así que
 * prepararAudio() hay que llamarlo DENTRO del manejador del clic (antes de
 * cualquier await) y después ya se puede reproducir aunque se tarde un poco.
 */

const CLAVE_SILENCIO = 'apppena_sin_sonidos'
let ctx = null

export function sonidosActivados() {
  try {
    return localStorage.getItem(CLAVE_SILENCIO) !== '1'
  } catch {
    return true
  }
}

export function activarSonidos(activos) {
  try {
    if (activos) localStorage.removeItem(CLAVE_SILENCIO)
    else localStorage.setItem(CLAVE_SILENCIO, '1')
  } catch {
    // sin almacenamiento local: el cambio dura mientras la app esté abierta
  }
}

/** Llamar dentro del clic: crea o despierta el contexto de audio. */
export function prepararAudio() {
  if (!sonidosActivados()) return null
  const Contexto = window.AudioContext || window.webkitAudioContext
  if (!Contexto) return null
  if (!ctx) ctx = new Contexto()
  if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  return ctx
}

function bufferRuido(ac, segundos) {
  const buffer = ac.createBuffer(1, Math.ceil(ac.sampleRate * segundos), ac.sampleRate)
  const datos = buffer.getChannelData(0)
  for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1
  return buffer
}

/** Aplauso de grada: muchas palmadas sueltas que crecen y se apagan. */
export function aplauso() {
  const ac = prepararAudio()
  if (!ac) return
  const ahora = ac.currentTime + 0.02
  const duracion = 2.6
  const ruido = bufferRuido(ac, 0.08)
  const salida = ac.createGain()
  salida.gain.value = 1.5
  salida.connect(ac.destination)

  const palmadas = 170
  for (let i = 0; i < palmadas; i++) {
    // Más densas al principio y luego se van apagando.
    const t = ahora + Math.pow(Math.random(), 1.4) * duracion
    const fuente = ac.createBufferSource()
    fuente.buffer = ruido
    fuente.playbackRate.value = 0.8 + Math.random() * 0.5

    const filtro = ac.createBiquadFilter()
    filtro.type = 'bandpass'
    filtro.frequency.value = 900 + Math.random() * 1800
    filtro.Q.value = 0.9 + Math.random() * 1.2

    const env = ac.createGain()
    const volumen = (0.25 + Math.random() * 0.75) * Math.max(0.15, 1 - (t - ahora) / duracion)
    env.gain.setValueAtTime(0, t)
    env.gain.linearRampToValueAtTime(volumen, t + 0.002)
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.03 + Math.random() * 0.04)

    const panorama = ac.createStereoPanner ? ac.createStereoPanner() : null
    if (panorama) panorama.pan.value = Math.random() * 1.6 - 0.8

    fuente.connect(filtro)
    filtro.connect(env)
    if (panorama) {
      env.connect(panorama)
      panorama.connect(salida)
    } else {
      env.connect(salida)
    }
    fuente.start(t)
    fuente.stop(t + 0.1)
  }
}

/** Abucheo de grada: un "buuuh" de varias voces graves que cae de tono. */
export function abucheo() {
  const ac = prepararAudio()
  if (!ac) return
  const ahora = ac.currentTime + 0.02
  const duracion = 1.9

  const salida = ac.createGain()
  salida.gain.setValueAtTime(0, ahora)
  salida.gain.linearRampToValueAtTime(0.85, ahora + 0.25)
  salida.gain.setValueAtTime(0.85, ahora + duracion - 0.6)
  salida.gain.linearRampToValueAtTime(0, ahora + duracion)

  // Filtro tipo vocal "u": deja pasar los graves y apaga los agudos.
  const vocal = ac.createBiquadFilter()
  vocal.type = 'lowpass'
  vocal.frequency.value = 520
  vocal.Q.value = 6
  vocal.connect(salida)
  salida.connect(ac.destination)

  const voces = 9
  for (let i = 0; i < voces; i++) {
    const osc = ac.createOscillator()
    osc.type = 'sawtooth'
    const base = 105 + Math.random() * 70
    const inicio = ahora + Math.random() * 0.18
    osc.frequency.setValueAtTime(base * 1.12, inicio)
    osc.frequency.linearRampToValueAtTime(base, inicio + 0.35)
    osc.frequency.linearRampToValueAtTime(base * 0.86, ahora + duracion)

    // Un poco de temblor, como un grupo de gente y no una máquina.
    const lfo = ac.createOscillator()
    const lfoGanancia = ac.createGain()
    lfo.frequency.value = 4 + Math.random() * 3
    lfoGanancia.gain.value = 2 + Math.random() * 3
    lfo.connect(lfoGanancia)
    lfoGanancia.connect(osc.frequency)

    const g = ac.createGain()
    g.gain.value = 0.5 / voces + Math.random() * 0.03
    osc.connect(g)
    g.connect(vocal)
    osc.start(inicio)
    lfo.start(inicio)
    osc.stop(ahora + duracion + 0.05)
    lfo.stop(ahora + duracion + 0.05)
  }

  // Algo de murmullo de fondo.
  const murmullo = ac.createBufferSource()
  murmullo.buffer = bufferRuido(ac, duracion)
  const filtroMurmullo = ac.createBiquadFilter()
  filtroMurmullo.type = 'bandpass'
  filtroMurmullo.frequency.value = 400
  filtroMurmullo.Q.value = 0.7
  const gMurmullo = ac.createGain()
  gMurmullo.gain.value = 0.12
  murmullo.connect(filtroMurmullo)
  filtroMurmullo.connect(gMurmullo)
  gMurmullo.connect(salida)
  murmullo.start(ahora)
}
