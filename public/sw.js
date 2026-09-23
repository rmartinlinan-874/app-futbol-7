// Service worker mínimo: no cachea nada (la app necesita datos en vivo de
// Firestore), pero es necesario para que el navegador trate la app como
// instalable de verdad (pantalla completa al añadirla al inicio) y es la
// base sobre la que más adelante se pueden añadir notificaciones push.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})
