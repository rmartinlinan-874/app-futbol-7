# App Peña

App web para gestionar la convocatoria semanal de la peña: quién juega, invitados,
sorteo de encargados, resultado del partido, cerveza postpartido y clasificación de
la temporada. Sin cuentas de usuario: cada peñista elige su nombre de una lista.

Construida con React + Vite y Firebase (Firestore + Auth anónima), pensada para
desplegarse gratis en GitHub Pages.

## Puesta en marcha (desarrollo)

```bash
npm install
```

Para desarrollar **sin** un proyecto Firebase real, usando los emuladores locales
(recomendado para trastear con la app):

```bash
cp .env.example .env
# deja VITE_USE_EMULATOR=true y el resto de VITE_FIREBASE_* vacío
npm run emuladores   # terminal 1: arranca Auth + Firestore emulados
npm run dev          # terminal 2: arranca la app
```

Los datos de los emuladores se pierden al pararlos (no hay persistencia entre
sesiones salvo que se use `--export-on-exit`).

## Configurar tu proyecto Firebase real

1. Crea un proyecto en <https://console.firebase.google.com> (plan gratuito Spark
   es suficiente).
2. Dentro del proyecto, activa **Firestore Database** (modo producción) y, en
   **Authentication → Sign-in method**, activa el proveedor **Anónimo**.
3. En **Configuración del proyecto → Tus apps**, crea una app web y copia sus
   claves.
4. Copia `.env.example` a `.env` y rellena `VITE_FIREBASE_*` con esas claves
   (deja `VITE_USE_EMULATOR=false` o bórralo).
5. Despliega las reglas de seguridad (`firestore.rules`) a tu proyecto:

   ```bash
   firebase login
   firebase use --add          # elige tu proyecto real
   firebase deploy --only firestore:rules
   ```

Al abrir la app por primera vez contra un proyecto nuevo, se crea automáticamente
el documento `config/general` con nombre de peña **"Mi Peña"** y PIN de admin
**1234**. Entra en la pestaña **Admin** con ese PIN y, desde **Ajustes**, cambia el
nombre de la peña y el PIN; desde **Peñistas**, da de alta a la plantilla real.

## Publicar

Cada cambio que se sube a `main` se publica solo en GitHub Pages
(`.github/workflows/publicar.yml`), usando la configuración pública de
Firebase que está en `.env.production`. Si cambia `firestore.rules`, las reglas
se despliegan solas con la cuenta de servicio de los avisos
(`.github/workflows/reglas.yml`). `npm run deploy` desde un ordenador sigue
funcionando como alternativa.

La app queda en <https://rmartinlinan-874.github.io/app-futbol-7/>.

## Reglas de negocio implementadas

- **Convocatoria activa**: de lunes a jueves sigue siendo la del lunes de esa
  semana (el partido ya jugado o a punto de jugarse), para dar tiempo al admin
  a registrar el resultado y las cervezas. El viernes se abre la convocatoria
  del lunes siguiente.
- **Aforo**: mínimo 14, máximo 16. Los peñistas que dicen "juego" tienen prioridad
  por orden de apunte; si son más de 16, los últimos quedan en lista de espera.
  Los invitados **nunca** se añaden solos: el admin decide a quién confirma
  (pestaña Admin → Convocatoria → "Completar aforo con invitados"), respetando el
  orden de apunte como guía.
- **Gestión de asistencia por el admin**: desde Admin → Convocatoria → "Gestionar
  convocatoria", el admin puede marcar "Juega" / "No juega" o borrar la respuesta
  de cualquier peñista, por si no ha podido hacerlo él mismo.
- **Equipos**: se llaman "Blanco" y "Amarillo" (internamente se siguen guardando
  como A/B, es solo una cuestión de etiqueta).
- **Puntos**: victoria 3, empate 2, derrota 1, no jugar 0. Cerveza postpartido +0,5
  (acumulable). Los invitados no puntúan ni salen en la clasificación.
- **Encargados (capitanes)**: salen al azar entre los peñistas confirmados para
  jugar ese día (nunca invitados), y también al azar quién empieza a elegir. El
  sorteo automático usa la fecha de la convocatoria como semilla, así que todos
  los móviles sacan los mismos capitanes sin que nadie tenga que sortear. El
  admin puede volver a sortear con un botón (sorteo distinto cada vez).
- **Elección de equipos**: en la pestaña Convocatoria, los dos capitanes eligen
  jugadores por turnos desde su móvil. Empieza el que haya salido en el sorteo
  (lleva el Amarillo), luego el otro (Blanco) elige dos seguidos y a partir de ahí
  alternos. No se deciden capitanes hasta que haya al menos 14 apuntados para
  jugar (el mínimo del aforo, contando invitados confirmados). Los capitanes
  quedan fijados con la primera elección; hasta entonces son provisionales. Cada
  capitán puede deshacer su última elección mientras el otro no haya elegido, y
  el admin puede reiniciar la elección entera. Los equipos que salen se cargan
  solos en el formulario de resultado. Se guarda en
  `convocatorias/{id}/eleccion/estado` y cada movimiento va en una transacción.
- **Cena de Navidad** (`src/lib/cena.js`): hasta el día de la cena, cada peñista
  tiene que decir si va (y, si va, votar hasta 4 entrantes y elegir su plato
  principal) antes de poder marcar si juega. Se guarda en
  `cenas/{id}/respuestas/{peñista}`. El resumen (votos, platos, total y texto
  para el restaurante) está en Admin → Cena. Para otra cena basta con cambiar el
  objeto `CENA`.
- **Avisos**: cada peñista puede tener varios dispositivos (`fcmTokens`). Al
  abrir la app con el permiso concedido, el token se renueva en silencio.
- **Fotos de perfil**: cualquier peñista puede subir o cambiar la foto de
  cualquiera (no hay contraseñas, ver "Seguridad" más abajo) tocando su
  avatar en la barra superior. Se guardan como imagen pequeña incrustada en
  el propio documento del peñista en Firestore -sin Firebase Storage, que
  desde 2024 requiere plan de pago (Blaze)-, así que la app entera sigue
  funcionando en el plan gratuito (Spark).

## Seguridad (PIN de admin)

No hay backend propio, así que el PIN de admin se valida con las reglas de
Firestore (`firestore.rules`): cada escritura de admin incluye el PIN y las
reglas comprueban que coincide con el guardado en `config/general`. Es una
protección sencilla frente a peñistas curiosos, **no** seguridad de nivel
bancario — no hay datos sensibles en juego, solo quién juega al fútbol.

## Estructura del código

- `src/lib/aforo.js`, `src/lib/points.js`, `src/lib/dates.js` — lógica de
  negocio pura (aforo, puntos, cálculo de la convocatoria activa).
- `src/lib/actions.js` — todas las escrituras a Firestore.
- `src/hooks/` — suscripciones en tiempo real a Firestore y estado local
  (peñista elegido, sesión de admin).
- `src/components/` — pantallas; `src/components/admin/` — panel de admin.
- `scripts/smoke-test-logica.mjs` — comprobaciones rápidas de la lógica pura
  (`node scripts/smoke-test-logica.mjs`).
