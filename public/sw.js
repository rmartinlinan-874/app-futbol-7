// Service worker: no cachea nada (la app necesita datos en vivo de
// Firestore), pero es necesario para que el navegador trate la app como
// instalable de verdad (pantalla completa al añadirla al inicio) y para
// poder recibir notificaciones push en segundo plano.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Firebase Messaging necesita inicializarse aquí también para poder mostrar
// las notificaciones cuando la app no está abierta. Las claves son las
// mismas que ya van incrustadas en el JS de la app (son públicas por
// diseño, no son secretas).
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: 'AIzaSyCQzYSnw5CDmYWG20ceNi7kn4GOsH40rLQ',
  authDomain: 'app-futbol-7.firebaseapp.com',
  projectId: 'app-futbol-7',
  storageBucket: 'app-futbol-7.firebasestorage.app',
  messagingSenderId: '763169874663',
  appId: '1:763169874663:web:35d64889432f304717b842',
})

// Con un payload "notification" (como el que envía el script de avisos),
// el propio SDK ya muestra la notificación del sistema sin más código; solo
// hace falta que messaging esté inicializado para que esto funcione con la
// app cerrada o en segundo plano.
firebase.messaging()
