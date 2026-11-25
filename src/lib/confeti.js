const COLORES = ['#ff3d77', '#7b2ff7', '#00b8e6', '#15a34a', '#ffb800', '#ffffff']

/** Lluvia de confeti sin librerías: unos cuantos <span> que caen y se borran. */
export function lanzarConfeti(cantidad = 90) {
  if (typeof document === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  for (let i = 0; i < cantidad; i++) {
    const trozo = document.createElement('span')
    trozo.className = 'confeti'
    const duracion = 1.6 + Math.random() * 1.6
    trozo.style.left = `${Math.random() * 100}vw`
    trozo.style.background = COLORES[i % COLORES.length]
    trozo.style.animationDuration = `${duracion}s`
    trozo.style.animationDelay = `${Math.random() * 0.4}s`
    trozo.style.setProperty('--deriva', `${(Math.random() - 0.5) * 160}px`)
    trozo.style.setProperty('--giro', `${360 + Math.random() * 720}deg`)
    document.body.appendChild(trozo)
    setTimeout(() => trozo.remove(), (duracion + 0.5) * 1000)
  }
}

export function modoWillyActivo() {
  return typeof document !== 'undefined' && document.body.classList.contains('modo-willy')
}
